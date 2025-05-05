import { toast } from '../components/ui/use-toast';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  showToast?: boolean;
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchWithErrorHandling<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const {
    method = 'GET',
    headers = {},
    body,
    showToast = true
  } = options;

  const userId = localStorage.getItem('userId') === 'dev-user-id'
    ? '00000000-0000-0000-0000-000000000000'
    : localStorage.getItem('userId') || '';

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'userId': userId,
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Erro ${response.status}: ${response.statusText}`;
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: errorMessage,
        });
      }
      
      return { data: null, error: errorMessage };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error: any) {
    const errorMessage = error.message || 'Erro ao conectar com o servidor';
    
    if (showToast) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: errorMessage,
      });
    }
    
    console.error('API request error:', error);
    return { data: null, error: errorMessage };
  }
}

export function handleFetchError(error: Error): string {
  if (error.message === 'Failed to fetch') {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão de internet ou se o servidor está online.';
  }
  return error.message || 'Erro desconhecido ao conectar com o servidor';
}

export async function checkServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Server status check failed:', error);
    return false;
  }
}
