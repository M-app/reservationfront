<template>
  <q-page padding>
    <div class="row items-center q-gutter-sm q-mb-md">
      <div class="col">
        <div class="text-h6">Calendario del salón</div>
      </div>
      <div class="col-auto text-caption text-grey-7">
        TZ: {{ salonTz }}
      </div>
    </div>

    <FullCalendar ref="calendarRef" :options="calendarOptions" />

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 320px; max-width: 520px; width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ dialogData.serviceName }} · {{ dialogData.clientName }}</div>
          <div class="text-subtitle2 text-grey-7">Estado: {{ dialogData.status }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <div><b>Inicio:</b> {{ formatInTz(dialogData.start) }}</div>
          <div><b>Fin:</b> {{ formatInTz(dialogData.end) }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
          <q-btn color="primary" label="Abrir cita" @click="openAppointment" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <elevenlabs-convai agent-id="agent_9101k5y95kc7eh5bhkbj2tb2kdfn"></elevenlabs-convai>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { api } from 'boot/axios'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import luxonPlugin from '@fullcalendar/luxon3'
import esLocale from '@fullcalendar/core/locales/es'

const router = useRouter()

const calendarRef = ref(null)
const salonTz = ref('UTC')
const events = ref([])
const businessHours = ref([])
const servicesById = ref({})
const clientsById = ref({})

const showDialog = ref(false)
const dialogData = ref({ id: '', serviceName: '', clientName: '', start: '', end: '', status: '' })

const baseOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin],
  locales: [esLocale],
  locale: 'es',
  initialView: 'listWeek',
  initialDate: new Date().toISOString(),
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  },
  buttonText: { today: 'hoy', month: 'mes', week: 'semana', day: 'día', list: 'lista' },
  timeZone: 'UTC',
  height: 'auto',
  nowIndicator: true,
  eventDisplay: 'auto',
  slotDuration: '00:30',
  slotMinTime: '07:00',
  slotMaxTime: '21:00',
  datesSet: onDatesSet
}

const calendarOptions = ref({ ...baseOptions, events: [], eventClick: onEventClick, businessHours })

watch(salonTz, (tz) => {
  calendarOptions.value = { ...calendarOptions.value, timeZone: tz || 'UTC' }
})

function setEvents(evts) {
  calendarOptions.value = { ...calendarOptions.value, events: evts }
}

function formatInTz(iso) {
  try {
    return new Intl.DateTimeFormat('es-ES', { timeZone: salonTz.value, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
  } catch { return iso }
}

function onEventClick(info) {
  const e = info.event
  dialogData.value = {
    id: e.id,
    serviceName: e.extendedProps.serviceName || e.title,
    clientName: e.extendedProps.clientName || '',
    start: e.startStr,
    end: e.endStr,
    status: e.extendedProps.status || ''
  }
  showDialog.value = true
}

function openAppointment() {
  showDialog.value = false
  router.push({ path: '/salon/appointments', query: { edit: dialogData.value.id } })
}

function colorByStatus(status) {
  switch (status) {
    case 'confirmed': return '#21ba45'
    case 'pending': return '#f2c037'
    case 'completed': return '#5c6bc0'
    case 'canceled': return '#e53935'
    default: return '#26a69a'
  }
}

function onDatesSet(arg) {
  try {
    const api = calendarRef.value?.getApi()
    if (!api || businessHours.value.length === 0) return
    const start = arg.start
    const end = arg.end
    const days = []
    const cursor = new Date(start)
    while (cursor < end) {
      days.push(cursor.getDay())
      cursor.setDate(cursor.getDate() + 1)
    }
    const todays = businessHours.value.filter(bh => days.includes(bh.daysOfWeek[0]) && !bh.closed)
    if (todays.length === 0) return
    const minOpen = todays.reduce((acc, bh) => (bh.startTime < acc ? bh.startTime : acc), todays[0].startTime)
    const maxClose = todays.reduce((acc, bh) => (bh.endTime > acc ? bh.endTime : acc), todays[0].endTime)
    api.setOption('slotMinTime', minOpen)
    api.setOption('slotMaxTime', maxClose)
  } catch {
    // Ignore failures adjusting slots (calendar not ready)
    return
  }
}

async function load() {
  const [tzResp, appts, services, clients, hoursResp] = await Promise.all([
    api.get('/settings/timezone'),
    api.get('/appointments'),
    api.get('/services'),
    api.get('/clients'),
    api.get('/settings/business-hours')
  ])
  salonTz.value = tzResp.data.timezone || 'UTC'

  const servicesMap = Object.fromEntries(services.data.map(s => [s.id, s.name]))
  const clientsMap = Object.fromEntries(clients.data.map(c => [c.id, `${c.first_name} ${c.last_name}`]))

  servicesById.value = servicesMap
  clientsById.value = clientsMap

  businessHours.value = hoursResp.data
    .filter(h => !h.closed)
    .map(h => ({ daysOfWeek: [h.day_of_week], startTime: h.open_time.slice(0,5), endTime: h.close_time.slice(0,5), closed: false }))

  calendarOptions.value = { ...calendarOptions.value, businessHours: businessHours.value }

  events.value = appts.data.map(a => ({
    id: String(a.id),
    title: `${servicesMap[a.service_id] || a.service_id} · ${clientsMap[a.client_id] || a.client_id}`,
    start: a.start_time,
    end: a.end_time,
    backgroundColor: colorByStatus(a.status),
    borderColor: colorByStatus(a.status),
    extendedProps: {
      serviceName: servicesMap[a.service_id] || String(a.service_id),
      clientName: clientsMap[a.client_id] || String(a.client_id),
      status: a.status
    }
  }))

  setEvents(events.value)
}

let channel

onMounted(async () => {
  ensureConvaiScript()
  await load()
  channel = supabase
    .channel('rt-appointments-calendar')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') {
          const serviceName = servicesById.value[newRow.service_id] || String(newRow.service_id)
          const clientName = clientsById.value[newRow.client_id] || String(newRow.client_id)
          const color = colorByStatus(newRow.status)
          const evt = {
            id: String(newRow.id),
            title: `${serviceName} · ${clientName}`,
            start: newRow.start_time,
            end: newRow.end_time,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { serviceName, clientName, status: newRow.status }
          }
          events.value = [...events.value, evt]
          setEvents(events.value)
        } else if (eventType === 'UPDATE') {
          const serviceName = servicesById.value[newRow.service_id] || String(newRow.service_id)
          const clientName = clientsById.value[newRow.client_id] || String(newRow.client_id)
          const color = colorByStatus(newRow.status)
          events.value = events.value.map(e => e.id === String(newRow.id) ? {
            ...e,
            title: `${serviceName} · ${clientName}`,
            start: newRow.start_time,
            end: newRow.end_time,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { ...e.extendedProps, serviceName, clientName, status: newRow.status }
          } : e)
          setEvents(events.value)
        } else if (eventType === 'DELETE') {
          const delId = String(oldRow?.id ?? newRow?.id)
          events.value = events.value.filter(e => e.id !== delId)
          setEvents(events.value)
        }
      }
    )
    .subscribe()
})

onBeforeUnmount(() => {
  try {
    if (channel) supabase.removeChannel(channel)
  } catch (err) {
    console.debug('supabase channel cleanup failed', err)
  }
})

function ensureConvaiScript() {
  if (document.querySelector('script[data-elevenlabs-convai]')) return
  const s = document.createElement('script')
  s.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
  s.async = true
  s.type = 'text/javascript'
  s.setAttribute('data-elevenlabs-convai', '1')
  document.head.appendChild(s)
}
</script>

<style>
.fc .fc-toolbar-title { font-weight: 600; }
</style>
