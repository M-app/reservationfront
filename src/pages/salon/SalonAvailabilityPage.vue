<template>
  <q-page padding class="q-gutter-md">
    <div class="text-h6">Disponibilidad</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-4">
        <q-select v-model="serviceId" :options="serviceOptions" option-value="id" option-label="label"
                  label="Servicio" dense outlined emit-value map-options/>
      </div>
      <div class="col-12 col-sm-4">
        <q-input v-model="date" type="date" label="Fecha" dense outlined />
      </div>
      <div class="col-12 col-sm-4">
        <q-input v-model.number="step" type="number" label="Intervalo (min)" dense outlined />
      </div>
      <div class="col-12">
        <q-btn color="primary" label="Buscar" @click="fetchSlots" :loading="loading" :disable="!serviceId || !date || !salonTz" />
      </div>
    </div>

    <q-separator spaced />

    <div class="row q-col-gutter-md">
      <div class="col-12">
        <div class="relative-position">
          <q-table :key="'tz-'+salonTz" flat bordered :rows="rowsView" :columns="columns" row-key="start_time" class="bg-white" />
          <q-inner-loading :showing="loading">
            <q-spinner-dots size="24px" color="primary" />
          </q-inner-loading>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from 'boot/axios'

const serviceOptions = ref([])
const serviceId = ref(null)
const date = ref('')
const step = ref(15)
const rows = ref([])
const salonTz = ref('')
const loading = ref(false)

function fmtTime(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: salonTz.value }).format(new Date(iso))
  } catch {
    return ''
  }
}

const rowsView = computed(() => rows.value.map(r => ({
  ...r,
  start_fmt: fmtTime(r.start_time),
  end_fmt: fmtTime(r.end_time)
})))

const columns = [
  { name: 'start_fmt', label: 'Inicio', field: 'start_fmt', align: 'left' },
  { name: 'end_fmt', label: 'Fin', field: 'end_fmt', align: 'left' }
]

async function loadServices() {
  const { data } = await api.get('/services')
  serviceOptions.value = data.map(s => ({ id: s.id, label: `${s.name} (${s.duration_minutes}m)` }))
}

async function loadTimezone() {
  const { data } = await api.get('/settings/timezone')
  salonTz.value = data.timezone || 'UTC'
}

async function fetchSlots() {
  loading.value = true
  try {
    const { data } = await api.get('/appointments/availability', {
      params: { service_id: serviceId.value, date: date.value, step: step.value }
    })
    rows.value = data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadTimezone(), loadServices()])
})
</script>
