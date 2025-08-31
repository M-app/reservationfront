<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Comunicaciones automáticas</div>
      <q-space />
    </div>
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered>
      <template #body-cell-active="{ row }">
        <q-td>
          <q-toggle v-model="row.active" @update:model-value="update(row.id, { active: row.active })" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useReservationsStore } from 'src/stores/reservations-store'

const store = useReservationsStore()

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
  { name: 'method', label: 'Método', field: 'method', align: 'left' },
  { name: 'offsetHours', label: 'Horas antes/después', field: 'offsetHours', align: 'left' },
  { name: 'active', label: 'Activo', field: 'active', align: 'left' },
]

const rows = computed(() => store.communications)
function update(id, patch) {
  store.updateCommunication(id, patch)
}
</script>

<style scoped>
</style>


