<template>
  <q-page padding class="q-gutter-md">
    <div class="row items-center q-gutter-sm">
      <div class="col">
        <div class="text-h6">Clientes</div>
        <div class="text-caption text-grey-7">Gestiona clientes</div>
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
          <div class="text-h6">{{ form.id ? 'Editar' : 'Nuevo' }} cliente</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.first_name" label="Nombre" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.last_name" label="Apellido" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.email" label="Email" type="email" dense outlined />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phone_number" label="Teléfono" dense outlined />
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
  { name: 'first_name', label: 'Nombre', field: 'first_name', align: 'left', sortable: true },
  { name: 'last_name', label: 'Apellido', field: 'last_name', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'phone_number', label: 'Teléfono', field: 'phone_number', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' }
]

const formOpen = ref(false)
const form = ref({ id: null, first_name: '', last_name: '', email: '', phone_number: '' })

function openForm(row) {
  form.value = row ? { ...row } : { id: null, first_name: '', last_name: '', email: '', phone_number: '' }
  formOpen.value = true
}

async function fetchRows() {
  loading.value = true
  try {
    const { data } = await api.get('/clients')
    rows.value = data
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    if (form.value.id) {
      await api.put(`/clients/${form.value.id}`, form.value)
    } else {
      await api.post('/clients', form.value)
    }
    formOpen.value = false
    await fetchRows()
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  await api.delete(`/clients/${row.id}`)
  await fetchRows()
}

onMounted(fetchRows)
</script>
