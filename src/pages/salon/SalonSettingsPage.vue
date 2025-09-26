<template>
  <q-page padding class="q-gutter-md">
    <div class="text-h6">Configuración del salón</div>
    <div class="text-caption text-grey-7">Horario de atención y zona horaria</div>

    <q-card flat bordered class="bg-white">
      <q-card-section class="q-gutter-md">
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <q-select v-model="timezone" :options="timezoneOptions" label="Zona horaria" dense outlined emit-value map-options/>
          </div>
          <div class="col-auto">
            <q-btn color="primary" label="Guardar zona horaria" :loading="savingTz" @click="saveTimezone" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-separator spaced />

    <div class="text-subtitle1">Horario de atención</div>
    <q-card flat bordered class="bg-white">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div v-for="d in days" :key="d.value" class="col-12 col-sm-6 col-md-4">
            <q-card flat bordered>
              <q-card-section class="q-gutter-sm">
                <div class="text-subtitle2">{{ d.label }}</div>
                <q-toggle v-model="d.closed" label="Cerrado" />
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-input v-model="d.open_time" type="time" label="Apertura" dense outlined :disable="d.closed" />
                  </div>
                  <div class="col-6">
                    <q-input v-model="d.close_time" type="time" label="Cierre" dense outlined :disable="d.closed" />
                  </div>
                </div>
                <q-btn color="primary" size="sm" label="Guardar" @click="saveDay(d)" :loading="savingKey===d.value" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'

const savingKey = ref(null)
const savingTz = ref(false)

const timezone = ref('UTC')
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/Mexico_City', value: 'America/Mexico_City' },
  { label: 'America/Bogota', value: 'America/Bogota' },
  { label: 'America/Lima', value: 'America/Lima' },
  { label: 'America/Santiago', value: 'America/Santiago' },
  { label: 'Europe/Madrid', value: 'Europe/Madrid' }
]

const days = ref([
  { value: 0, label: 'Domingo', open_time: '09:00', close_time: '18:00', closed: true },
  { value: 1, label: 'Lunes', open_time: '09:00', close_time: '18:00', closed: false },
  { value: 2, label: 'Martes', open_time: '09:00', close_time: '18:00', closed: false },
  { value: 3, label: 'Miércoles', open_time: '09:00', close_time: '18:00', closed: false },
  { value: 4, label: 'Jueves', open_time: '09:00', close_time: '18:00', closed: false },
  { value: 5, label: 'Viernes', open_time: '09:00', close_time: '18:00', closed: false },
  { value: 6, label: 'Sábado', open_time: '09:00', close_time: '14:00', closed: false }
])

async function load() {
  const [bh, tz] = await Promise.all([
    api.get('/settings/business-hours'),
    api.get('/settings/timezone')
  ])
  for (const rec of bh.data) {
    const d = days.value.find(x => x.value === rec.day_of_week)
    if (d) {
      d.open_time = rec.open_time.slice(0,5)
      d.close_time = rec.close_time.slice(0,5)
      d.closed = !!rec.closed
    }
  }
  timezone.value = tz.data.timezone || 'UTC'
}

async function saveDay(d) {
  savingKey.value = d.value
  try {
    await api.put('/settings/business-hours', {
      day_of_week: d.value,
      open_time: d.open_time,
      close_time: d.close_time,
      closed: d.closed
    })
  } finally { savingKey.value = null }
}

async function saveTimezone() {
  savingTz.value = true
  try {
    await api.put('/settings/timezone', { timezone: timezone.value })
  } finally { savingTz.value = false }
}

onMounted(load)
</script>
