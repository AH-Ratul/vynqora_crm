export type Role = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'SUPPORT_AGENT' | 'MARKETING';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
export type DealStage = 'LEAD' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ActivityType = 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export const ROLES: Role[] = ['ADMIN', 'MANAGER', 'SALES_REP', 'SUPPORT_AGENT', 'MARKETING'];
export const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
  'CONVERTED',
];
export const DEAL_STAGES: DealStage[] = [
  'LEAD',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];
export const ACTIVITY_TYPES: ActivityType[] = ['EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK'];
export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
  CONVERTED: 'Converted',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES_REP: 'Sales Rep',
  SUPPORT_AGENT: 'Support Agent',
  MARKETING: 'Marketing',
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  size?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts: number; deals: number };
  contacts?: Pick<Contact, 'id' | 'firstName' | 'lastName' | 'email' | 'title'>[];
  deals?: Pick<Deal, 'id' | 'title' | 'stage' | 'value'>[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  tags: string[];
  notes?: string | null;
  avatarUrl?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  leads?: Lead[];
  deals?: Deal[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  source?: string | null;
  status: LeadStatus;
  score?: number | null;
  notes?: string | null;
  contactId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    companyId?: string | null;
    company?: { id: string; name: string } | null;
  };
  assignedToId?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  deal?: Deal | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: string | number | null;
  stage: DealStage;
  probability?: number | null;
  expectedCloseDate?: string | null;
  notes?: string | null;
  contactId: string;
  contact?: { id: string; firstName: string; lastName: string; email?: string | null } | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  leadId?: string | null;
  activities?: Activity[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export type PipelineBoard = Record<DealStage, Deal[]>;

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  body?: string | null;
  occurredAt: string;
  createdAt: string;
  contactId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  dealId?: string | null;
  deal?: { id: string; title: string } | null;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  contactId?: string | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  dealId?: string | null;
  deal?: { id: string; title: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  userId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface DashboardKpis {
  totalContacts: number;
  totalCompanies: number;
  totalLeads: number;
  openDeals: number;
  wonDeals: number;
  totalRevenue: number | string;
  pendingTasks: number;
  recentActivities: number;
}

export interface PipelineSummaryItem {
  stage: DealStage;
  count: number;
  totalValue: number | string;
}
