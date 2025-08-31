<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Reportes</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="text-subtitle1">Ocupación por día (mock)</q-card-section>
          <q-separator />
          <q-card-section>
            <q-list>
              <q-item v-for="item in occupancy" :key="item.date">
                <q-item-section>
                  <q-item-label>{{ item.date }}</q-item-label>
                  <q-linear-progress :value="item.ratio" color="primary" class="q-mt-xs" />
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption>{{ Math.round(item.ratio * 100) }}%</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { date as qdate } from 'quasar'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useTablesStore } from 'src/stores/tables-store'
import { useSettingsStore } from 'src/stores/settings-store'

const reservations = useReservationsStore()
const tables = useTablesStore()
const settings = useSettingsStore()

function slotsPerDay() {
  const start = qdate.extractDate(settings.openStart, 'HH:mm')
  const end = qdate.extractDate(settings.openEnd, 'HH:mm')
  const startDate = new Date(2000, 0, 1, start.hours, start.minutes)
  const endDate = new Date(2000, 0, 1, end.hours, end.minutes)
  let count = 0
  let cursor = startDate
  while (cursor <= endDate) {
    count += 1
    cursor = qdate.addToDate(cursor, { minutes: settings.slotMinutes })
  }
  return count
}

const occupancy = computed(() => {
  const today = new Date()
  const days = Array.from({ length: 7 }).map((_, i) => qdate.formatDate(qdate.addToDate(today, { days: i }), 'YYYY-MM-DD'))
  const slots = slotsPerDay() * tables.activeTables.length
  return days.map((d) => {
    const count = reservations.reservationsByDay(d).length
    return { date: d, ratio: Math.min(1, count / Math.max(1, slots)) }
  })
})
</script>

<style scoped>
</style>


