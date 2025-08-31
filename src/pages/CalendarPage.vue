<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn flat round icon="chevron_left" @click="prevDay" />
      <q-btn flat round icon="today" @click="toToday" />
      <q-btn flat round icon="chevron_right" @click="nextDay" />
      <div class="text-h6">{{ formattedDate }}</div>
      <q-space />
    </div>

    <q-card>
      <q-card-section>
        <q-list bordered separator>
          <div v-for="hour in hoursWithReservations" :key="hour">
            <q-expansion-item :model-value="reservationsAtHour(hour).length > 0" header-class="bg-blue-1 text-dark">
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
import { computed, ref, onMounted, watch } from 'vue'
import { date as qdate } from 'quasar'
import { useSettingsStore } from 'src/stores/settings-store'
import { useTablesStore } from 'src/stores/tables-store'
import { useCustomersStore } from 'src/stores/customers-store'
import { useReservationsStore } from 'src/stores/reservations-store'

const settings = useSettingsStore()
const tables = useTablesStore()
const customers = useCustomersStore()
const reservations = useReservationsStore()

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
})
watch(yyyyMmDd, async () => { await reservations.fetchByDay(yyyyMmDd.value) })
</script>

<style scoped>
</style>


