<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Configuración</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="text-subtitle1">{{ $t('settings.schedule') }}</q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="openStart" :label="$t('settings.open')" dense outlined />
              </div>
              <div class="col-6">
                <q-input v-model="openEnd" :label="$t('settings.close')" dense outlined />
              </div>
              <div class="col-12">
                <q-input v-model.number="slotMinutes" type="number" :label="$t('settings.interval')" dense outlined />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn color="primary" :label="$t('app.save')" @click="save" />
          </q-card-actions>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section class="text-subtitle1">{{ $t('settings.language') }}</q-card-section>
          <q-separator />
          <q-card-section>
            <q-select v-model="localeModel" :options="localeOptions" emit-value map-options outlined dense />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from 'src/stores/settings-store'
import { useI18n } from 'vue-i18n'
import { setLocale } from 'src/boot/i18n'

const store = useSettingsStore()
const { locale } = useI18n()

const slotMinutes = computed({
  get: () => store.slotMinutes,
  set: (v) => store.updateSlotMinutes(v),
})
const openStart = computed({ get: () => store.openStart, set: (v) => store.updateOpenHours(v, store.openEnd) })
const openEnd = computed({ get: () => store.openEnd, set: (v) => store.updateOpenHours(store.openStart, v) })

function save() {
  // persist plugin already saves on change
}

const localeOptions = [
  { label: 'Español', value: 'es' },
  { label: 'Català', value: 'ca' },
]

const localeModel = computed({
  get: () => locale.value,
  set: (val) => { locale.value = val; setLocale(val) },
})
</script>

<style scoped>
</style>


