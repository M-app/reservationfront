<template>
  <q-page class="column flex-center bg-grey-2">
    <div class="phone-frame column items-center justify-between">
      <div class="status-bar row items-center justify-between q-px-md q-pt-md">
        <div class="text-weight-medium">Zolmi</div>
        <q-badge :label="statusLabel" :color="statusColor" rounded />
      </div>

      <div class="content column items-center justify-center">
        <q-avatar size="120px" class="q-mb-lg" color="primary" text-color="white">Z</q-avatar>
        <div class="text-h6 q-mb-sm">Agente</div>
        <div class="row items-center q-gutter-sm q-mb-xl">
          <q-select v-model="lang" :options="langOptions" label="Idioma" dense outlined emit-value map-options style="min-width: 220px" />
        </div>
      </div>

      <div class="controls row items-center justify-around q-pb-xl">
        <q-btn round size="xl" color="positive" icon="phone" :loading="connecting" @click="onStart" :disable="active" />
        <q-btn round size="xl" color="negative" icon="call_end" @click="onStop" :disable="!active" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAgentsStore } from 'src/stores/agents-store'

const agents = useAgentsStore()

const active = computed(() => agents.active)
const connecting = computed(() => agents.connecting)
const statusLabel = computed(() => (agents.connecting ? 'Conectando' : agents.active ? 'Activo' : 'Inactivo'))
const statusColor = computed(() => (agents.connecting ? 'warning' : agents.active ? 'positive' : 'grey'))

const lang = ref('es')
const langOptions = [
  { label: 'Español', value: 'es' },
  { label: 'Català', value: 'ca' },
]

async function onStart() { await agents.startAgent({ name: 'Zolmi', lang: lang.value, model: 'gpt-realtime' }) }
async function onStop() { await agents.stopAgent() }

onMounted(() => {
  // Asegura estado limpio si quedó persistido activo
  if (agents.active || agents.connecting || agents.session) {
    agents.stopAgent()
  }
})
</script>

<style scoped>
.phone-frame {
  width: 360px;
  max-width: 92vw;
  height: 640px;
  max-height: 86vh;
  border-radius: 28px;
  background: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}
.status-bar { width: 100%; }
.content { flex: 1; width: 100%; }
.controls { width: 100%; }
</style>


