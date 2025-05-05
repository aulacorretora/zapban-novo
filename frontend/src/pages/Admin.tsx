import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Download, Trash2, Search, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  getUsers, 
  getInstances, 
  toggleUserStatus, 
  deleteUser, 
  deleteInstance, 
  exportData,
  User,
  Instance
} from '../services/adminService';


export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !localStorage.getItem('userRole')) {
      localStorage.setItem('userRole', 'admin');
    }
    
    if (!loading && user && user.user_metadata?.role !== 'admin') {
      toast({
        variant: "destructive",
        title: t('errors.unauthorized'),
        description: t('admin.accessDenied'),
      });
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const usersResponse = await getUsers();
        if (usersResponse.error) {
          toast({
            variant: "destructive",
            title: t('errors.error'),
            description: t('admin.userLoadError'),
          });
        } else if (usersResponse.data) {
          setUsers(usersResponse.data.users);
        }
        
        const instancesResponse = await getInstances();
        if (instancesResponse.error) {
          toast({
            variant: "destructive",
            title: t('errors.error'),
            description: t('admin.instanceLoadError'),
          });
        } else if (instancesResponse.data) {
          setInstances(instancesResponse.data.instances);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: t('errors.error'),
          description: t('admin.dataLoadError'),
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleToggleUserStatus = async (userId: string) => {
    const userToUpdate = users.find((u: User) => u.id === userId);
    if (!userToUpdate) return;
    
    setLoading(true);
    const response = await toggleUserStatus(userId, !userToUpdate.active);
    
    if (response.error) {
      toast({
        variant: "destructive",
        title: t('errors.error'),
        description: t('admin.statusChangeError'),
      });
    } else {
      setUsers(
        users.map((u: User) =>
          u.id === userId ? { ...u, active: !u.active } : u
        )
      );
      
      toast({
        title: t('common.success'),
        description: t(userToUpdate.active ? 'admin.userDeactivated' : 'admin.userActivated'),
      });
    }
    
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('admin.confirmDeleteUser'))) {
      return;
    }
    
    setLoading(true);
    const response = await deleteUser(userId);
    
    if (response.error) {
      toast({
        variant: "destructive",
        title: t('errors.error'),
        description: t('admin.userDeleteError'),
      });
    } else {
      setUsers(users.filter((user: User) => user.id !== userId));
      setInstances(instances.filter((instance: Instance) => instance.userId !== userId));
      
      toast({
        title: t('common.success'),
        description: t('admin.userDeleteSuccess'),
      });
    }
    
    setLoading(false);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm(t('admin.confirmDeleteInstance'))) {
      return;
    }
    
    setLoading(true);
    const response = await deleteInstance(instanceId);
    
    if (response.error) {
      toast({
        variant: "destructive",
        title: t('errors.error'),
        description: t('admin.instanceDeleteError'),
      });
    } else {
      setInstances(instances.filter((instance: Instance) => instance.id !== instanceId));
      
      toast({
        title: t('common.success'),
        description: t('admin.instanceDeleteSuccess'),
      });
    }
    
    setLoading(false);
  };

  const handleViewChat = (instanceId: string) => {
    navigate(`/admin/chat/${instanceId}`);
  };

  const handleExportData = async (type: 'users' | 'instances' | 'messages') => {
    setLoading(true);
    const response = await exportData(type);
    
    if (response.error) {
      toast({
        variant: "destructive",
        title: t('errors.error'),
        description: t('admin.exportError'),
      });
    } else if (response.data?.url) {
      window.open(response.data.url, '_blank');
      
      toast({
        title: t('common.success'),
        description: t('admin.exportSuccess'),
      });
    }
    
    setLoading(false);
  };

  const filteredUsers = users.filter(
    (user: User) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInstances = instances.filter(
    (instance: Instance) =>
      instance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instance.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h2>
        <p className="text-muted-foreground">
          {t('admin.description')}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('admin.search')}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => handleExportData('users')}>
          <Download className="mr-2 h-4 w-4" />
          {t('admin.exportUsers')}
        </Button>
        <Button onClick={() => handleExportData('instances')}>
          <Download className="mr-2 h-4 w-4" />
          {t('admin.exportInstances')}
        </Button>
        <Button onClick={() => handleExportData('messages')}>
          <Download className="mr-2 h-4 w-4" />
          {t('admin.exportMessages')}
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
          <TabsTrigger value="instances">{t('admin.instances')}</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users')}</CardTitle>
              <CardDescription>
                {t('admin.manageUsers')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.userName')}</TableHead>
                      <TableHead>{t('admin.userEmail')}</TableHead>
                      <TableHead>{t('admin.userRole')}</TableHead>
                      <TableHead>{t('admin.userStatus')}</TableHead>
                      <TableHead>{t('admin.userInstances')}</TableHead>
                      <TableHead>{t('admin.userCreatedAt')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          {t('admin.noUsersFound')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === 'admin' ? 'default' : 'outline'}
                            >
                              {user.role === 'admin' ? t('admin.admin') : t('admin.user')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={user.active}
                                onCheckedChange={() => handleToggleUserStatus(user.id)}
                              />
                              <span
                                className={
                                  user.active ? 'text-green-500' : 'text-red-500'
                                }
                              >
                                {user.active ? t('admin.active') : t('admin.inactive')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{user.instances}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.instances')}</CardTitle>
              <CardDescription>
                {t('admin.instanceManagement')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.instanceName')}</TableHead>
                      <TableHead>{t('admin.instanceUser')}</TableHead>
                      <TableHead>{t('admin.instanceStatus')}</TableHead>
                      <TableHead>{t('admin.instanceMessages')}</TableHead>
                      <TableHead>{t('admin.instanceCreatedAt')}</TableHead>
                      <TableHead>{t('admin.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          {t('admin.noInstancesFound')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInstances.map((instance) => (
                        <TableRow key={instance.id}>
                          <TableCell className="font-medium">{instance.name}</TableCell>
                          <TableCell>{instance.userName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                instance.status === 'connected'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {instance.status === 'connected'
                                ? t('instances.connected')
                                : t('instances.disconnected')}
                            </Badge>
                          </TableCell>
                          <TableCell>{instance.messagesCount}</TableCell>
                          <TableCell>
                            {new Date(instance.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewChat(instance.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInstance(instance.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
