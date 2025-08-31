<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Plano de mesas</div>
      <q-space />
      <div class="row items-center q-gutter-sm">
        <q-input v-model="selectedDate" type="date" label="Fecha" dense outlined style="min-width: 180px" />
        <q-select v-model="selectedHour" :options="hourOptions" label="Hora" dense outlined emit-value map-options style="min-width: 140px" />
      </div>
      <q-btn color="primary" label="Añadir mesa" @click="addTableNode" :loading="adding" />
      <q-btn color="amber-7" class="q-ml-sm" label="Añadir rectángulo" @click="addBox" />
      <q-btn flat label="Restablecer zoom" @click="resetZoom" />
    </div>

    <div ref="stageContainer" class="bg-grey-10" style="border-radius:8px; overflow:hidden; width: 100%; height: 75vh;">
      <v-stage :config="stageConfig" @wheel="onWheel">
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

    <q-dialog v-model="boxDialog.open">
      <q-card style="min-width: 420px">
        <q-card-section class="text-h6">Editar rectángulo</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.number="boxDialog.form.width" type="number" label="Ancho" dense outlined />
          <q-input v-model.number="boxDialog.form.height" type="number" label="Alto" dense outlined />
          <q-input v-model="boxDialog.form.label" label="Texto" dense outlined />
          <q-input v-model="boxDialog.form.color" label="Color (hex)" dense outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="saveBoxDialog" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useTablesStore } from 'src/stores/tables-store'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useFloorPlanStore } from 'src/stores/floor-plan-store'
import { date as qdate } from 'quasar'

const tables = useTablesStore()
const reservations = useReservationsStore()
const plan = useFloorPlanStore()

const stageWidth = ref(0)
const stageHeight = ref(0)
const scale = ref(plan.zoom || 1)
const ZOOM_STEP = 0.1
const MIN_SCALE = 0.5
const MAX_SCALE = 2

const stageConfig = computed(() => ({ width: stageWidth.value, height: stageHeight.value, draggable: false, scale: { x: scale.value, y: scale.value } }))

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

const adding = ref(false)
async function addTableNode() {
  adding.value = true
  try {
    const name = `Mesa ${tables.tables.length + 1}`
    const created = await tables.create({ name, capacity: 4 })
    const x = 100
    const y = 100
    nodes.value.push({ id: created.id, label: created.name, capacity: created.capacity, shape: 'square', color: availabilityColor(created.id), x, y })
    await plan.upsertTableLayout({ id: created.id, x, y, shape: 'square' })
  } finally {
    adding.value = false
  }
}

function onWheel(e) {
  e.evt.preventDefault()
  const delta = e.evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta))
  plan.setZoom(scale.value)
}
function resetZoom() { scale.value = 1; plan.setZoom(1) }

const layerRef = ref(null)
const stageContainer = ref(null)

let resizeObserver
onMounted(async () => {
  if (stageContainer.value) {
    const rect = stageContainer.value.getBoundingClientRect()
    stageWidth.value = rect.width
    stageHeight.value = rect.height
    resizeObserver = new ResizeObserver(() => {
      const r = stageContainer.value.getBoundingClientRect()
      stageWidth.value = r.width
      stageHeight.value = r.height
    })
    resizeObserver.observe(stageContainer.value)
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

const boxDialog = ref({ open: false, id: null, form: { width: 420, height: 140, label: '', color: '#E4B860' } })
function openBoxDialog(b) { boxDialog.value = { open: true, id: b.id, form: { width: b.width, height: b.height, label: b.label, color: b.color } } }
function saveBoxDialog() { plan.updateBox(boxDialog.value.id, { ...boxDialog.value.form }); boxDialog.value.open = false }
</script>

<style scoped>
</style>


