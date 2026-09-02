<!--
  The Frappe app switcher: the control every Frappe app puts in the top-left of
  its sidebar. Shows this app's mark and name, and opens a dropdown listing the
  other Frappe apps installed on the site, plus the Desk.

  The app list comes from `frappe.apps.get_apps`, the same whitelisted endpoint
  Frappe's own /apps screen uses, so an app appears here exactly when it
  declares `add_to_apps_screen` in its hooks and the viewer passes its
  `has_permission` check. Frappe itself is excluded from that payload, so the
  Desk entry below is added by hand — that mirrors what Frappe's own switcher
  does rather than being a special case for this app.
-->
<template>
  <Dropdown :options="dropdownOptions" placement="left">
    <template #default="{ open }">
      <button
        class="flex h-8 w-full items-center gap-2 rounded px-2 text-left transition-colors hover:bg-surface-gray-2"
        :class="open ? 'bg-surface-gray-2' : ''"
      >
        <img :src="logoUrl" class="h-5 w-5 shrink-0 rounded" :alt="brandName" />
        <span class="flex-1 truncate text-base font-medium text-ink-gray-8">
          {{ brandName }}
        </span>
        <ChevronsUpDown class="h-3.5 w-3.5 shrink-0 text-ink-gray-5" :stroke-width="2" />
      </button>
    </template>
  </Dropdown>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { Dropdown } from 'frappe-ui'
import { ChevronsUpDown } from 'lucide-vue-next'
import { callPath } from '@/utils/api'
import { useEntitlementsStore } from '@/stores/entitlements'

const DEFAULT_LOGO = '/assets/batch_projects/images/projects-logo.svg'

const entitlements = useEntitlementsStore()
const apps = ref([])

// White-label branding (Team plan+) overrides the name and mark shown here,
// exactly as it does in the sidebar and the browser tab.
const brandName = computed(() => entitlements.branding?.brand_name || 'Projects')
const logoUrl = computed(() => entitlements.branding?.logo_url || DEFAULT_LOGO)

const dropdownOptions = computed(() => {
  const others = apps.value
    // This app is the one you are already in — listing it would be a no-op row.
    .filter((app) => app.name !== 'batch_projects')
    .map((app) => ({
      label: app.title || app.name,
      icon: () => appIcon(app.logo),
      onClick: () => {
        window.location.href = app.route || `/${app.name}`
      },
    }))

  return [
    ...(others.length ? [{ group: 'Apps', items: others }] : []),
    {
      group: 'Frappe',
      hideLabel: true,
      items: [
        {
          label: 'Desk',
          icon: 'grid',
          onClick: () => {
            window.location.href = '/app'
          },
        },
        {
          label: 'Log out',
          icon: 'log-out',
          onClick: () => {
            window.location.href = '/api/method/logout'
          },
        },
      ],
    },
  ]
})

// Frappe returns a logo path, not an icon name, so render it as an <img> via
// Dropdown's render-function icon slot instead of its FeatherIcon shorthand.
function appIcon(logo) {
  return h('img', {
    src: logo || DEFAULT_LOGO,
    class: 'h-4 w-4 rounded',
    alt: '',
  })
}

onMounted(async () => {
  try {
    apps.value = (await callPath('frappe.apps.get_apps')) || []
  } catch {
    // A site that blocks the endpoint, or a session that cannot read it, should
    // still get a working switcher — just one that only offers Desk and logout.
    apps.value = []
  }
})
</script>
