<template>
  <div class="contents">
    <!-- ══════════════════════ DESKTOP SIDEBAR ══════════════════════ -->
    <!-- ══════════════════════ DESKTOP SIDEBAR ══════════════════════ -->
    <!-- frappe-ui's own Sidebar component, so this rail is the same one Desk,
         CRM and Helpdesk use: identical header dropdown, section headings,
         row styling and collapse behaviour.

         Rows that carry app-specific affordances — project drag-to-reorder and
         its per-row menu, pinned teams, the Inbox unread badge, the search
         trigger — are rendered through the component's #sidebar-item slot
         instead of its default row, so adopting the shared shell doesn't cost
         any of them. Everything else falls through to frappe-ui's own
         SidebarItem. -->
    <FrappeSidebar
      v-model:collapsed="collapsed"
      :header="sidebarHeader"
      :sections="sections"
      class="hidden lg:flex"
    >
      <template #sidebar-item="{ item, isCollapsed }">
        <!-- Search -->
        <button
          v-if="item.kind === 'search'"
          class="w-full flex items-center gap-2 h-8 px-2 rounded hover:bg-surface-gray-2 transition-colors"
          :title="isCollapsed ? 'Search' : ''"
          @click="$emit('search')"
        >
          <Search :size="16" :stroke-width="1.75" class="text-ink-gray-6 shrink-0" />
          <template v-if="!isCollapsed">
            <span class="flex-1 text-sm text-ink-gray-6 text-left">Search or jump to…</span>
            <kbd
              class="text-xs font-medium text-ink-gray-5 bg-surface-gray-2 border border-outline-gray-2 rounded px-1 py-px leading-none shrink-0"
              >⌘K</kbd
            >
          </template>
        </button>

        <!-- Project row: drag-to-reorder plus a hover menu -->
        <div
          v-else-if="item.kind === 'project'"
          class="relative group/pr sb-proj-row"
          :class="[
            dragIndex === item.index ? 'opacity-40' : '',
            dragOverIndex === item.index ? 'sb-drop-target' : '',
          ]"
          data-proj-menu
          draggable="true"
          @dragstart="onProjDragStart(item.index, $event)"
          @dragenter.prevent="onProjDragEnter(item.index)"
          @dragover.prevent
          @drop="onProjDrop(item.index)"
          @dragend="onProjDragEnd"
        >
          <button
            class="w-full flex items-center gap-2 h-8 px-2 rounded text-left transition-colors"
            :class="
              item.isActive
                ? 'bg-surface-selected shadow-sm text-ink-gray-8'
                : 'text-ink-gray-7 hover:bg-surface-gray-2'
            "
            :title="isCollapsed ? item.label : ''"
            @click="go(store.projectLanding(item.project))"
          >
            <ProjectAvatar :theme="item.project.theme" :seed="item.project.key" size="xs" />
            <template v-if="!isCollapsed">
              <span class="flex-1 text-sm truncate">{{ item.label }}</span>
              <!-- spacer so the name never slides under the hover menu -->
              <span class="w-4 shrink-0" />
            </template>
          </button>

          <button
            v-if="!isCollapsed"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-ink-gray-6 opacity-0 group-hover/pr:opacity-100 hover:bg-surface-gray-4 hover:text-ink-gray-8 transition-[background-color,color,opacity] duration-100"
            :class="projectMenuOpen === item.project.name ? '!opacity-100 bg-surface-gray-3 text-ink-gray-8' : ''"
            data-proj-menu
            @click.stop="toggleProjectMenu(item.project.name)"
          >
            <MoreHorizontal :size="13" :stroke-width="2" />
          </button>

          <Transition name="sb-dd">
            <div
              v-if="projectMenuOpen === item.project.name"
              class="absolute right-0 top-[calc(100%+6px)] w-52 z-[60] sb-pop sb-pop--down"
              data-proj-menu
            >
              <div class="p-1">
                <button class="sb-menu-item" @click.stop="goProject(item.project, 'board')">
                  <Kanban :size="13" :stroke-width="1.5" class="text-muted" />
                  Open Board
                </button>
                <button class="sb-menu-item" @click.stop="goProject(item.project, 'settings')">
                  <Settings :size="13" :stroke-width="1.5" class="text-muted" />
                  Settings
                </button>
                <button
                  class="sb-menu-item"
                  @click.stop="store.toggleFavorite(item.project.name); projectMenuOpen = null;"
                >
                  <component
                    :is="item.project.is_favorite ? PinOff : Pin"
                    :size="13"
                    :stroke-width="1.5"
                    class="text-muted"
                  />
                  {{ item.project.is_favorite ? 'Unpin Project' : 'Pin Project' }}
                </button>
                <div class="h-px bg-separator mx-1 my-1" />
                <button class="sb-menu-item" @click.stop="copyProjectLink(item.project)">
                  <Link2 :size="13" :stroke-width="1.5" class="text-muted" />
                  Copy link
                </button>
                <button class="sb-menu-item" @click.stop="openProjectNewTab(item.project)">
                  <ExternalLink :size="13" :stroke-width="1.5" class="text-muted" />
                  Open in new tab
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Favorite project row — same target, no reordering or menu -->
        <button
          v-else-if="item.kind === 'favorite'"
          class="w-full flex items-center gap-2 h-8 px-2 rounded text-left transition-colors group/fav"
          :class="
            item.isActive
              ? 'bg-surface-selected shadow-sm text-ink-gray-8'
              : 'text-ink-gray-7 hover:bg-surface-gray-2'
          "
          :title="isCollapsed ? item.label : ''"
          @click="go(store.projectLanding(item.project))"
        >
          <ProjectAvatar :theme="item.project.theme" :seed="item.project.key" size="xs" />
          <template v-if="!isCollapsed">
            <span class="flex-1 text-sm truncate">{{ item.label }}</span>
            <span
              role="button"
              tabindex="0"
              class="w-5 h-5 flex items-center justify-center rounded text-warning opacity-0 group-hover/fav:opacity-100 hover:bg-surface-gray-4 transition-[background-color,opacity] cursor-pointer"
              title="Unpin"
              @click.stop="store.toggleFavorite(item.project.name)"
              @keydown.enter.stop.prevent="store.toggleFavorite(item.project.name)"
            >
              <PinOff :size="12" :stroke-width="2" />
            </span>
          </template>
        </button>

        <!-- Pinned team row: hover menu, same shape as a project row -->
        <div v-else-if="item.kind === 'team'" class="relative group/tm" data-team-menu>
          <button
            class="w-full flex items-center gap-2 h-8 px-2 rounded text-left transition-colors"
            :class="
              item.isActive
                ? 'bg-surface-selected shadow-sm text-ink-gray-8'
                : 'text-ink-gray-7 hover:bg-surface-gray-2'
            "
            :title="isCollapsed ? item.label : ''"
            @click="go('/projects/team/' + item.team.team_key)"
          >
            <span
              class="w-5 h-5 rounded-[4px] flex items-center justify-center text-micro font-bold shrink-0 text-white"
              :style="{ background: item.team.team_color || 'var(--accent)' }"
              >{{ (item.team.team_name || '?').slice(0, 2).toUpperCase() }}</span
            >
            <template v-if="!isCollapsed">
              <span class="flex-1 text-sm truncate">{{ item.label }}</span>
              <span class="w-4 shrink-0" />
            </template>
          </button>

          <button
            v-if="!isCollapsed"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-ink-gray-6 opacity-0 group-hover/tm:opacity-100 hover:bg-surface-gray-4 hover:text-ink-gray-8 transition-[background-color,color,opacity] duration-100"
            :class="teamMenuOpen === item.team.team_key ? '!opacity-100 bg-surface-gray-3 text-ink-gray-8' : ''"
            data-team-menu
            @click.stop="toggleTeamMenu(item.team.team_key)"
          >
            <MoreHorizontal :size="13" :stroke-width="2" />
          </button>

          <Transition name="sb-dd">
            <div
              v-if="teamMenuOpen === item.team.team_key"
              class="absolute right-0 top-[calc(100%+6px)] w-52 z-[60] sb-pop sb-pop--down"
              data-team-menu
            >
              <div class="p-1">
                <button class="sb-menu-item" @click.stop="goTeam(item.team.team_key, '')">
                  <UsersRound :size="13" :stroke-width="1.5" class="text-muted" />
                  Overview
                </button>
                <div class="h-px bg-separator mx-1 my-1" />
                <button class="sb-menu-item" @click.stop="goTeam(item.team.team_key, 'settings')">
                  <Settings :size="13" :stroke-width="1.5" class="text-muted" />
                  Settings
                </button>
                <button
                  class="sb-menu-item text-muted"
                  @click.stop="store.togglePinnedTeam(item.team); teamMenuOpen = null"
                >
                  <PinOff :size="13" :stroke-width="1.5" class="text-muted" />
                  Unpin
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- "More" — overflow menu for less-frequently-used surfaces, kept as a
             popover rather than a nested submenu so every entry stays one click
             away. -->
        <div v-else-if="item.kind === 'more'" class="relative">
          <SidebarItem
            :label="item.label"
            :icon="item.icon"
            :isActive="moreMenuActive"
            :isCollapsed="isCollapsed"
            data-more-menu
            @click="moreMenuOpen = !moreMenuOpen"
          />
          <Transition name="sb-dd">
            <div
              v-if="moreMenuOpen"
              class="absolute left-0 top-[calc(100%+4px)] w-48 z-[60] sb-pop sb-pop--down"
              data-more-menu
            >
              <div class="p-1">
                <button
                  v-if="entitlements.can('dashboards')"
                  class="sb-menu-item"
                  @click="moreMenuOpen = false; go('/projects/dashboards/dashboard')"
                >
                  <LayoutDashboard :size="14" :stroke-width="1.5" class="text-muted" />
                  Dashboards
                </button>
                <button class="sb-menu-item" @click="go('/projects/triage'); moreMenuOpen = false">
                  <Inbox :size="14" :stroke-width="1.5" class="text-muted" />
                  Triage
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Everything else is a plain frappe-ui row; `suffix` carries the
             Inbox unread count. -->
        <SidebarItem
          v-else
          :label="item.label"
          :icon="item.icon"
          :isActive="item.isActive"
          :isCollapsed="isCollapsed"
          @click="item.onClick?.()"
        >
          <template v-if="item.badge" #suffix>
            <span class="sb-badge">{{ item.badge }}</span>
          </template>
        </SidebarItem>
      </template>

      <!-- Account block, pinned under the nav above frappe-ui's collapse row. -->
      <template #footer-items="{ isCollapsed }">
        <div class="relative" ref="userMenuRef">
          <button
            class="w-full flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-gray-2 transition-colors"
            :class="isCollapsed ? 'justify-center' : ''"
            :title="isCollapsed ? userName : ''"
            @click="userMenuOpen = !userMenuOpen"
          >
            <div class="sb-avatar shrink-0">{{ userInitials }}</div>
            <template v-if="!isCollapsed">
              <div class="flex-1 min-w-0 text-left">
                <p class="text-sm font-medium text-ink-gray-8 truncate leading-none">
                  {{ userName }}
                </p>
                <p class="text-xs text-ink-gray-5 truncate mt-1 leading-none">
                  {{ userEmail }}
                </p>
              </div>
              <ChevronsUpDown :size="12" :stroke-width="2" class="text-ink-gray-6 shrink-0" />
            </template>
          </button>

          <Transition name="sb-dd">
            <div
              v-if="userMenuOpen"
              class="absolute bottom-full left-0 right-0 mb-2 z-50 sb-pop sb-pop--up"
            >
              <div class="px-3 py-2.5 border-b border-separator">
                <p class="text-sm font-semibold text-foreground truncate">{{ userName }}</p>
                <p class="text-xs text-muted truncate mt-0.5">{{ userEmail }}</p>
              </div>
              <div class="p-1">
                <button
                  v-if="entitlements.isWorkspaceAdmin"
                  class="sb-menu-item"
                  @click="go('/projects/settings'); userMenuOpen = false"
                >
                  <SlidersHorizontal :size="14" :stroke-width="1.5" class="text-muted" />
                  Workspace settings
                </button>
                <button class="sb-menu-item" @click="go('/projects/account'); userMenuOpen = false">
                  <Settings :size="14" :stroke-width="1.5" class="text-muted" />
                  Account settings
                </button>
                <button class="sb-menu-item" @click="go('/projects/pricing'); userMenuOpen = false">
                  <CreditCard :size="14" :stroke-width="1.5" class="text-muted" />
                  Billing &amp; plan
                </button>
                <div class="h-px bg-separator mx-1 my-1" />
                <button class="sb-menu-item sb-menu-danger" @click="logout">
                  <LogOut :size="14" :stroke-width="1.5" />
                  Sign out
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </template>
    </FrappeSidebar>

    <!-- ══════════════════════ MOBILE BOTTOM NAV ══════════════════════ -->
    <nav
      class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-overlay border-t border-border"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <div class="flex items-center justify-around px-1 py-1">
        <MobileTab
          :active="exactActive('/projects')"
          @click="go('/projects')"
        >
          <House :size="20" :stroke-width="1.5" />
          <span>Home</span>
        </MobileTab>
        <MobileTab
          :active="$route.path.includes('/board')"
          @click="
            currentProjectKey
              ? go(`/projects/${currentProjectKey}/board`)
              : go('/projects')
          "
        >
          <Kanban :size="20" :stroke-width="1.5" />
          <span>Board</span>
        </MobileTab>
        <button
          @click="store.showCreateTask = true"
          class="flex items-center justify-center -mt-5 rounded-full text-ink-gray-9 active:scale-95 transition-transform"
          style="
            width: 48px;
            height: 48px;
            background: var(--accent);
            box-shadow: 0 4px 14px color-mix(in oklab, var(--accent) 40%, transparent);
          "
        >
          <Plus :size="20" :stroke-width="2.5" />
        </button>
        <MobileTab
          :active="exactActive('/projects/my-tasks')"
          @click="go('/projects/my-tasks')"
        >
          <CircleCheckBig :size="20" :stroke-width="1.5" />
          <span>Tasks</span>
        </MobileTab>
        <MobileTab
          :active="mobileDrawerOpen"
          @click="mobileDrawerOpen = !mobileDrawerOpen"
        >
          <Menu :size="20" :stroke-width="1.5" />
          <span>More</span>
        </MobileTab>
      </div>
    </nav>

    <!-- Mobile drawer -->
    <Transition name="drawer">
      <div
        v-if="mobileDrawerOpen"
        class="lg:hidden fixed inset-0 z-30 flex flex-col justify-end"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="mobileDrawerOpen = false"
        />
        <div
          class="relative bg-overlay rounded-t-2xl max-h-[80vh] flex flex-col"
          style="box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.15)"
        >
          <div class="flex justify-center pt-3 pb-2 shrink-0">
            <div class="w-8 h-1 rounded-full bg-border" />
          </div>
          <div
            class="flex items-center px-4 pb-3 pt-1 shrink-0 border-b border-separator"
          >
            <div
              class="w-7 h-7 rounded-[6px] flex items-center justify-center mr-2.5 overflow-hidden shrink-0"
            >
              <img :src="entitlements.branding.logo_url || '/assets/batch_projects/images/projects-logo.svg'" class="w-full h-full object-cover" alt="" />
            </div>
            <span class="text-base font-semibold text-foreground">{{
              workspaceName
            }}</span>
            <button
              @click="mobileDrawerOpen = false"
              class="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-muted hover:bg-surface-secondary transition-colors"
            >
              <X :size="16" :stroke-width="1.5" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-3 py-2">
            <div
              v-for="p in store.projects"
              :key="'m-' + p.name"
              class="flex items-center gap-3 px-2.5 py-2.5 rounded-md cursor-pointer hover:bg-surface-secondary transition-colors"
              @click="go('/projects/' + p.key + '/board'); mobileDrawerOpen = false"
            >
              <ProjectAvatar :theme="p.theme" :seed="p.key" size="md" class="shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-base font-semibold text-foreground truncate">
                  {{ p.project_name || p.name }}
                </p>
                <p class="text-xs text-muted font-mono mt-0.5">
                  {{ p.key }}
                </p>
              </div>
              <ChevronRight
                :size="14"
                :stroke-width="1.5"
                class="text-muted shrink-0"
              />
            </div>
          </div>
          <div
            class="shrink-0 px-4 py-3 border-t border-separator flex items-center gap-2.5"
            style="padding-bottom: env(safe-area-inset-bottom, 12px)"
          >
            <div class="sb-avatar shrink-0">{{ userInitials }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-semibold text-foreground truncate">
                {{ userName }}
              </p>
              <p class="text-xs text-muted truncate">{{ userEmail }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, h, defineComponent, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useReportsStore } from '@/stores/reports'
import { useDashboardsStore } from '@/stores/dashboards'
import { useEntitlementsStore } from '@/stores/entitlements'
import { reportIcon } from '@/utils/reportIcons'
import { getNotificationCount, bridgeLogout } from '@/utils/api'
import { onRealtimeEvent } from '@/utils/realtime'
import { toast } from 'vue-sonner'
import { playNotificationPing } from '@/composables/useNotificationSound'
import {
  Building2,
  ChevronsUpDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Kanban,
  Menu,
  X,
  BarChart3,
  TrendingUp,
  ReceiptText,
  PieChart,
  LayoutGrid,
  LayoutDashboard,
  FileBarChart2,
  SlidersHorizontal, Target, ListTodo, FolderTree,
} from 'lucide-vue-next'
// Untitled UI free icons for the sidebar's prominent nav items — see
// icons/untitledui.js for the license note. First-pass swap covering the
// most visible icons; secondary/structural chrome above stays Lucide.
import {
  House,
  CircleCheckBig,
  Inbox,
  Timer,
  UsersRound,
  Search,
  Plus,
  PenLine,
  Settings,
  LogOut,
  Briefcase,
  MoreHorizontal,
  Link2,
  ExternalLink,
  PinOff,
  Pin,
  CreditCard,
} from '@/icons/untitledui'
import { ProjectAvatar } from '@/ui'
import { Sidebar as FrappeSidebar, SidebarItem } from 'frappe-ui'
import { useFrappeApps } from '@/composables/useFrappeApps'

// Default mark and product name, overridden by white-label branding.
const PROJECTS_LOGO = '/assets/batch_projects/images/projects-logo.svg'

const store = useProjectStore()
const reportsStore = useReportsStore()
const dashboardsStore = useDashboardsStore()
const entitlements = useEntitlementsStore()
const route = useRoute()
const router = useRouter()

// Featured reports pinned to the sidebar.
const pinnedReports = computed(() => reportsStore.reports.filter(r => r.pinned))
// Featured dashboards pinned to the sidebar — see the DASHBOARDS section below.
const pinnedDashboards = computed(() => dashboardsStore.dashboards.filter(d => d.pinned))
function iconFor(name) { return reportIcon(name) }

// "Reports Dashboard" is active on the dashboard/list, or on a report that
// isn't pinned (a pinned report highlights its own row instead — so exactly
// one entry is ever active).
const reportsActive = computed(() => {
  const p = route.path
  if (!p.startsWith('/projects/reports')) return false
  const id = route.params.reportId
  if (id && pinnedReports.value.some(r => r.id === id)) return false
  return true
})

// Dashboards moved into the "More" popover (see moreMenuOpen) — no pinned
// sub-items inline in the sidebar, matching the flat single-click reference
// (a "More" menu with nested submenus becomes a maze, not a shortcut).
// Lights up the "More" trigger while any dashboard route is open (the
// listing itself lives inside that popover — see "Dashboards" button
// above — and pinned dashboards get their own top-level row instead, see
// pinnedDashboards below, so this is only used for the More trigger now).
//
// Missing the same exclusion reportsActive (above) already has for pinned
// reports: opening a PINNED dashboard also matches this startsWith check,
// so its own sidebar row AND the More trigger both lit up active at once —
// two "you are here" indicators for one location. Mirrors reportsActive's
// pattern exactly: a dashboard route only counts toward More once it's
// confirmed NOT one of the pinned rows already claiming it.
const dashboardsActive = computed(() => {
  const p = route.path
  if (!p.startsWith('/projects/dashboards')) return false
  const id = route.params.dashboardId
  if (id && pinnedDashboards.value.some(d => d.id === id)) return false
  return true
})
const triageActive = computed(() => exactActive('/projects/triage'))
const moreMenuActive = computed(() => dashboardsActive.value || triageActive.value)

// ── State ─────────────────────────────────────────────────────────────
const collapsed = ref(false)

const mobileDrawerOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const showAll = ref(false)
const projectMenuOpen = ref(null)
const teamMenuOpen    = ref(null)
const moreMenuOpen    = ref(false)

const MAX_VISIBLE = 6

defineEmits(['search'])
defineExpose({ collapsed })

const brandName = computed(() => entitlements.branding.brand_name || 'Projects')
// The organisation, shown above the app name in the header — the Desk shows
// the company over "ERPNext" the same way. Deliberately skips the
// white-label brand name, which is the *app* name and is the subtitle.
const orgName = computed(() => {
  const site = window.frappe?.sitename || window.frappe_sitename || ''
  const label = site.split('.')[0]
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Workspace'
})

// ── Frappe app switcher / header menu ─────────────────────────────────
// Mirrors the Desk header: the workspace name over the app name, opening a
// menu that jumps to the other Frappe apps on this site, the Desk, the
// website, and this app's own settings. `frappe` itself never appears in
// get_apps()'s payload, which is why Desk is a hand-written entry.
const { apps: frappeApps } = useFrappeApps({ exclude: ['batch_projects'] })

function appIconFor(logo) {
  return () =>
    h('img', {
      src: logo || PROJECTS_LOGO,
      class: 'size-4 rounded',
      alt: '',
    })
}

const sidebarHeader = computed(() => ({
  title: orgName.value,
  subtitle: brandName.value,
  logo: entitlements.branding.logo_url || PROJECTS_LOGO,
  menuItems: [
    ...(frappeApps.value.length
      ? [
          {
            group: 'Apps',
            items: frappeApps.value.map((app) => ({
              label: app.title || app.name,
              icon: appIconFor(app.logo),
              onClick: () => {
                window.location.href = app.route || `/${app.name}`
              },
            })),
          },
        ]
      : []),
    {
      group: 'Frappe',
      hideLabel: true,
      items: [
        { label: 'Desk', icon: 'grid', onClick: () => { window.location.href = '/app' } },
        { label: 'Website', icon: 'globe', onClick: () => { window.location.href = '/' } },
      ],
    },
    {
      group: 'This app',
      hideLabel: true,
      items: [
        ...(entitlements.isWorkspaceAdmin
          ? [{ label: 'Workspace settings', icon: 'sliders', onClick: () => go('/projects/settings') }]
          : []),
        { label: 'Account settings', icon: 'settings', onClick: () => go('/projects/account') },
        { label: 'Reload', icon: 'refresh-cw', onClick: () => window.location.reload() },
      ],
    },
    {
      group: 'Session',
      hideLabel: true,
      items: [{ label: 'Log out', icon: 'log-out', onClick: () => logout() }],
    },
  ],
}))

// ── Nav model ─────────────────────────────────────────────────────────
// frappe-ui's Sidebar renders from a sections/items model rather than markup.
// `kind` selects which renderer the #sidebar-item slot uses; anything without
// one falls through to frappe-ui's own SidebarItem.
const sections = computed(() => {
  const out = []

  const personal = [
    { key: 'search', kind: 'search', label: 'Search' },
    { key: 'home', label: 'Home', icon: House, isActive: exactActive('/projects'), onClick: () => go('/projects') },
    {
      key: 'my-tasks',
      label: 'My Tasks',
      icon: CircleCheckBig,
      isActive: exactActive('/projects/my-tasks'),
      onClick: () => go('/projects/my-tasks'),
    },
    {
      key: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      isActive: store.showNotifDrawer,
      badge: unreadCount.value || null,
      onClick: () => store.toggleNotifDrawer(true),
    },
  ]
  if (entitlements.canWorkspace('timesheets')) {
    personal.push({
      key: 'timesheets',
      label: 'Timesheets',
      icon: Timer,
      isActive: exactActive('/projects/timesheets'),
      onClick: () => go('/projects/timesheets'),
    })
  }
  personal.push({ key: 'more', kind: 'more', label: 'More', icon: MoreHorizontal })
  out.push({ label: '', items: personal })

  if (favoriteProjects.value.length) {
    out.push({
      label: 'Favorites',
      items: favoriteProjects.value.map((p) => ({
        key: `fav-${p.name}`,
        kind: 'favorite',
        label: p.project_name || p.name,
        project: p,
        isActive: isProjectActive(p.key),
      })),
    })
  }

  const projectItems = visibleProjects.value.map((p, index) => ({
    key: p.name,
    kind: 'project',
    label: p.project_name || p.name,
    project: p,
    index,
    isActive: isProjectActive(p.key),
  }))
  if (store.projects.length > MAX_VISIBLE) {
    projectItems.push({
      key: 'show-all',
      label: showAll.value ? 'Show less' : `Show all (${store.projects.length})`,
      icon: showAll.value ? ChevronUp : ChevronDown,
      onClick: () => { showAll.value = !showAll.value },
    })
  }
  projectItems.push({
    key: 'new-project',
    label: store.projects.length ? 'New project' : 'Create first project',
    icon: Plus,
    onClick: () => go('/projects/new-project'),
  })
  out.push({ label: 'Projects', items: projectItems, collapsible: true })

  if (entitlements.can('dashboards') && pinnedDashboards.value.length) {
    out.push({
      label: 'Dashboards',
      collapsible: true,
      items: pinnedDashboards.value.map((d) => ({
        key: `dash-${d.id}`,
        label: d.title || d.name,
        icon: LayoutDashboard,
        isActive: route.path === `/projects/dashboards/${d.id}`,
        onClick: () => go(`/projects/dashboards/${d.id}`),
      })),
    })
  }

  if (entitlements.canWorkspace('reports')) {
    const reports = [
      {
        key: 'report-builder',
        label: 'Report Builder',
        icon: FileBarChart2,
        isActive: reportsActive.value,
        onClick: () => go('/projects/reports/dashboard'),
      },
      ...pinnedReports.value.map((r) => ({
        key: `report-${r.id}`,
        label: r.title || r.name,
        icon: iconFor(r.icon),
        isActive: route.params.reportId === r.id,
        onClick: () => go(`/projects/reports/${r.id}`),
      })),
    ]
    out.push({ label: 'Reports', items: reports, collapsible: true })
  }

  const insights = [
    { key: 'goals', label: 'Goals', icon: Target, isActive: exactActive('/projects/goals'), onClick: () => go('/projects/goals') },
    { key: 'portfolio', label: 'Portfolio', icon: Briefcase, isActive: exactActive('/projects/portfolio'), onClick: () => go('/projects/portfolio') },
    { key: 'tree', label: 'Project Tree', icon: Briefcase, isActive: exactActive('/projects/projects/tree'), onClick: () => go('/projects/projects/tree') },
    { key: 'workload', label: 'Workload', icon: BarChart3, isActive: exactActive('/projects/workload'), onClick: () => go('/projects/workload') },
  ]
  if (entitlements.viewMoneyAnywhere) {
    insights.push(
      { key: 'margin', label: 'Margin Report', icon: TrendingUp, isActive: exactActive('/projects/margin'), onClick: () => go('/projects/margin') },
      { key: 'batch-invoicing', label: 'Batch Invoicing', icon: ReceiptText, isActive: exactActive('/projects/batch-invoicing'), onClick: () => go('/projects/batch-invoicing') },
    )
  }
  insights.push({ key: 'utilization', label: 'Utilization', icon: PieChart, isActive: exactActive('/projects/utilization'), onClick: () => go('/projects/utilization') })
  out.push({ label: 'Insights', items: insights, collapsible: true })

  const team = [
    { key: 'people', label: 'People', icon: UsersRound, isActive: exactActive('/projects/people'), onClick: () => go('/projects/people') },
    { key: 'teams', label: 'Teams', icon: Building2, isActive: exactActive('/projects/teams'), onClick: () => go('/projects/teams') },
    ...store.pinnedTeams.map((t) => ({
      key: `team-${t.team_key}`,
      kind: 'team',
      label: t.team_name,
      team: t,
      isActive: route.path.startsWith('/projects/team/' + t.team_key),
    })),
  ]
  out.push({ label: 'Team', items: team, collapsible: true })

  return out
})

// ── Notification badge ────────────────────────────────────────────────
const unreadCount = computed(() => store.notificationCount || 0)
const sessionUser = window?.frappe?.session?.user || ''
let stopNotifRealtime = null

// ── Workspace name ────────────────────────────────────────────────────
const workspaceName = computed(
  () =>
    entitlements.branding.brand_name ||
    window.frappe?.boot?.sysdefaults?.company ||
    window.frappe?.sitename?.split('.')[0] ||
    'Projects'
)

// ── User info (reactive — sourced from the store, not window.frappe) ─────
const userName = computed(
  () =>
    store.currentUser?.fullname ||
    store.currentUser?.user ||
    'User'
)
const userEmail = computed(() => store.currentUser?.user || '')
const userInitials = computed(() =>
  userName.value
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
)

// ── Projects ──────────────────────────────────────────────────────────
const currentProjectKey = computed(() => route.params.key || null)

const favoriteProjects = computed(() => store.projects.filter(p => p.is_favorite))

const visibleProjects = computed(() => {
  const all = store.sortedProjects || []
  return showAll.value ? all : all.slice(0, MAX_VISIBLE)
})

// ── Drag-to-reorder projects ──────────────────────────────────────────────
// Native HTML5 DnD. The visible list is a prefix of the full sorted order, so a
// visible index maps 1:1 to the full-order index in both collapsed & expanded
// states. Persists to the store (localStorage).
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onProjDragStart(idx, e) {
  dragIndex.value = idx
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) } catch {}
}
function onProjDragEnter(idx) {
  if (dragIndex.value === null || idx === dragIndex.value) return
  dragOverIndex.value = idx
}
function onProjDrop(idx) {
  if (dragIndex.value === null) return
  const names = store.sortedProjects.map(p => p.name)
  const [moved] = names.splice(dragIndex.value, 1)
  names.splice(idx, 0, moved)
  store.setProjectOrder(names)
  onProjDragEnd()
}
function onProjDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

// ── Route helpers ─────────────────────────────────────────────────────
function exactActive (path) {
  return route.path === path
}
function isProjectActive (key) {
  return route.path.startsWith(`/projects/${key}`)
}

// ── Margin indicator ──────────────────────────────────────────────────
// Shows `—` until ERP bridge provides real margin_pct on project objects.
function marginText (project) {
  if (project.margin_pct != null) return `${Math.round(project.margin_pct)}%`
  return '—'
}
function marginColorClass (project) {
  if (project.margin_pct == null) return 'text-muted'
  if (project.margin_pct >= 70) return 'text-success'
  if (project.margin_pct >= 50) return 'text-warning'
  return 'text-danger'
}

// ── Project 3-dot menu ────────────────────────────────────────────────
function toggleProjectMenu (name) {
  projectMenuOpen.value = projectMenuOpen.value === name ? null : name
}
function goProject (p, section) {
  go('/projects/' + p.key + '/' + section)
  projectMenuOpen.value = null
}
function copyProjectLink (p) {
  const url = window.location.origin + '/projects/' + p.key + '/board'
  navigator.clipboard?.writeText(url).catch(() => {})
  projectMenuOpen.value = null
}
function openProjectNewTab (p) {
  window.open('/projects/' + p.key + '/board', '_blank')
  projectMenuOpen.value = null
}
function onDocProjectMenu (e) {
  if (!e.target.closest('[data-proj-menu]')) projectMenuOpen.value = null
}

// ── Team 3-dot menu ───────────────────────────────────────────────────
function toggleTeamMenu (key) {
  teamMenuOpen.value = teamMenuOpen.value === key ? null : key
}
function goTeam (key, section) {
  go('/projects/team/' + key + (section ? '/' + section : ''))
  teamMenuOpen.value = null
}
function onDocTeamMenu (e) {
  if (!e.target.closest('[data-team-menu]')) teamMenuOpen.value = null
}

// ── "More" overflow menu ────────────────────────────────────────────────
function onDocMoreMenu (e) {
  if (!e.target.closest('[data-more-menu]')) moreMenuOpen.value = false
}

// ── Actions ───────────────────────────────────────────────────────────
function go (path) {
  router.push(path)
  mobileDrawerOpen.value = false
  projectMenuOpen.value = null
  moreMenuOpen.value = false
}
async function logout () {
  userMenuOpen.value = false
  await bridgeLogout()  // best-effort: drop the gateway session before Frappe logout
  window.location.href = '/logout'
}

function onOutsideUserMenu (e) {
  if (!userMenuRef.value?.contains(e.target)) userMenuOpen.value = false
}


// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  document.addEventListener('mousedown', onOutsideUserMenu)
  document.addEventListener('mousedown', onDocProjectMenu)
  document.addEventListener('mousedown', onDocTeamMenu)
  document.addEventListener('mousedown', onDocMoreMenu)
  reportsStore.load().catch(() => {})
  dashboardsStore.load().catch(() => {})
  try {
    const res = await getNotificationCount()
    store.notificationCount = res?.unread_count ?? 0
  } catch {}
  // Was window.frappe.realtime.on('bp_notification_count', ...) — dead on
  // arrival, this SPA has no socket.io connection (window.frappe.realtime
  // never exists here), only bp-gateway's own SSE plane. Replaced with the
  // same connection every other live feature (board, drawings) uses;
  // events.py's _push_notification_badge now publishes through it too.
  stopNotifRealtime = onRealtimeEvent((payload) => {
    if (payload?.event === 'notification.badge' && payload.recipient === sessionUser) {
      store.notificationCount = payload.unread_count ?? store.notificationCount
    } else if (payload?.event === 'task.assigned' && payload.assignee === sessionUser && payload.user !== sessionUser) {
      playNotificationPing()
      toast(`${payload.actor_name || 'Someone'} assigned you to ${payload.task_key || 'a task'}`, {
        description: payload.title || undefined,
      })
    }
  })
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideUserMenu)
  document.removeEventListener('mousedown', onDocProjectMenu)
  document.removeEventListener('mousedown', onDocTeamMenu)
  document.removeEventListener('mousedown', onDocMoreMenu)
  stopNotifRealtime?.()
})

// ── Sub-components ────────────────────────────────────────────────────

const MobileTab = defineComponent({
  props: ['active'],
  emits: ['click'],
  setup (props, { slots, emit }) {
    return () =>
      h(
        'button',
        {
          onClick: () => emit('click'),
          class: [
            'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-md flex-1 text-xs font-medium transition-colors',
            props.active ? 'text-[var(--accent)]' : 'text-muted'
          ].join(' ')
        },
        slots.default?.()
      )
  }
})
</script>

<style scoped>
/* Drag-to-reorder projects */
.sb-proj-row { cursor: grab; }
.sb-proj-row:active { cursor: grabbing; }
/* Reorder drop indicator — a floating rounded bar with a leading dot,
   sitting just above the row (not flush/inset with its edge) so it reads as
   its own "insert here" affordance rather than a flat border line. */
.sb-drop-target::before {
  content: '';
  position: absolute;
  left: 12px;
  right: 4px;
  top: -1.5px;
  height: 2px;
  border-radius: 9999px;
  background: var(--accent);
}
.sb-drop-target::after {
  content: '';
  position: absolute;
  left: 6px;
  top: -3.5px;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: var(--accent);
}

/* Header icon buttons */
.sb-hdr-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
  flex-shrink: 0;
}
.sb-hdr-btn:hover {
  color: var(--sidebar-text-active);
  background: var(--sidebar-hover-bg);
}

/* HeroUI-style popover surface (floats above the sidebar) */
.sb-pop {
  background: var(--overlay);
  border-radius: 11px;
  box-shadow: var(--overlay-shadow);
  overflow: hidden;
}
.sb-pop--down { transform-origin: top right; }
.sb-pop--up   { transform-origin: bottom center; }

/* Collapsed icon buttons */
.sb-col-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.12s, background 0.12s, transform 0.12s;
}
.sb-col-btn:active { transform: scale(0.92); }
.sb-col-btn:hover {
  color: var(--sidebar-text-active);
  background: var(--sidebar-hover-bg);
}
.sb-col-btn.sb-col-active {
  color: var(--sidebar-text-active);
  background: var(--sidebar-active-bg);
}

/* Unread badge */
.sb-badge {
  font-size:var(--text-xs);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 15%, transparent);
  padding: 1px 5px;
  border-radius: 20px;
  flex-shrink: 0;
}

/* User avatar */
.sb-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklab, var(--accent) 20%, transparent);
  color: var(--accent);
  font-size:var(--text-xs);
  font-weight: 700;
  flex-shrink: 0;
  border: 1.5px solid var(--sidebar-bg);
}

/* Dropdown menu items — HeroUI menu rows floating above the sidebar */
.sb-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
  padding: 6px 10px;
  font-size:var(--text-base);
  font-weight: 500;
  font-family: inherit;
  color: var(--foreground);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.1s var(--ease-out, ease);
}
.sb-menu-item:hover {
  background: var(--default);
}
.sb-menu-item:active { background: var(--default-hover, var(--default)); }
.sb-menu-danger {
  color: var(--danger);
}
.sb-menu-danger:hover {
  background: var(--danger-soft);
}

/* Scrollbar */
.sb-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-secondary, #d5d5d5) transparent;
}
.sb-scroll::-webkit-scrollbar {
  width: 3px;
}
.sb-scroll::-webkit-scrollbar-thumb {
  background: var(--border-secondary, #d5d5d5);
  border-radius: 3px;
}

/* Popover open/close — HeroUI-style fade + zoom from the trigger edge */
.sb-dd-enter-active {
  transition: opacity 0.15s var(--ease-out, ease),
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.sb-dd-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.sb-dd-enter-from,
.sb-dd-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}

/* Mobile drawer */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.18s ease;
}
.drawer-enter-active .relative,
.drawer-leave-active .relative {
  transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .relative,
.drawer-leave-to .relative {
  transform: translateY(100%);
}
</style>
