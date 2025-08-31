<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Configuración</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="text-subtitle1">Horario</q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="openStart" label="Apertura (HH:mm)" dense outlined />
              </div>
              <div class="col-6">
                <q-input v-model="openEnd" label="Cierre (HH:mm)" dense outlined />
              </div>
              <div class="col-12">
                <q-input v-model.number="slotMinutes" type="number" label="Intervalo (min)" dense outlined />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn color="primary" label="Guardar" @click="save" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from 'src/stores/settings-store'

const store = useSettingsStore()

const slotMinutes = computed({
  get: () => store.slotMinutes,
  set: (v) => store.updateSlotMinutes(v),
})
const openStart = computed({ get: () => store.openStart, set: (v) => store.updateOpenHours(v, store.openEnd) })
const openEnd = computed({ get: () => store.openEnd, set: (v) => store.updateOpenHours(store.openStart, v) })

function save() {
  // persist plugin already saves on change
}
</script>

<style scoped>
</style>


