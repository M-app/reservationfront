<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title>CRM </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list padding>
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
        <q-separator spaced />
        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>{{ $t('app.settings') }}</q-item-section>
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
