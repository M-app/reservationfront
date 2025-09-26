<template>
  <q-layout view="lHh Lpr lFf">
    <q-header bordered>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title>PELUQUERIA </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list padding>
        <!--
        <q-expansion-item icon="restaurant" label="Restaurante" expand-separator dense>
          <q-item clickable v-ripple to="/calendar" exact>
            <q-item-section avatar><q-icon name="event" /></q-item-section>
            <q-item-section>{{ $t('menu.calendar') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/tables">
            <q-item-section avatar><q-icon name="table_restaurant" /></q-item-section>
            <q-item-section>{{ $t('menu.tables') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/floor-plan">
            <q-item-section avatar><q-icon name="grid_4x4" /></q-item-section>
            <q-item-section>{{ $t('menu.floor') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/customers">
            <q-item-section avatar><q-icon name="people" /></q-item-section>
            <q-item-section>{{ $t('menu.customers') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/reservations">
            <q-item-section avatar><q-icon name="book_online" /></q-item-section>
            <q-item-section>{{ $t('menu.reservations') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/reports">
            <q-item-section avatar><q-icon name="insights" /></q-item-section>
            <q-item-section>{{ $t('menu.reports') }}</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/settings">
            <q-item-section avatar><q-icon name="settings" /></q-item-section>
            <q-item-section>{{ $t('app.settings') }}</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-separator spaced />
        -->

        <q-item-label header>Salón</q-item-label>
        <q-item clickable v-ripple to="/salon/services">
          <q-item-section avatar><q-icon name="local_offer" /></q-item-section>
          <q-item-section>Servicios</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/salon/clients">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Clientes</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/salon/appointments">
          <q-item-section avatar><q-icon name="event_available" /></q-item-section>
          <q-item-section>Citas</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/salon/availability">
          <q-item-section avatar><q-icon name="schedule" /></q-item-section>
          <q-item-section>Disponibilidad</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/salon/calendar">
          <q-item-section avatar><q-icon name="calendar_month" /></q-item-section>
          <q-item-section>Calendario</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/salon/settings">
          <q-item-section avatar><q-icon name="settings_applications" /></q-item-section>
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
