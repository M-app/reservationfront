<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title> Restaurante CRM </q-toolbar-title>

        <div class="text-caption">Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list padding>
        <q-item clickable v-ripple to="/calendar" exact>
          <q-item-section avatar><q-icon name="event" /></q-item-section>
          <q-item-section>Calendario</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/tables">
          <q-item-section avatar><q-icon name="table_restaurant" /></q-item-section>
          <q-item-section>Mesas</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/floor-plan">
          <q-item-section avatar><q-icon name="grid_4x4" /></q-item-section>
          <q-item-section>Plano</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/customers">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Clientes</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/reservations">
          <q-item-section avatar><q-icon name="book_online" /></q-item-section>
          <q-item-section>Reservas</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/waitlist">
          <q-item-section avatar><q-icon name="queue" /></q-item-section>
          <q-item-section>Lista de espera</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/communications">
          <q-item-section avatar><q-icon name="sms" /></q-item-section>
          <q-item-section>Comunicaciones</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/reports">
          <q-item-section avatar><q-icon name="insights" /></q-item-section>
          <q-item-section>Reportes</q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Configuración</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const leftDrawerOpen = ref(false)
</script>
