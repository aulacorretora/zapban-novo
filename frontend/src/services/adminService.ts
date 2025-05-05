import { fetchWithErrorHandling } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  active: boolean;
  role: 'admin' | 'user';
  createdAt: string;
  instances: number;
}

export interface Instance {
  id: string;
  name: string;
  userId: string;
  userName: string;
  status: 'connected' | 'disconnected';
  createdAt: string;
  messagesCount: number;
}

const mockUsers: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'admin@zapban.com',
    name: 'Admin User',
    active: true,
    role: 'admin',
    createdAt: new Date().toISOString(),
    instances: 2
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    name: 'Regular User',
    active: true,
    role: 'user',
    createdAt: new Date().toISOString(),
    instances: 1
  }
];

const mockInstances: Instance[] = [
  {
    id: 'inst-00000000-0000-0000-0000-000000000000',
    name: 'Admin Instance 1',
    userId: '00000000-0000-0000-0000-000000000000',
    userName: 'Admin User',
    status: 'connected',
    createdAt: new Date().toISOString(),
    messagesCount: 150
  },
  {
    id: 'inst-00000000-0000-0000-0000-000000000001',
    name: 'Admin Instance 2',
    userId: '00000000-0000-0000-0000-000000000000',
    userName: 'Admin User',
    status: 'disconnected',
    createdAt: new Date().toISOString(),
    messagesCount: 75
  },
  {
    id: 'inst-11111111-1111-1111-1111-111111111111',
    name: 'User Instance',
    userId: '11111111-1111-1111-1111-111111111111',
    userName: 'Regular User',
    status: 'connected',
    createdAt: new Date().toISOString(),
    messagesCount: 42
  }
];

export async function getUsers() {
  if (process.env.NODE_ENV === 'development') {
    return { data: { users: mockUsers }, error: null };
  }
  return fetchWithErrorHandling<{ users: User[] }>('/api/admin/users');
}

export async function getInstances() {
  if (process.env.NODE_ENV === 'development') {
    return { data: { instances: mockInstances }, error: null };
  }
  return fetchWithErrorHandling<{ instances: Instance[] }>('/api/admin/instances');
}

export async function toggleUserStatus(userId: string, active: boolean) {
  if (process.env.NODE_ENV === 'development') {
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockUsers[userIndex].active = active;
    }
    return { data: { success: true }, error: null };
  }
  return fetchWithErrorHandling<{ success: boolean }>(`/api/admin/users/${userId}/status`, {
    method: 'PUT',
    body: { active }
  });
}

export async function deleteUser(userId: string) {
  if (process.env.NODE_ENV === 'development') {
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      mockUsers.splice(userIndex, 1);
    }
    return { data: { success: true }, error: null };
  }
  return fetchWithErrorHandling<{ success: boolean }>(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function deleteInstance(instanceId: string) {
  if (process.env.NODE_ENV === 'development') {
    const instanceIndex = mockInstances.findIndex(instance => instance.id === instanceId);
    if (instanceIndex !== -1) {
      mockInstances.splice(instanceIndex, 1);
    }
    return { data: { success: true }, error: null };
  }
  return fetchWithErrorHandling<{ success: boolean }>(`/api/admin/instances/${instanceId}`, {
    method: 'DELETE'
  });
}

export async function exportData(type: 'users' | 'instances' | 'messages') {
  if (process.env.NODE_ENV === 'development') {
    return { data: { url: '#' }, error: null };
  }
  return fetchWithErrorHandling<{ url: string }>(`/api/admin/export/${type}`, {
    method: 'POST'
  });
}
