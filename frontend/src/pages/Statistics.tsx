import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Users, Clock } from 'lucide-react';

interface DailyStats {
  date: string;
  messages: number;
  contacts: number;
}

interface Stats {
  totalMessages: number;
  totalContacts: number;
  avgResponseTime: number;
  dailyStats: DailyStats[];
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    totalContacts: 0,
    avgResponseTime: 0,
    dailyStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          const mockDailyStats = Array.from({ length: timeframe === 'week' ? 7 : 30 }).map(
            (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                messages: Math.floor(Math.random() * 50) + 10,
                contacts: Math.floor(Math.random() * 10) + 2,
              };
            }
          ).reverse();

          setStats({
            totalMessages: 1250,
            totalContacts: 120,
            avgResponseTime: 5.2,
            dailyStats: mockDailyStats,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
        <p className="text-muted-foreground">
          Analytics and insights for your WhatsApp activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Messages sent and received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Unique contacts in your database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${stats.avgResponseTime} min`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to respond to messages
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Message Activity</CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeframe === 'week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeframe === 'month'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={stats.dailyStats}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#8884d8" name="Messages" />
                <Bar dataKey="contacts" fill="#82ca9d" name="Contacts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Busiest Hours</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { hour: '8 AM', messages: 12 },
                    { hour: '10 AM', messages: 25 },
                    { hour: '12 PM', messages: 35 },
                    { hour: '2 PM', messages: 30 },
                    { hour: '4 PM', messages: 40 },
                    { hour: '6 PM', messages: 20 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#8884d8" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { day: 'Mon', messages: 45 },
                    { day: 'Tue', messages: 55 },
                    { day: 'Wed', messages: 65 },
                    { day: 'Thu', messages: 60 },
                    { day: 'Fri', messages: 70 },
                    { day: 'Sat', messages: 40 },
                    { day: 'Sun', messages: 30 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#82ca9d" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
