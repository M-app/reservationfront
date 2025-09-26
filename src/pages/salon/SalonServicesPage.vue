<template>
  <q-page padding class="q-gutter-md">
    <div class="row items-center q-gutter-sm">
      <div class="col">
        <div class="text-h6">Servicios</div>
        <div class="text-caption text-grey-7">Gestiona los servicios del salón</div>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Nuevo" @click="openForm()" />
      </div>
    </div>

    <q-table
      flat bordered
      :rows="rows" :columns="columns" row-key="id"
      :loading="loading"
      :filter="filter"
      v-model:pagination="pagination"
      class="bg-white"
    >
      <template #top-right>
        <q-input dense debounce="300" v-model="filter" placeholder="Buscar" outlined clearable>
          <template #append><q-icon name="search" /></template>
        </q-input>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn size="sm" flat round icon="edit" @click="openForm(props.row)" />
          <q-btn size="sm" flat round icon="delete" color="negative" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="formOpen" persistent>
      <q-card style="min-width: 320px; max-width: 600px; width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ form.id ? 'Editar' : 'Nuevo' }} servicio</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.name" label="Nombre" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="form.duration_minutes" type="number" label="Duración (min)" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="form.price" type="number" label="Precio" dense outlined />
            </div>
            <div class="col-12">
              <q-input v-model="form.description" label="Descripción" type="textarea" autogrow dense outlined />
            </div>
          </div>
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
import { ref, onMounted } from 'vue'
import { api } from 'boot/axios'

const loading = ref(false)
const saving = ref(false)
const rows = ref([])
const filter = ref('')
const pagination = ref({ rowsPerPage: 10 })

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'duration_minutes', label: 'Duración (min)', field: 'duration_minutes', align: 'right', sortable: true },
  { name: 'price', label: 'Precio', field: 'price', align: 'right', sortable: true, format: v => `$ ${Number(v).toFixed(2)}` },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

const formOpen = ref(false)
const form = ref({ id: null, name: '', description: '', duration_minutes: 30, price: 0 })

function openForm(row) {
  form.value = row ? { ...row } : { id: null, name: '', description: '', duration_minutes: 30, price: 0 }
  formOpen.value = true
}

async function fetchRows() {
  loading.value = true
  try {
    const { data } = await api.get('/services')
    rows.value = data
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/services/${form.value.id}`, form.value)
    } else {
      await api.post('/services', form.value)
    }
    formOpen.value = false
    await fetchRows()
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  await api.delete(`/services/${row.id}`)
  await fetchRows()
}

onMounted(fetchRows)
</script>
