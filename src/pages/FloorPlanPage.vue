<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Plano de mesas</div>
      <q-space />
      <div class="row items-center q-gutter-sm">
        <q-input v-model="selectedDate" type="date" label="Fecha" dense outlined style="min-width: 180px" />
        <q-select v-model="selectedHour" :options="hourOptions" label="Hora" dense outlined emit-value map-options style="min-width: 140px" />
        <div class="row items-center q-gutter-xs" style="min-width: 220px">
          <div class="text-caption text-grey-5" style="width:56px">Zoom</div>
          <q-slider
            v-model.number="zoomPercent"
            :min="50"
            :max="200"
            :step="1"
            color="primary"
            label
            label-always
            :label-value="`${zoomPercent}%`"
            style="width: 160px"
          />
        </div>
      </div>
      <q-btn color="amber-7" class="q-ml-sm" icon="add_box" round push glossy @click="addBox" />
    </div>

    <div ref="stageContainer" class="bg-grey-10" style="border-radius:8px; overflow:hidden; width: 100%; max-height: 75vh; height: auto; aspect-ratio: 16 / 9; display:flex; align-items:center; justify-content:center;">
      <v-stage :config="stageConfig" @wheel="onWheel" :style="{ width: stageWidth + 'px', height: stageHeight + 'px' }">
        <v-layer ref="layerRef">
          <v-group v-for="t in nodes" :key="t.id" :config="nodeGroupConfig(t)" @dragend="onDragEnd(t, $event)" >
            <v-rect v-if="t.shape==='square'" :config="rectConfig(t)" />
            <v-circle v-else :config="circleConfig(t)" />
            <v-text :config="textConfig(t)" />
            <v-text :config="capacityConfig(t)" />
          </v-group>

          <v-group v-for="b in boxes" :key="b.id" :config="{ x: b.x, y: b.y, draggable: true }" @dragend="onBoxDragEnd(b, $event)" @dblclick="openBoxDialog(b)">
            <v-rect :config="{ width: b.width, height: b.height, cornerRadius: 8, fill: b.color, opacity: 0.9, shadowColor: 'black', shadowBlur: 4 }" />
            <v-text :config="{ text: b.label, fontSize: 30, fill: '#fff', align: 'center', width: b.width, y: b.height/2 - 20 }" />
          </v-group>
        </v-layer>
      </v-stage>
    </div>

    <!-- Panel lateral de edición de rectángulos -->
    <q-card v-if="boxPanel.open" class="box-sidepanel q-pa-md">
      <div class="row items-center no-wrap q-mb-md">
        <div class="text-h6">Editar rectángulo</div>
        <q-space />
        <q-btn dense round flat icon="close" @click="boxPanel.open = false" />
      </div>
      <div class="q-gutter-md">
        <div>
          <div class="text-caption text-grey-5">Ancho: {{ boxPanel.form.width }} px</div>
          <q-slider v-model.number="boxPanel.form.width" :min="10" :max="1000" :step="1" label label-always color="primary" :label-value="`${boxPanel.form.width}px`" />
        </div>
        <div>
          <div class="text-caption text-grey-5">Alto: {{ boxPanel.form.height }} px</div>
          <q-slider v-model.number="boxPanel.form.height" :min="10" :max="1000" :step="1" label label-always color="primary" :label-value="`${boxPanel.form.height}px`" />
        </div>
        <q-input v-model="boxPanel.form.label" label="Texto" dense outlined />
        <q-color v-model="boxPanel.form.color" default-value="#E4B860" style="max-width: 240px" />
      </div>
      <div class="q-mt-lg row items-center">
        <q-btn color="negative" flat icon="delete" label="Eliminar" @click="deleteBoxPanel" />
        <q-space />
        <q-btn color="primary" label="Guardar" @click="saveBoxPanel" />
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTablesStore } from 'src/stores/tables-store'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useFloorPlanStore } from 'src/stores/floor-plan-store'
import { useSettingsStore } from 'src/stores/settings-store'
import { date as qdate } from 'quasar'

const tables = useTablesStore()
const reservations = useReservationsStore()
const plan = useFloorPlanStore()
const settings = useSettingsStore()

const stageWidth = ref(0)
const stageHeight = ref(0)
const scale = ref(plan.zoom || 1)
const ZOOM_STEP = 0.1
const MIN_SCALE = 0.5
const MAX_SCALE = 2

const CANVAS_W = 1920
const CANVAS_H = 1080
const ASPECT = 16 / 9
const baseScale = computed(() => {
  if (!stageWidth.value || !stageHeight.value) return 1
  const sx = stageWidth.value / CANVAS_W
  const sy = stageHeight.value / CANVAS_H
  return Math.min(sx, sy)
})
const stageConfig = computed(() => ({ width: stageWidth.value, height: stageHeight.value, draggable: false, scale: { x: baseScale.value * scale.value, y: baseScale.value * scale.value } }))

const today = qdate.formatDate(new Date(), 'YYYY-MM-DD')
const selectedDate = ref(today)
const selectedHour = ref(String(new Date().getHours()).padStart(2, '0'))
const hourOptions = Array.from({ length: 24 }).map((_, h) => ({ label: `${String(h).padStart(2,'0')}:00`, value: String(h).padStart(2,'0') }))

const defaultNodes = computed(() => tables.tables.map((t, i) => {
  const layout = plan.tableLayoutById(t.id)
  const gridX = 120 + (i % 6) * 180
  const gridY = 120 + Math.floor(i / 6) * 180
  return {
    id: t.id,
    label: tableLabel(t.id, t.name),
    capacity: t.capacity,
    shape: layout?.shape || (i === 6 ? 'circle' : 'square'),
    color: availabilityColor(t.id),
    x: typeof layout?.x === 'number' ? layout.x : gridX,
    y: typeof layout?.y === 'number' ? layout.y : gridY,
  }
}))

const nodes = ref(defaultNodes.value)
watch(() => tables.tables, () => { nodes.value = defaultNodes.value }, { deep: true })
watch(() => plan.tablesLayout, () => { nodes.value = defaultNodes.value }, { deep: true })
watch([selectedDate, selectedHour], () => { nodes.value = defaultNodes.value })
watch(() => reservations.reservations, () => { nodes.value = defaultNodes.value }, { deep: true })

const boxes = computed(() => plan.boxes)

function hasReservationAtHour(tableId, dateStr, hourStr) {
  const prefix = `${hourStr}:`
  return reservations.reservations.some((r) => r.tableId === tableId && r.date === dateStr && r.time.startsWith(prefix) && r.status !== 'cancelled')
}
function availabilityColor(tableId) {
  const occupied = hasReservationAtHour(tableId, selectedDate.value, selectedHour.value)
  return occupied ? '#E57373' : '#35B57E'
}

function tableLabel(tableId, name) {
  const prefix = `${selectedHour.value}:`
  const times = reservations.reservations
    .filter((r) => r.tableId === tableId && r.date === selectedDate.value && r.time.startsWith(prefix) && r.status !== 'cancelled')
    .map((r) => r.time)
    .sort()
  return times.length ? `${name} — ${times[0]}` : name
}

function nodeGroupConfig(t) { return { x: t.x, y: t.y, draggable: true, id: t.id } }
function rectConfig(t) { return { width: 120, height: 120, fill: t.color, cornerRadius: 8, shadowColor: 'black', shadowBlur: 4, opacity: 0.95 } }
function circleConfig(t) { return { radius: 90, fill: t.color, shadowColor: 'black', shadowBlur: 4, opacity: 0.95 } }
function textConfig(t) { return { text: t.label, fontSize: 20, fill: '#fff', align: 'center', width: 140, x: t.shape==='circle'? -70:-10, y: t.shape==='circle' ? -10 : 42 } }
function capacityConfig(t) { return { text: `${t.capacity}`, fontSize: 18, fill: 'rgba(0,0,0,0.35)', align: 'center', width: 120, x: t.shape==='circle'? -60:0, y: t.shape==='circle' ? 56 : 90 } }

async function onDragEnd(t, evt) {
  const { x, y } = evt.target.position()
  const idx = nodes.value.findIndex((n) => n.id === t.id)
  if (idx !== -1) nodes.value[idx] = { ...nodes.value[idx], x, y }
  await plan.upsertTableLayout({ id: t.id, x, y, shape: t.shape })
}

// quitar alta de mesa desde esta página (botón removido)

function onWheel(e) {
  e.evt.preventDefault()
  const delta = e.evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta))
  plan.setZoom(scale.value)
  console.log('[FloorPlan] onWheel zoom:', { delta: e.evt.deltaY, step: delta, userScale: scale.value, baseScale: baseScale.value, effectiveScale: baseScale.value * scale.value })
}
// quitar botón de restablecer zoom (función ya no usada)

const layerRef = ref(null)
const stageContainer = ref(null)

const zoomPercent = computed({
  get: () => Math.round(scale.value * 100),
  set: (val) => {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(val) / 100))
    scale.value = s
    plan.setZoom(s)
    settings.save('zoomPercent', Math.round(s * 100))
    console.log('[FloorPlan] Zoom manual cambiado:', { percent: val, clampedPercent: Math.round(s * 100), scale: s })
  },
})

// Logs de diagnóstico
watch([stageWidth, stageHeight], () => {
  console.log('[FloorPlan] Dimensiones contenedor:', { width: stageWidth.value, height: stageHeight.value })
})
watch(baseScale, (bs) => {
  console.log('[FloorPlan] baseScale recalculado:', { baseScale: bs, container: { w: stageWidth.value, h: stageHeight.value }, canvas: { w: CANVAS_W, h: CANVAS_H } })
})
watch(scale, (s) => {
  const eff = (baseScale.value * s)
  console.log('[FloorPlan] scale de usuario cambiado:', { scale: s, baseScale: baseScale.value, effectiveScale: eff })
})

let resizeObserver
onMounted(async () => {
  if (stageContainer.value) {
    const rect = stageContainer.value.getBoundingClientRect()
    const fitByAspect = (r) => {
      const containerW = r.width
      const containerH = r.height
      const targetH = containerW / ASPECT
      if (targetH <= containerH) {
        return { w: containerW, h: targetH }
      }
      const targetW = containerH * ASPECT
      return { w: targetW, h: containerH }
    }
    const fitted = fitByAspect(rect)
    // Sincronizar tamaño del contenedor con el stage exacto para evitar franjas laterales
    stageWidth.value = Math.floor(fitted.w)
    stageHeight.value = Math.floor(fitted.h)
    console.log('[FloorPlan] onMounted: contenedor, fitted', { container: { width: rect.width, height: rect.height }, fitted })
    resizeObserver = new ResizeObserver(() => {
      const r = stageContainer.value.getBoundingClientRect()
      // Si el contenedor usa aspect-ratio, getBoundingClientRect ya viene “fitted”.
      // Aún así, reafirmamos 16:9 con fitByAspect para navegadores sin soporte.
      const f = fitByAspect(r)
      stageWidth.value = Math.floor(f.w)
      stageHeight.value = Math.floor(f.h)
      console.log('[FloorPlan] ResizeObserver: contenedor cambió (fitted)', { container: { width: r.width, height: r.height }, fitted: f })
    })
    resizeObserver.observe(stageContainer.value)
  }
  await settings.loadAll()
  // restaurar zoom si existe en settings (guardado como porcentaje)
  const persistedZoomPercent = Number(settings.zoomPercent)
  if (!Number.isNaN(persistedZoomPercent) && persistedZoomPercent > 0) {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, persistedZoomPercent / 100))
    scale.value = s
    plan.setZoom(s)
  }
  await tables.fetchAll()
  await plan.fetchAll()
  await reservations.fetchByDay(selectedDate.value)
})
watch(selectedDate, async (d) => { if (d) await reservations.fetchByDay(d) })
onUnmounted(() => { if (resizeObserver) resizeObserver.disconnect() })

function addBox() { plan.addBox({}) }
function onBoxDragEnd(b, evt) {
  const { x, y } = evt.target.position()
  plan.updateBox(b.id, { x, y })
}

// Panel lateral
const boxPanel = ref({ open: false, id: null, form: { width: 420, height: 140, label: '', color: '#E4B860' } })
function openBoxDialog(b) { // conservar doble clic como trigger
  boxPanel.value = { open: true, id: b.id, form: { width: b.width, height: b.height, label: b.label, color: b.color } }
}
async function saveBoxPanel() {
  await plan.updateBox(boxPanel.value.id, { ...boxPanel.value.form })
  boxPanel.value.open = false
}

async function deleteBoxPanel() {
  if (!boxPanel.value.id) return
  await plan.removeBox(boxPanel.value.id)
  boxPanel.value.open = false
}

// Edición reactiva en vivo del rectángulo seleccionado
watch(() => boxPanel.value.form.width, (w) => {
  if (!boxPanel.value.open) return
  const idx = plan.boxes.findIndex((x) => x.id === boxPanel.value.id)
  if (idx !== -1) plan.boxes[idx].width = Number(w)
})
watch(() => boxPanel.value.form.height, (h) => {
  if (!boxPanel.value.open) return
  const idx = plan.boxes.findIndex((x) => x.id === boxPanel.value.id)
  if (idx !== -1) plan.boxes[idx].height = Number(h)
})
watch(() => boxPanel.value.form.label, (t) => {
  if (!boxPanel.value.open) return
  const idx = plan.boxes.findIndex((x) => x.id === boxPanel.value.id)
  if (idx !== -1) plan.boxes[idx].label = t
})
watch(() => boxPanel.value.form.color, (c) => {
  if (!boxPanel.value.open) return
  const idx = plan.boxes.findIndex((x) => x.id === boxPanel.value.id)
  if (idx !== -1) plan.boxes[idx].color = c
})
</script>

<style scoped>
.box-sidepanel {
  position: fixed;
  top: 64px;
  right: 16px;
  width: 320px;
  max-height: calc(100vh - 96px);
  overflow: auto;
  z-index: 1000;
}
</style>


