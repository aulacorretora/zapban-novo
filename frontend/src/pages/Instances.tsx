import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { QRCodeScanner } from '../components/whatsapp/QRCodeScanner';
import { Phone, Plus, Trash2, RefreshCw, MessageSquare, LogOut } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../components/ui/use-toast';

interface Instance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  created_at: string;
  phone_number?: string;
}

export default function Instances() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch instances');
      }

      const data = await response.json();
      setInstances(data.instances || []);
    } catch (error: any) {
      console.error('Error fetching instances:', error);
      setError(error.message || 'Failed to fetch instances');
      if (import.meta.env.DEV && (!instances || instances.length === 0)) {
        console.log('Creating mock instance for development');
        setInstances([
          {
            id: '1',
            name: 'Dev WhatsApp',
            status: 'disconnected',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    
    const statusInterval = setInterval(() => {
      if (!showQR) { // Don't poll while showing QR code
        fetchInstances();
      }
    }, 10000);
    
    return () => clearInterval(statusInterval);
  }, [showQR]);

  const handleCreateInstance = () => {
    setShowCreateDialog(true);
  };

  const handleCreateInstanceSubmit = async () => {
    if (!newInstanceName.trim()) {
      setError('Instance name is required');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
        body: JSON.stringify({ name: newInstanceName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create instance');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'WhatsApp instance created successfully',
      });
      
      setShowCreateDialog(false);
      setNewInstanceName('');
      
      setSelectedInstance(data.instance.id);
      setShowQR(true);
      
      fetchInstances();
    } catch (error: any) {
      console.error('Error creating instance:', error);
      setError(error.message || 'Failed to create instance');
    } finally {
      setCreating(false);
    }
  };

  const handleConnectInstance = (instanceId: string) => {
    setSelectedInstance(instanceId);
    setShowQR(true);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    try {
      setDeleting(instanceId);
      
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete instance');
      }
      
      toast({
        title: 'Success',
        description: 'WhatsApp instance deleted successfully',
      });
      
      setInstances(instances.filter((instance) => instance.id !== instanceId));
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete instance',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const checkInstanceStatus = async (instanceId: string) => {
    try {
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}/status`, {
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        console.error(`Error checking status for instance ${instanceId}: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      setInstances(prevInstances => 
        prevInstances.map(instance => {
          if (instance.id === instanceId) {
            return {
              ...instance,
              status: data.status,
              phone_number: data.phoneNumber
            };
          }
          return instance;
        })
      );
      
      return data.status;
    } catch (error: any) {
      console.error(`Error checking status for instance ${instanceId}:`, error);
      return null;
    }
  };
  
  const handleDisconnectInstance = async (instanceId: string) => {
    try {
      setDisconnecting(instanceId);
      
      const rawUserId = localStorage.getItem('userId') || '';
      const userId = rawUserId === 'dev-user-id' ? '00000000-0000-0000-0000-000000000000' : rawUserId;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/instances/${instanceId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userId': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to disconnect instance');
      }
      
      toast({
        title: 'Success',
        description: 'WhatsApp instance disconnected successfully',
      });
      
      setInstances(prevInstances => 
        prevInstances.map(instance => {
          if (instance.id === instanceId) {
            return {
              ...instance,
              status: 'disconnected',
              phone_number: undefined
            };
          }
          return instance;
        })
      );
    } catch (error: any) {
      console.error('Error disconnecting instance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect instance',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(null);
    }
  };

  const handleInstanceConnected = () => {
    setShowQR(false);
    fetchInstances(); // Refresh the instances list to get the updated status
    setSelectedInstance(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Instances</h2>
          <p className="text-muted-foreground">
            Connect and manage your WhatsApp instances
          </p>
        </div>
        <Button onClick={handleCreateInstance}>
          <Plus className="mr-2 h-4 w-4" />
          New Instance
        </Button>
      </div>

      {error && !loading && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showQR ? (
        <div className="mt-6">
          <QRCodeScanner
            instanceId={selectedInstance || ''}
            onConnected={handleInstanceConnected}
          />
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setShowQR(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted/50" />
                <CardContent className="h-24 bg-muted/30" />
                <CardFooter className="h-12 bg-muted/20" />
              </Card>
            ))
          ) : instances.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Phone className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No instances yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first WhatsApp instance to start messaging
              </p>
              <Button className="mt-4" onClick={handleCreateInstance}>
                <Plus className="mr-2 h-4 w-4" />
                New Instance
              </Button>
            </div>
          ) : (
            instances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{instance.name}</CardTitle>
                    <div
                      className={`h-3 w-3 rounded-full ${
                        instance.status === 'connected'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={
                          instance.status === 'connected'
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {instance.status === 'connected'
                          ? 'Connected'
                          : instance.status === 'connecting'
                          ? 'Connecting...'
                          : instance.status === 'reconnecting'
                          ? 'Reconnecting...'
                          : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>
                        {new Date(instance.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {instance.phone_number && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{instance.phone_number}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance.id)}
                    disabled={deleting === instance.id}
                  >
                    {deleting === instance.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </Button>
                  {instance.status === 'connected' ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/chat/${instance.id}/c0a80121-7ac0-4e1c-9a5b-9c3c7e2e6a7b`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chats
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnectInstance(instance.id)}
                        disabled={disconnecting === instance.id}
                      >
                        {disconnecting === instance.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnectInstance(instance.id)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create WhatsApp Instance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Instance Name</Label>
              <Input
                id="name"
                placeholder="e.g. Main WhatsApp, Support WhatsApp"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newInstanceName.trim() && !creating) {
                    e.preventDefault();
                    handleCreateInstanceSubmit();
                  }
                }}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateInstanceSubmit} 
              disabled={creating || !newInstanceName.trim()}
            >
              {creating ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Instance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
