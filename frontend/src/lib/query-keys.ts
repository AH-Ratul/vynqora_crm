export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    kpis: ['dashboard', 'kpis'] as const,
    pipeline: ['dashboard', 'pipeline'] as const,
    recentActivity: ['dashboard', 'recent-activity'] as const,
    upcomingTasks: ['dashboard', 'upcoming-tasks'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (filters: Record<string, unknown>) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  companies: {
    all: ['companies'] as const,
    list: (filters: Record<string, unknown>) => ['companies', 'list', filters] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (filters: Record<string, unknown>) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
  },
  deals: {
    all: ['deals'] as const,
    list: (filters: Record<string, unknown>) => ['deals', 'list', filters] as const,
    pipeline: (assignedToId?: string) => ['deals', 'pipeline', assignedToId ?? 'all'] as const,
    detail: (id: string) => ['deals', 'detail', id] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: (filters: Record<string, unknown>) => ['activities', 'list', filters] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters: Record<string, unknown>) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: Record<string, unknown>) => ['users', 'list', filters] as const,
    options: ['users', 'options'] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (filters: Record<string, unknown>) => ['audit', 'list', filters] as const,
  },
};
