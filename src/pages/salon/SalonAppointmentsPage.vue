<template>
  <q-page padding class="q-gutter-md">
    <div class="row items-center q-gutter-sm">
      <div class="col">
        <div class="text-h6">Citas</div>
        <div class="text-caption text-grey-7">Gestiona las citas del salón</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Nueva" @click="openForm()" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-12">
        <q-table
          flat bordered
          :rows="rowsView" :columns="columns" row-key="id"
          :loading="loading"
          class="bg-white"
        >
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn size="sm" flat round icon="edit" @click="openForm(props.row)" />
              <q-btn size="sm" flat round icon="event_busy" color="negative" @click="onCancel(props.row)" />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <q-dialog v-model="formOpen" persistent>
      <q-card style="min-width: 320px; max-width: 720px; width: 95vw;">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Editar' : 'Nueva' }} cita</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-select use-input fill-input hide-selected emit-value map-options
                        v-model="form.client_id" :options="clientsOpts" option-value="id" option-label="label"
                        label="Cliente" dense outlined @filter="filterClients" />
            </div>
            <div class="col-12 col-sm-4">
              <q-select use-input fill-input hide-selected emit-value map-options
                        v-model="form.service_id" :options="servicesOpts" option-value="id" option-label="label"
                        label="Servicio" dense outlined @filter="filterServices" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="dateStr" type="date" label="Fecha" dense outlined />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div class="flex flex-center">
                <q-time v-model="timeStr" format24h label="Hora" dense outlined />
              </div>
            </div>
          </div>
          <div class="text-caption text-grey-7">Se enviará en ISO: {{ computedIso }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" :loading="saving" @click="onSave" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { api } from 'boot/axios'
import { supabase } from 'boot/supabase'
import { date as qDate } from 'quasar'
import { fromZonedTime } from 'date-fns-tz'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const salonTz = ref('UTC')

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'client_name', label: 'Cliente', field: 'client_name', align: 'left' },
  { name: 'service_name', label: 'Servicio', field: 'service_name', align: 'left' },
  { name: 'start_fmt', label: 'Inicio', field: 'start_fmt', align: 'left' },
  { name: 'end_fmt', label: 'Fin', field: 'end_fmt', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

const formOpen = ref(false)
const form = ref({ id: null, client_id: null, service_id: null, start_time: '' })
const dateStr = ref('') // YYYY-MM-DD
const timeStr = ref('') // HH:mm

const clientsOpts = ref([])
const servicesOpts = ref([])

const clientsMap = ref({})
const servicesMap = ref({})

const computedIso = computed(() => {
  if (!dateStr.value || !timeStr.value) return ''
  // Convert local salon TZ to UTC ISO
  try {
    const utc = fromZonedTime(`${dateStr.value}T${timeStr.value}:00`, salonTz.value)
    return new Date(utc).toISOString()
  } catch {
    return `${dateStr.value}T${timeStr.value}:00Z`
  }
})

function fmtInTz(iso) {
  try {
    return new Intl.DateTimeFormat('es-ES', { timeZone: salonTz.value, year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))
  } catch {
    return qDate.formatDate(new Date(iso), 'DD/MM/YYYY h:mm A')
  }
}

const rowsView = computed(() => rows.value.map(r => ({
  ...r,
  client_name: clientsMap.value[r.client_id] || r.client_id,
  service_name: servicesMap.value[r.service_id] || r.service_id,
  start_fmt: fmtInTz(r.start_time),
  end_fmt: fmtInTz(r.end_time)
})))

function openForm(row) {
  if (row) {
    form.value = { id: row.id, client_id: row.client_id, service_id: row.service_id, start_time: row.start_time }
    try {
      const d = new Date(row.start_time)
      dateStr.value = d.toISOString().slice(0,10)
      timeStr.value = d.toISOString().slice(11,16)
    } catch {
      dateStr.value = ''
      timeStr.value = ''
    }
  } else {
    form.value = { id: null, client_id: null, service_id: null, start_time: '' }
    dateStr.value = ''
    timeStr.value = ''
  }
  formOpen.value = true
}

async function fetchAll() {
  loading.value = true
  try {
    const [appts, clients, services, tzResp] = await Promise.all([
      api.get('/appointments'),
      api.get('/clients'),
      api.get('/services'),
      api.get('/settings/timezone')
    ])
    rows.value = appts.data
    salonTz.value = tzResp.data.timezone || 'UTC'

    clientsOpts.value = clients.data.map(c => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }))
    servicesOpts.value = services.data.map(s => ({ id: s.id, label: `${s.name} (${s.duration_minutes}m)` }))

    clientsMap.value = Object.fromEntries(clients.data.map(c => [c.id, `${c.first_name} ${c.last_name}`]))
    servicesMap.value = Object.fromEntries(services.data.map(s => [s.id, s.name]))
  } finally { loading.value = false }
}

function filterClients(val, update) {
  update(() => {
    const needle = (val || '').toLowerCase()
    clientsOpts.value = clientsOpts.value.map(o => o)
      .filter(o => o.label.toLowerCase().includes(needle))
  })
}

function filterServices(val, update) {
  update(() => {
    const needle = (val || '').toLowerCase()
    servicesOpts.value = servicesOpts.value.map(o => o)
      .filter(o => o.label.toLowerCase().includes(needle))
  })
}

async function onSave() {
  saving.value = true
  try {
    const startIso = computedIso.value || form.value.start_time
    if (form.value.id) {
      await api.put(`/appointments/${form.value.id}`, {
        client_id: form.value.client_id,
        service_id: form.value.service_id,
        start_time: startIso
      })
    } else {
      await api.post('/appointments', {
        client_id: form.value.client_id,
        service_id: form.value.service_id,
        start_time: startIso
      })
    }
    formOpen.value = false
    await fetchAll()
  } finally { saving.value = false }
}

async function onCancel(row) {
  await api.post(`/appointments/${row.id}/cancel`)
  await fetchAll()
}

let channel

onMounted(async () => {
  await fetchAll()
  channel = supabase
    .channel('rt-appointments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload
        if (eventType === 'INSERT') {
          rows.value = [...rows.value, newRow]
        } else if (eventType === 'UPDATE') {
          rows.value = rows.value.map(r => r.id === newRow.id ? newRow : r)
        } else if (eventType === 'DELETE') {
          rows.value = rows.value.filter(r => r.id !== (oldRow?.id ?? newRow?.id))
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
</script>
