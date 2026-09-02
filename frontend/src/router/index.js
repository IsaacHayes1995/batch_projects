import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // Root
  { path: "/", redirect: "/projects" },

  // The app used to be mounted at /workspace. Frappe still serves that prefix
  // (see website_route_rules in hooks.py) so links already sent out — invite
  // and notification emails, shared URLs, bookmarks — keep resolving; this
  // rewrites them onto /projects, preserving the sub-path and query string.
  {
    path: "/workspace/:pathMatch(.*)*",
    redirect: (to) => ({
      path: `/projects${to.path.slice("/workspace".length)}`,
      query: to.query,
      hash: to.hash,
    }),
  },

  // Public, view-only share link (no auth, no app shell)
  {
    path: "/share/:token",
    name: "SharedView",
    component: () => import("@/pages/SharedView.vue"),
    props: true,
    meta: { public: true, title: "Shared View" },
  },

  // Public intake form (no auth, no app shell — bare page)
  {
    path: "/intake/:token",
    name: "IntakeForm",
    component: () => import("@/pages/IntakeForm.vue"),
    props: true,
    meta: { public: true, title: "Intake" },
  },

  // Static workspace routes FIRST (before any :key dynamic routes)
  {
    path: "/projects",
    name: "Dashboard",
    component: () => import("@/pages/Dashboard.vue"),
    meta: { title: "Dashboard" },
  },
  {
    path: "/projects/my-tasks",
    name: "MyTasks",
    component: () => import("@/pages/MyTasks.vue"),
    meta: { title: "My Tasks" },
  },
  {
    path: "/projects/triage",
    name: "Triage",
    component: () => import("@/pages/Triage.vue"),
    meta: { title: "Triage" },
  },
  {
    path: "/projects/new-project",
    name: "NewProject",
    component: () => import("@/pages/CreateProjectFlow.vue"),
    meta: { title: "New Project" },
  },
  {
    path: "/projects/invite/:token",
    name: "AcceptInvitation",
    component: () => import("@/pages/AcceptInvitation.vue"),
    meta: { title: "Invitation" },
  },

  {
    path: "/projects/settings/:tab?",
    name: "WorkspaceSettings",
    component: () => import("@/pages/WorkspaceSettings.vue"),
    props: true,
    meta: { title: "Settings" },
  },
  {
    path: "/projects/automations/canvas/:workflowId?",
    name: "AutomationCanvas",
    component: () => import("@/pages/AutomationCanvas.vue"),
    props: true,
    meta: { title: "Automations" },
  },
  {
    path: "/projects/account",
    name: "AccountSettings",
    component: () => import("@/pages/AccountSettings.vue"),
    meta: { title: "Account Settings" },
  },
  {
    path: "/projects/pricing",
    name: "Pricing",
    component: () => import("@/pages/Billing.vue"),
    meta: { title: "Pricing" },
  },
  {
    path: "/projects/projects/tree",
    name: "ProjectTree",
    component: () => import("@/pages/ProjectTree.vue"),
    meta: { title: "Projects" },
  },
  {
    path: "/projects/all",
    name: "Projects",
    component: () => import("@/pages/Projects.vue"),
    meta: { title: "Projects" },
  },
  {
    path: "/projects/teams",
    name: "Teams",
    component: () => import("@/pages/Teams.vue"),
    meta: { title: "Teams" },
  },
  {
    path: "/projects/people",
    name: "People",
    component: () => import("@/pages/People.vue"),
    meta: { title: "People" },
  },
  // ── Sidebar nav stubs (full pages in later sprints) ──
  {
    path: "/projects/timesheets",
    name: "Timesheets",
    component: () => import("@/pages/Timesheets.vue"),
    meta: { title: "Timesheets" },
  },
  {
    path: "/projects/portfolio",
    name: "Portfolio",
    component: () => import("@/pages/Portfolio.vue"),
    meta: { title: "Portfolio" },
  },
  {
    path: "/projects/goals",
    name: "Goals",
    component: () => import("@/pages/Goals.vue"),
    meta: { title: "Goals" },
  },
  // ── Reports: saved-report list + resizable chart-card builder ──
  {
    path: "/projects/reports",
    redirect: "/projects/reports/dashboard",
  },
  {
    path: "/projects/reports/dashboard",
    name: "ReportsDashboard",
    component: () => import("@/pages/ReportsDashboard.vue"),
    meta: { title: "Reports" },
  },
  {
    path: "/projects/reports/:reportId",
    name: "ReportView",
    component: () => import("@/pages/ReportView.vue"),
    meta: { title: "Report" },
  },
  // Old single dashboard builder is superseded by the Reports surface.
  {
    path: "/projects/dashboard",
    redirect: "/projects/reports/dashboard",
  },
  // ── Dashboards: live/glance boards — separate from Reports
  // above (scheduled/exportable, BP Report). See BP Dashboard. ──
  {
    path: "/projects/dashboards",
    redirect: "/projects/dashboards/dashboard",
  },
  {
    path: "/projects/dashboards/dashboard",
    name: "Dashboards",
    component: () => import("@/pages/Dashboards.vue"),
    meta: { title: "Dashboards" },
  },
  {
    path: "/projects/dashboards/:dashboardId",
    name: "DashboardView",
    component: () => import("@/pages/DashboardView.vue"),
    meta: { title: "Dashboard" },
  },
  {
    path: "/projects/dashboards/:dashboardId/widget/:widgetId",
    name: "WidgetPage",
    component: () => import("@/pages/WidgetPage.vue"),
    meta: { title: "Widget" },
  },
  {
    path: "/projects/workload",
    name: "Workload",
    component: () => import("@/pages/Workload.vue"),
    meta: { title: "Workload" },
  },
  {
    path: "/projects/margin",
    name: "MarginReport",
    component: () => import("@/pages/MarginReport.vue"),
    meta: { title: "Margin" },
  },
  {
    path: "/projects/batch-invoicing",
    name: "BatchInvoicing",
    component: () => import("@/pages/BatchInvoicing.vue"),
    meta: { title: "Invoicing" },
  },
  {
    path: "/projects/utilization",
    name: "Utilization",
    component: () => import("@/pages/Utilization.vue"),
    meta: { title: "Utilization" },
  },

  // Dynamic project routes AFTER static ones
  {
    path: "/projects/:key",
    name: "ProjectIndex",
    component: () => import("@/pages/ProjectIndex.vue"),
    props: true,
    meta: { title: "Project" },
  },
  {
    path: "/projects/:key/summary",
    name: "ProjectSummary",
    component: () => import("@/pages/ProjectSummary.vue"),
    props: true,
    meta: { title: "Summary" },
  },
  {
    path: "/projects/:key/board",
    name: "Board",
    component: () => import("@/pages/Board.vue"),
    props: true,
    meta: { title: "Board" },
  },
  {
    path: "/projects/:key/list",
    name: "ListView",
    component: () => import("@/pages/ListView.vue"),
    props: true,
    meta: { title: "List" },
  },
  {
    path: "/projects/:key/backlog",
    name: "Backlog",
    component: () => import("@/pages/Backlog.vue"),
    props: true,
    meta: { title: "Backlog" },
  },
  {
    path: "/projects/:key/sprint/:sprintId",
    name: "SprintDetail",
    component: () => import("@/pages/SprintDetail.vue"),
    props: true,
    meta: { title: "Sprint" },
  },
  {
    path: "/projects/:key/sprints-overview",
    name: "SprintsOverview",
    component: () => import("@/pages/SprintsOverview.vue"),
    props: true,
    meta: { title: "Sprints" },
  },
  {
    path: "/projects/:key/gantt",
    name: "Gantt",
    component: () => import("@/pages/Gantt.vue"),
    props: true,
    meta: { title: "Gantt" },
  },
  {
    path: "/projects/:key/reports",
    name: "Reports",
    component: () => import("@/pages/Reports.vue"),
    props: true,
    meta: { title: "Reports" },
  },
  {
    path: "/projects/:key/files",
    name: "ProjectFiles",
    component: () => import("@/pages/ProjectFiles.vue"),
    props: true,
    meta: { title: "Files" },
  },
  {
    path: "/projects/:key/notes",
    name: "ProjectNotes",
    component: () => import("@/pages/Notes.vue"),
    props: true,
    meta: { title: "Notes" },
  },
  {
    path: "/projects/:key/draw",
    name: "ProjectDraw",
    component: () => import("@/pages/Draw.vue"),
    props: true,
    meta: { title: "Draw" },
  },
  {
    path: "/projects/:key/draw/:drawingId",
    name: "ProjectDrawCanvas",
    component: () => import("@/pages/DrawCanvas.vue"),
    props: true,
    meta: { title: "Draw" },
  },
  {
    path: "/projects/:key/money",
    name: "ProjectMoney",
    component: () => import("@/pages/ProjectMoney.vue"),
    props: true,
    meta: { title: "Money" },
  },
  {
    path: "/projects/:key/settings/:tab?",
    name: "ProjectSettings",
    component: () => import("@/pages/ProjectSettings.vue"),
    props: true,
    meta: { title: "Settings" },
  },

  // ── Team routes ──
  {
    path: "/projects/team/:key",
    name: "TeamHome",
    component: () => import("@/pages/TeamHome.vue"),
    props: true,
    meta: { title: "Team" },
  },
  {
    path: "/projects/team/:key/settings",
    redirect: (to) => ({ path: `/projects/team/${to.params.key}`, query: { tab: "settings" } }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ─── Auth guard ────────────────────────────────────────────────────────────────
// The SPA template is served to logged-out visitors too (so public /share links
// and the invite-accept page work). For every *non-public* route we require a
// real session — otherwise every authenticated API call 403s with "Login to
// access" and the app renders broken. Redirect to Frappe login instead, with a
// redirect-to back to where they were headed.
function isPublicRoute(to) {
  return to.meta?.public === true ||
    to.path.startsWith("/share/") ||
    to.path.startsWith("/projects/invite/");
}

// ─── Document title ──────────────────────────────────────────────────────────
// Each route carries a meta.title; render it as "Page — Projects" (or
// "Projects" on routes that don't declare one, e.g. redirects).
router.afterEach((to) => {
  const page = to.meta?.title;
  document.title = page ? `${page} — Projects` : "Projects";
});

router.beforeEach((to) => {
  if (isPublicRoute(to)) return true;
  // Only enforce when the server actually injected a session (the production
  // projects.html template sets window.frappe.session). The Vite dev server
  // serves its own index.html with no session — never bounce dev to /login
  // (which the dev proxy would forward to the canonical production host).
  const session = (typeof window !== "undefined") ? window.frappe?.session : null;
  if (session && (!session.user || session.user === "Guest")) {
    const back = encodeURIComponent(to.fullPath);
    window.location.href = `/login?redirect-to=${back}`;
    return false;
  }
  return true;
});

export default router;
