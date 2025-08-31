<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Lista de espera</div>
      <q-space />
    </div>
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered :pagination="{ rowsPerPage: 10 }" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useReservationsStore } from 'src/stores/reservations-store'
import { useCustomersStore } from 'src/stores/customers-store'

const reservations = useReservationsStore()
const customers = useCustomersStore()

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'date', label: 'Fecha', field: 'date', align: 'left' },
  { name: 'partySize', label: 'Comensales', field: 'partySize', align: 'left' },
  { name: 'customer', label: 'Cliente', field: 'customer', align: 'left' },
  { name: 'notes', label: 'Notas', field: 'notes', align: 'left' },
]

const rows = computed(() => reservations.waitlist.map((w) => ({
  ...w,
  customer: customers.customerById(w.customerId)?.name || w.customerId,
})))
</script>

<style scoped>
</style>


