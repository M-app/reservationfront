<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">Mesas</div>
      <q-space />
      <q-btn color="primary" label="Añadir mesa" @click="openDialog()" />
    </div>

    <q-table :rows="tables" :columns="columns" row-key="id" flat bordered :pagination="{ rowsPerPage: 10 }">
      <template #top-right>
        <q-btn dense flat icon="refresh" @click="reload" :loading="loading" />
      </template>
      <template #body-cell-status="{ row }">
        <q-td>
          <q-badge :color="statusColor(row.status)" :label="row.status" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 380px">
        <q-card-section class="text-h6">Nueva mesa</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Nombre" dense outlined />
          <q-input v-model.number="form.capacity" type="number" label="Capacidad" dense outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" @click="save" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTablesStore } from 'src/stores/tables-store'

const store = useTablesStore()
const tables = computed(() => store.tables)
const loading = computed(() => store.loading)

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'capacity', label: 'Capacidad', field: 'capacity', align: 'left' },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
]

const dialogOpen = ref(false)
const saving = ref(false)
const form = ref({ name: '', capacity: 2 })
function openDialog() {
  form.value = { name: '', capacity: 2 }
  dialogOpen.value = true
}
async function save() {
  if (!form.value.name) return
  saving.value = true
  try {
    await store.create({ ...form.value })
    dialogOpen.value = false
  } finally {
    saving.value = false
  }
}
async function reload() {
  await store.fetchAll()
}
function statusColor(status) {
  if (status === 'available') return 'positive'
  if (status === 'reserved') return 'warning'
  if (status === 'occupied') return 'negative'
  return 'grey'
}

onMounted(() => {
  reload()
})
</script>

<style scoped>
</style>


