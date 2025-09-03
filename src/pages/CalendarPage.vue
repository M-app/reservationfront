<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn flat round icon="chevron_left" @click="prevDay" />
      <q-btn flat round icon="today" @click="toToday" />
      <q-btn flat round icon="chevron_right" @click="nextDay" />
      <div class="text-h6">{{ formattedDate }}</div>
      <q-space />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-lg-8 col-xl-9 col-md-8">
        <div ref="stageContainer" class="bg-grey-10" style="border-radius:8px; overflow:hidden; width: 100%; max-height: 80vh; height: auto; aspect-ratio: 16 / 9; display:flex; align-items:center; justify-content:center;">
          <v-stage :config="stageConfig" :style="{ width: stageWidth + 'px', height: stageHeight + 'px' }">
            <v-layer>
              <v-group v-for="t in nodes" :key="t.id" :config="{ x: t.x, y: t.y, draggable: false, id: t.id }">
                <v-rect v-if="t.shape==='square'" :config="rectConfig(t)" />
                <v-circle v-else :config="circleConfig(t)" />
                <v-text :config="textConfig(t)" />
                <v-text :config="capacityConfig(t)" />
              </v-group>

              <v-group v-for="b in boxes" :key="b.id" :config="{ x: b.x, y: b.y, draggable: false }">
                <v-rect :config="{ width: b.width, height: b.height, cornerRadius: 8, fill: b.color, opacity: 0.9, shadowColor: 'black', shadowBlur: 4 }" />
                <v-text :config="{ text: b.label, fontSize: 30, fill: '#fff', align: 'center', width: b.width, y: b.height/2 - 20 }" />
              </v-group>
            </v-layer>
          </v-stage>
        </div>
        <div class="q-mt-sm row items-center q-gutter-xs">
          <div class="text-caption text-grey-5" style="width:56px">Zoom</div>
          <q-slider v-model.number="zoomPercent" :min="50" :max="200" :step="1" label label-always :label-value="`${zoomPercent}%`" color="primary" class="col" />
        </div>
      </div>
      <div class="col-12 col-lg-4 col-xl-3 col-md-4">
        <q-card>
          <q-card-section v-if="hoursWithReservations.length === 0" class="text-center">
            <div class="text-subtitle1 q-mb-xs">Sin reservas</div>
            <div class="text-caption text-grey-6">No hay reservas para {{ formattedDate }}</div>
          </q-card-section>
          <q-card-section v-else>
            <q-list bordered separator>
              <div v-for="hour in hoursWithReservations" :key="hour">
                <q-expansion-item v-model="expanded[hour]" header-class="bg-blue-1 text-dark">
                  <template #header>
                    <q-item-section avatar>
                      <q-icon name="schedule" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{ hourLabel(hour) }}</q-item-label>
                      <q-item-label caption>
                        {{ countCaptionHour(hour) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="deep-orange" rounded class="q-mr-sm">{{ reservationsAtHour(hour).length }}</q-badge>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="group" class="q-mr-xs" />
                      <span>{{ peopleAtHour(hour) }}</span>
                    </q-item-section>
                  </template>
                  <q-list>
                    <q-item v-for="r in reservationsAtHour(hour)" :key="r.id" clickable @click="selectReservation(r)">
                      <q-item-section side class="text-weight-medium">
                        <div>{{ r.time }}</div>
                        <div class="text-caption">{{ formatDateShort(r.date) }}</div>
                      </q-item-section>
                      <q-item-section class="items-center">
                        <q-item-label class="text-weight-regular">{{ customerName(r.customerId) }}</q-item-label>
                      </q-item-section>
                      <q-item-section side class="row items-center no-wrap">
                        <q-icon name="table_restaurant" class="q-mr-xs" />
                        <span>{{ tableName(r.tableId) }}</span>
                      </q-item-section>
                      <q-item-section side class="row items-center no-wrap">
                        <q-icon name="group" class="q-mr-xs" />
                        <span>{{ r.partySize }}</span>
                      </q-item-section>
                    </q-item>
                    <q-item v-if="reservationsAtHour(hour).length === 0">
                      <q-item-section caption>No hay reservas</q-item-section>
                    </q-item>
                  </q-list>
                </q-expansion-item>
              </div>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 420px; max-width: 540px">
        <q-card-section class="text-h6">Nueva reserva</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Nombre" dense outlined />
          <q-input v-model="form.phone" label="Teléfono" dense outlined />
          <q-select v-model="form.tableId" :options="activeTables.map(t=>({label:t.name,value:t.id}))" label="Mesa" dense outlined />
          <q-input v-model.number="form.partySize" type="number" label="Comensales" dense outlined />
          <q-input v-model="form.notes" type="textarea" label="Notas / Preferencias" dense outlined autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="saveReservation" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailsOpen">
      <q-card style="min-width: 420px; max-width: 540px">
        <q-card-section class="text-h6">Detalle de reserva</q-card-section>
        <q-card-section v-if="selectedReservation">
          <div class="q-mb-sm"><b>Cliente:</b> {{ customerName(selectedReservation.customerId) }}</div>
          <div class="q-mb-sm"><b>Teléfono:</b> {{ customers.customerById(selectedReservation.customerId)?.phone }}</div>
          <div class="q-mb-sm"><b>Mesa:</b> {{ tableName(selectedReservation.tableId) }}</div>
          <div class="q-mb-sm"><b>Hora:</b> {{ selectedReservation.time }}</div>
        </q-card-section>
        <q-card-actions align="between">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn color="negative" label="Cancelar reserva" @click="cancelSelected" :loading="cancelling" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
  
</template>

<script setup>
import { computed, ref, onMounted, watch, reactive } from 'vue'
import { date as qdate } from 'quasar'
import { useSettingsStore } from 'src/stores/settings-store'
import { useTablesStore } from 'src/stores/tables-store'
import { useCustomersStore } from 'src/stores/customers-store'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useFloorPlanStore } from 'src/stores/floor-plan-store'

const settings = useSettingsStore()
const tables = useTablesStore()
const customers = useCustomersStore()
const reservations = useReservationsStore()
const plan = useFloorPlanStore()

const currentDate = ref(new Date())
const selectedRange = ref('open')

const formattedDate = computed(() => qdate.formatDate(currentDate.value, 'DD/MM/YYYY'))
const yyyyMmDd = computed(() => qdate.formatDate(currentDate.value, 'YYYY-MM-DD'))
const activeTables = computed(() => tables.tables)

const hourSlots = computed(() => {
  const from = selectedRange.value === 'open' ? (settings.openStart || '12:00') : '00:00'
  const to = selectedRange.value === 'open' ? (settings.openEnd || '23:00') : '23:59'
  const [fh] = from.split(':').map((n) => parseInt(n, 10))
  const [th] = to.split(':').map((n) => parseInt(n, 10))
  let startH = Number.isFinite(fh) ? fh : 0
  let endH = Number.isFinite(th) ? th : 23
  if (endH < startH) endH = startH
  const arr = []
  for (let h = startH; h <= endH; h += 1) arr.push(`${String(h).padStart(2, '0')}:00`)
  return arr
})

const expanded = reactive({})
const hoursWithReservations = computed(() => hourSlots.value.filter((h) => reservationsAtHour(h).length > 0))

function reservationsAtHour(hour) {
  const prefix = hour.slice(0, 2) + ':'
  return reservations.reservations
    .filter((r) => r.date === yyyyMmDd.value && r.time.startsWith(prefix) && r.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))
}
function hourLabel(hour) { return hour }
function countCaptionHour(hour) {
  const n = reservationsAtHour(hour).length
  const people = peopleAtHour(hour)
  return n ? `${n} reservas · ${people} personas` : 'Sin reservas'
}
function customerName(id) { return customers.customerById(id)?.name || id }
function tableName(id) { return tables.tables.find((t) => t.id === id)?.name || id }
function formatDateShort(d) { return qdate.formatDate(d, 'DD/MM') }

function peopleAtHour(hour) {
  return reservationsAtHour(hour).reduce((sum, r) => sum + (r.partySize || 0), 0)
}

const dialogOpen = ref(false)
const saving = ref(false)
const form = ref({ name: '', phone: '', partySize: 2, notes: '', tableId: null, time: null })
function selectReservation(r) {
  selectedReservation.value = r
  detailsOpen.value = true
}
async function saveReservation() {
  if (!form.value.name || !form.value.phone || !form.value.tableId || !form.value.time) return
  saving.value = true
  try {
    // crear/obtener cliente
    let customer = customers.customers.find((c) => c.phone === form.value.phone && c.name === form.value.name)
    if (!customer) customer = await customers.create({ name: form.value.name, phone: form.value.phone, notes: form.value.notes })

    await reservations.create({
      date: yyyyMmDd.value,
      time: form.value.time,
      durationMin: 90,
      tableId: form.value.tableId,
      partySize: form.value.partySize,
      customerId: customer.id,
      status: 'confirmed',
      notes: form.value.notes,
    })
    dialogOpen.value = false
  } catch {
    // opcional: notificación
  } finally {
    saving.value = false
  }
}

function prevDay() { currentDate.value = qdate.addToDate(currentDate.value, { days: -1 }) }
function nextDay() { currentDate.value = qdate.addToDate(currentDate.value, { days: 1 }) }
function toToday() { currentDate.value = new Date() }

const detailsOpen = ref(false)
const selectedReservation = ref(null)
const cancelling = ref(false)
async function cancelSelected() {
  if (!selectedReservation.value) return
  cancelling.value = true
  try {
    await reservations.cancel(selectedReservation.value.id)
    detailsOpen.value = false
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  await tables.fetchAll()
  await customers.fetchAll()
  await reservations.fetchByDay(yyyyMmDd.value)
  await plan.fetchAll()
  await settings.loadAll()
  const persisted = Number(settings.calendarZoomPercent)
  if (!Number.isNaN(persisted) && persisted > 0) userScale.value = Math.max(0.5, Math.min(2, persisted / 100))
})
watch(yyyyMmDd, async () => { await reservations.fetchByDay(yyyyMmDd.value) })

// ---- Plano (solo visual, no editable) ----
const stageWidth = ref(0)
const stageHeight = ref(0)
const CANVAS_W = 1920
const CANVAS_H = 1080
const ASPECT = 16 / 9
const userScale = ref(1)
const baseScale = computed(() => {
  if (!stageWidth.value || !stageHeight.value) return 1
  const sx = stageWidth.value / CANVAS_W
  const sy = stageHeight.value / CANVAS_H
  return Math.min(sx, sy)
})
const stageConfig = computed(() => ({ width: stageWidth.value, height: stageHeight.value, draggable: false, scale: { x: baseScale.value * userScale.value, y: baseScale.value * userScale.value } }))

const stageContainer = ref(null)
let resizeObserver
onMounted(() => {
  if (stageContainer.value) {
    const fitByAspect = (r) => {
      const containerW = r.width
      const containerH = r.height
      const targetH = containerW / ASPECT
      if (targetH <= containerH) return { w: Math.floor(containerW), h: Math.floor(targetH) }
      // Cuando el alto es limitante, usamos todo el alto y calculamos el ancho exacto
      return { w: Math.floor(containerH * ASPECT), h: Math.floor(containerH) }
    }
    const rect = stageContainer.value.getBoundingClientRect()
    const f = fitByAspect(rect)
    stageWidth.value = f.w
    stageHeight.value = f.h
    resizeObserver = new ResizeObserver(() => {
      const r = stageContainer.value.getBoundingClientRect()
      const f2 = fitByAspect(r)
      stageWidth.value = f2.w
      stageHeight.value = f2.h
    })
    resizeObserver.observe(stageContainer.value)
  }
})

const activeExpandedHours = computed(() => Object.keys(expanded).filter((h) => expanded[h]))
function isReservedAtExpandedHours(tableId) {
  const hours = activeExpandedHours.value
  if (!hours.length) return false
  return reservations.reservations.some((r) => r.tableId === tableId && r.date === yyyyMmDd.value && hours.some((h) => r.time.startsWith(h.slice(0,2) + ':')) && r.status !== 'cancelled')
}
function availabilityColorCalendar(tableId) {
  return isReservedAtExpandedHours(tableId) ? '#E57373' : '#35B57E'
}

const defaultNodes = computed(() => tables.tables.map((t, i) => {
  const layout = plan.tableLayoutById(t.id)
  const gridX = 120 + (i % 6) * 180
  const gridY = 120 + Math.floor(i / 6) * 180
  return {
    id: t.id,
    label: t.name,
    capacity: t.capacity,
    shape: layout?.shape || (i === 6 ? 'circle' : 'square'),
    color: availabilityColorCalendar(t.id),
    x: typeof layout?.x === 'number' ? layout.x : gridX,
    y: typeof layout?.y === 'number' ? layout.y : gridY,
  }
}))
const nodes = ref([])
onMounted(() => { nodes.value = defaultNodes.value })
watch([() => tables.tables, () => plan.tablesLayout, () => reservations.reservations, activeExpandedHours], () => { nodes.value = defaultNodes.value }, { deep: true })

const boxes = computed(() => plan.boxes)
function rectConfig(t) { return { width: 120, height: 120, fill: t.color, cornerRadius: 8, shadowColor: 'black', shadowBlur: 4, opacity: 0.95 } }
function circleConfig(t) { return { radius: 90, fill: t.color, shadowColor: 'black', shadowBlur: 4, opacity: 0.95 } }
function textConfig(t) { return { text: t.label, fontSize: 20, fill: '#fff', align: 'center', width: 140, x: t.shape==='circle'? -70:-10, y: t.shape==='circle' ? -10 : 42 } }
function capacityConfig(t) { return { text: `${t.capacity}`, fontSize: 18, fill: 'rgba(0,0,0,0.35)', align: 'center', width: 120, x: t.shape==='circle'? -60:0, y: t.shape==='circle' ? 56 : 90 } }

const zoomPercent = computed({
  get: () => Math.round(userScale.value * 100),
  set: (val) => {
    const s = Math.max(0.5, Math.min(2, Number(val) / 100))
    userScale.value = s
    settings.save('calendarZoomPercent', Math.round(s * 100))
  },
})
</script>

<style scoped>
</style>


