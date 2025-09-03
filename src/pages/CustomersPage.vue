<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6">{{ $t('menu.customers') }}</div>
      <q-space />
      <q-btn color="primary" :label="$t('customers.new')" @click="openDialog()" />
    </div>

    <q-table :rows="customers" :columns="columns" row-key="id" flat bordered :pagination="{ rowsPerPage: 10 }" />

    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 420px">
        <q-card-section class="text-h6">{{ $t('customers.sheet') }}</q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.id" label="ID" dense outlined />
          <q-input v-model="form.name" :label="$t('customers.name')" dense outlined />
          <q-input v-model="form.phone" :label="$t('customers.phone')" dense outlined />
          <q-input v-model="form.notes" type="textarea" :label="$t('customers.notes')" dense outlined autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('app.cancel')" v-close-popup />
          <q-btn color="primary" :label="$t('app.save')" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomersStore } from 'src/stores/customers-store'

const store = useCustomersStore()
const customers = computed(() => store.customers)

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'phone', label: 'Teléfono', field: 'phone', align: 'left' },
  { name: 'notes', label: 'Notas', field: 'notes', align: 'left' },
]

const dialogOpen = ref(false)
const form = ref({ id: '', name: '', phone: '', notes: '' })
function openDialog() {
  form.value = { id: '', name: '', phone: '', notes: '' }
  dialogOpen.value = true
}
function save() {
  if (!form.value.id || !form.value.name) return
  store.upsertCustomer({ ...form.value, preferences: [] })
  dialogOpen.value = false
}
</script>

<style scoped>
</style>


