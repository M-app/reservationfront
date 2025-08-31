<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Reservas</div>
      <q-space />
      <q-input v-model="rangeStart" type="date" label="Desde" dense outlined class="q-mr-sm" />
      <q-input v-model="rangeEnd" type="date" label="Hasta" dense outlined class="q-mr-sm" />
      <q-btn dense flat icon="refresh" @click="reloadRange" />
      <q-btn color="secondary" class="q-ml-sm" :label="agentActive ? 'Finalizar agente' : 'Hablar con agente'" @click="agentActive ? finalizarConversacion() : iniciarConversacion()" :loading="connectingAgent" />
      <q-btn color="primary" class="q-ml-sm" label="Nueva reserva" @click="openDialog" />
    </div>
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered :pagination="{ rowsPerPage: 10 }" />

    <q-dialog v-model="dialog.open">
      <q-card style="min-width: 520px; max-width: 680px">
        <q-card-section class="text-h6">Nueva reserva</q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="dialog.form.date" type="date" label="Fecha" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="dialog.form.time" label="Hora" dense outlined readonly>
                <template #append>
                  <q-icon name="access_time" class="cursor-pointer" />
                </template>
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-time v-model="dialog.form.time" format24h :minute-options="[0,15,30,45]" />
                </q-popup-proxy>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-select v-model="dialog.form.tableId" :options="tableOptions" label="Mesa" dense outlined emit-value map-options />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="dialog.form.partySize" type="number" label="Comensales" dense outlined />
            </div>
          </div>

          <q-separator spaced />

          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-toggle v-model="dialog.useExistingCustomer" label="Seleccionar cliente existente" />
            </div>
            <div class="col-12" v-if="dialog.useExistingCustomer">
              <q-select v-model="dialog.form.customerId" :options="customerOptions" label="Cliente" dense outlined emit-value map-options use-input fill-input input-debounce="0" />
            </div>
            <template v-else>
              <div class="col-12 col-sm-6">
                <q-input v-model="dialog.form.name" label="Nombre" dense outlined />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="dialog.form.phone" label="Teléfono" dense outlined />
              </div>
              <div class="col-12">
                <q-input v-model="dialog.form.notes" type="textarea" label="Notas / Preferencias" dense outlined autogrow />
              </div>
            </template>
          </div>

          <div v-if="conflict" class="text-negative q-mt-sm">La mesa seleccionada ya está ocupada en esa fecha y hora.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" :disable="!canSave || conflict" @click="save" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useCustomersStore } from 'src/stores/customers-store'
import { useTablesStore } from 'src/stores/tables-store'
import { useSettingsStore } from 'src/stores/settings-store'
import { date as qdate } from 'quasar'
import { api } from 'src/boot/axios'
import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents/realtime'
import { z } from 'zod'

const reservations = useReservationsStore()
const customers = useCustomersStore()
const tables = useTablesStore()
const settings = useSettingsStore()

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'date', label: 'Fecha', field: 'date', align: 'left' },
  { name: 'time', label: 'Hora', field: 'time', align: 'left' },
  { name: 'tableId', label: 'Mesa', field: 'tableId', align: 'left' },
  { name: 'partySize', label: 'Comensales', field: 'partySize', align: 'left' },
  { name: 'customer', label: 'Cliente', field: 'customer', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
]

const rows = computed(() => reservations.reservations.map((r) => ({
  ...r,
  customer: customers.customerById(r.customerId)?.name || r.customerId,
})))

const today = new Date()
const rangeStart = ref(qdate.formatDate(today, 'YYYY-MM-DD'))
const rangeEnd = ref(qdate.formatDate(qdate.addToDate(today, { days: 7 }), 'YYYY-MM-DD'))

const dialog = ref({
  open: false,
  useExistingCustomer: false,
  form: {
    date: qdate.formatDate(new Date(), 'YYYY-MM-DD'),
    time: '',
    tableId: tables.activeTables[0]?.id || '',
    partySize: 2,
    customerId: customers.customers[0]?.id || '',
    name: '',
    phone: '',
    notes: '',
  },
})

function buildTimeSlots() {
  const startStr = settings.openStart || '12:00'
  const endStr = settings.openEnd || '23:00'
  const startObj = qdate.extractDate(startStr, 'HH:mm') || { hours: 12, minutes: 0 }
  const endObj = qdate.extractDate(endStr, 'HH:mm') || { hours: 23, minutes: 0 }
  let base = new Date(2000, 0, 1, startObj.hours, startObj.minutes)
  let end = new Date(2000, 0, 1, endObj.hours, endObj.minutes)
  if (end <= base) end = new Date(2000, 0, 1, startObj.hours + 11, 59)
  const arr = []
  let cursor = base
  const maxSteps = Math.ceil((24 * 60) / Math.max(1, settings.slotMinutes))
  let steps = 0
  while (cursor <= end && steps < maxSteps) {
    arr.push(qdate.formatDate(cursor, 'HH:mm'))
    cursor = qdate.addToDate(cursor, { minutes: settings.slotMinutes })
    steps += 1
  }
  return arr
}

const timeOptions = computed(() => buildTimeSlots().map((t) => ({ label: t, value: t })))
const tableOptions = computed(() => tables.activeTables.map((t) => ({ label: `${t.name} (${t.capacity})`, value: t.id })))
const customerOptions = computed(() => customers.customers.map((c) => ({ label: `${c.name} - ${c.phone}`, value: c.id })))

const conflict = computed(() => {
  if (!dialog.value.form.date || !dialog.value.form.time || !dialog.value.form.tableId) return false
  return reservations.reservations.some((r) => r.date === dialog.value.form.date && r.time === dialog.value.form.time && r.tableId === dialog.value.form.tableId && r.status !== 'cancelled')
})

const canSave = computed(() => {
  const f = dialog.value.form
  const hasCustomer = dialog.value.useExistingCustomer ? !!f.customerId : (f.name && f.phone)
  return f.date && f.time && f.tableId && f.partySize > 0 && hasCustomer
})

function openDialog() {
  dialog.value.open = true
  if (!dialog.value.form.time) {
    dialog.value.form.time = timeOptions.value[0]?.value || ''
  }
}

const saving = ref(false)
async function save() {
  const f = dialog.value.form
  saving.value = true
  try {
    let customerId = f.customerId
    if (!dialog.value.useExistingCustomer) {
      const created = await customers.create({ name: f.name, phone: f.phone, notes: f.notes })
      customerId = created.id
    }

    await reservations.create({
      date: f.date,
      time: f.time,
      durationMin: 90,
      tableId: f.tableId,
      partySize: f.partySize,
      customerId,
      status: 'confirmed',
      notes: f.notes,
    })

    dialog.value.open = false
    await reloadRange()
  } finally {
    saving.value = false
  }
}

async function reloadRange() { await reservations.fetchByRange(rangeStart.value, rangeEnd.value) }

onMounted(async () => {
  await tables.fetchAll()
  await customers.fetchAll()
  await reloadRange()
})
watch([rangeStart, rangeEnd], async () => { await reloadRange() })

// --- Realtime Agent (WebSocket + audio manual) ---
const connectingAgent = ref(false)
const agentActive = ref(false)
let sessionRef = null
let mediaStreamRef = null
let audioContextRef = null
let sourceNodeRef = null
let processorRef = null

// Auto-reconnect
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

async function connectRealtimeSession(session) {
  const tokenResp = await api.post('/realtime/token')
  await session.connect({ apiKey: tokenResp.data.client_secret })
}

function scheduleReconnect() {
  if (!agentActive.value) return
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return
  reconnectAttempts += 1
  const delay = Math.min(30000, 1000 * 2 ** reconnectAttempts)
  reconnectTimer = setTimeout(async () => {
    try {
      if (sessionRef) await connectRealtimeSession(sessionRef)
      reconnectAttempts = 0
    } catch (e) {
      console.debug('reconnect failed', e)
      scheduleReconnect()
    }
  }, delay)
}

async function iniciarConversacion() {
  connectingAgent.value = true
  try {
    const checkAvailability = tool({
      name: 'check_availability',
      description: 'Revisa disponibilidad de mesas para fecha y hora específicas, filtrando por tamaño de grupo',
      parameters: z.object({
        date: z.string().min(10).max(10).describe('Fecha YYYY-MM-DD'),
        time: z.string().min(5).max(5).describe('Hora HH:mm en 24 horas'),
        durationMin: z.number().int().min(15).max(360).default(90).describe('Duración en minutos'),
        partySize: z.number().int().min(1).max(50).describe('Número de comensales'),
      }),
      async execute({ date, time, durationMin, partySize }) {
        const start = `${date}T${time}:00`
        const end = qdate.formatDate(new Date(new Date(`${start}`).getTime() + durationMin * 60000), 'YYYY-MM-DDTHH:mm:ss')
        const [tablesRes, resRes] = await Promise.all([
          api.get('/tables'),
          api.get('/reservations', { params: { start, end } }),
        ])
        const reserved = new Set(resRes.data.filter((r) => r.status !== 'cancelled').map((r) => r.table_id))
        const available = tablesRes.data
          .filter((t) => !reserved.has(t.id))
          .filter((t) => Number(t.capacity) >= Number(partySize))
          .map((t) => ({ id: t.id, name: t.name, capacity: t.capacity }))
        return { start, end, partySize, availableCount: available.length, available }
      },
    })

    const makeReservation = tool({
      name: 'make_reservation',
      description: 'Crea una reserva en una mesa específica. Si el cliente no existe, lo crea.',
      parameters: z.object({
        date: z.string().min(10).max(10).describe('Fecha YYYY-MM-DD'),
        time: z.string().min(5).max(5).describe('Hora HH:mm en 24 horas'),
        durationMin: z.number().int().min(15).max(360).default(90),
        tableId: z.number().int().min(1),
        partySize: z.number().int().min(1).max(50),
        customerName: z.string().min(1),
        phone: z.string().min(3),
        notes: z.string().optional().nullable(),
      }),
      async execute({ date, time, durationMin, tableId, partySize, customerName, phone, notes }) {
        const start = `${date}T${time}:00`
        const end = qdate.formatDate(new Date(new Date(`${start}`).getTime() + durationMin * 60000), 'YYYY-MM-DDTHH:mm:ss')
        const createdCustomer = await api.post('/customers', { name: customerName, phone, notes: notes || null })
        const reservation = await api.post('/reservations', {
          customer_id: createdCustomer.data.id,
          table_id: tableId,
          start_time: start,
          end_time: end,
          size: partySize,
          status: 'booked',
          notes: notes || null,
        })
        await reloadRange()
        return { reservationId: reservation.data.id, tableId, date, time, partySize }
      },
    })

    const agente = new RealtimeAgent({
      name: 'Recepcionista',
      instructions: 'Asiste en revisar disponibilidad y crear reservas. Usa herramientas cuando sea necesario. Responde en español.',
      tools: [checkAvailability, makeReservation],
    })
    const session = new RealtimeSession(agente, { model: 'gpt-realtime' })
    sessionRef = session
    await connectRealtimeSession(sessionRef)

    if (session.on) {
      session.on('close', () => scheduleReconnect())
      session.on('error', () => scheduleReconnect())
    }

    agentActive.value = true
  } finally {
    connectingAgent.value = false
  }
}

function cleanupAudio() {
  try { if (processorRef) processorRef.disconnect() } catch (e) { console.debug('cleanup processor error', e) }
  try { if (sourceNodeRef) sourceNodeRef.disconnect() } catch (e) { console.debug('cleanup source error', e) }
  try { if (mediaStreamRef) mediaStreamRef.getTracks().forEach((t) => t.stop()) } catch (e) { console.debug('cleanup media tracks error', e) }
  try { if (audioContextRef) audioContextRef.close() } catch (e) { console.debug('cleanup audio context error', e) }
  processorRef = null
  sourceNodeRef = null
  mediaStreamRef = null
  audioContextRef = null
}

async function finalizarConversacion() {
  agentActive.value = false
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  reconnectAttempts = 0
  if (sessionRef) {
    try { sessionRef.close && sessionRef.close() } catch (e) { console.debug('session close error', e) }
    sessionRef = null
  }
  cleanupAudio()
}

onBeforeUnmount(() => { if (agentActive.value) finalizarConversacion() })
</script>

<style scoped>
</style>


