import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChatInterface } from '../components/chat/ChatInterface';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
// import { toast } from '../components/ui/use-toast';
// import { fetchWithErrorHandling } from '../lib/api';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Chat() {
  const { instanceId, chatId } = useParams<{ instanceId: string; chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }

    if (!instanceId && !authLoading) {
      return;
    }
  }, [user, authLoading, navigate, location, instanceId]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!instanceId || authLoading) return;
      
      try {
        setLoading(true);
        // setError(null);
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}/contacts`,
          {
            headers: {
              'Content-Type': 'application/json',
              'userId': localStorage.getItem('userId') || '',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', response.status, errorData);
          throw new Error(errorData.error || 'Failed to fetch contacts');
        }

        const data = await response.json();
        setContacts(data.contacts || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // setError('Erro ao carregar contatos. Por favor, tente novamente.');
        setLoading(false);
      }
    };

    fetchContacts();
  }, [instanceId, authLoading]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!instanceId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Nenhuma instância selecionada</h2>
          <p className="mt-2 text-muted-foreground">
            Por favor, selecione uma instância do WhatsApp para visualizar os chats
          </p>
          <Button className="mt-4" onClick={() => navigate('/instances')}>
            Ir para Instâncias
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-80 flex-shrink-0 border-r">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/instances')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-bold ml-2">Chats</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No contacts found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-4 hover:bg-muted/50 cursor-pointer ${
                      chatId === contact.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => navigate(`/chat/${instanceId}/${contact.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(contact.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.lastMessage}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1">
        {chatId ? (
          <ChatInterface />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Select a Chat</h2>
              <p className="mt-2 text-muted-foreground">
                Choose a contact from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
