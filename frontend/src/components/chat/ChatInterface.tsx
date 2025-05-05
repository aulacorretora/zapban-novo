import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Send, Paperclip, Smile, AlertTriangle, Check } from 'lucide-react';
import { useBreakpoint } from '../../hooks/use-responsive';

type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isFromMe: boolean;
  isAutoResponse?: boolean;
};

export function ChatInterface() {
  const { instanceId, chatId } = useParams<{ instanceId: string; chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { } = useBreakpoint(); // Removed unused isMobile variable

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!instanceId || !chatId) return;

    socket.emit('join_chat', { instanceId, chatId });

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/instances/${instanceId}/chats/${chatId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'userId': localStorage.getItem('userId') === 'dev-user-id' 
                ? '00000000-0000-0000-0000-000000000000' 
                : localStorage.getItem('userId') || '',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', response.status, errorData);
          throw new Error(errorData.error || 'Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const handleNewMessage = (data: {
      instanceId: string;
      chatId: string;
      message: Message;
    }) => {
      if (data.instanceId === instanceId && data.chatId === chatId) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [instanceId, chatId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !instanceId || !chatId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/instances/${instanceId}/chats/${chatId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'userId': localStorage.getItem('userId') === 'dev-user-id' 
              ? '00000000-0000-0000-0000-000000000000' 
              : localStorage.getItem('userId') || '',
          },
          body: JSON.stringify({ content: inputMessage }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setInputMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <Card className="flex flex-col h-full border rounded-lg shadow-sm">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          {chatId?.split('@')?.[0] || 'Chat'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" type="auto">
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                new Date(message.timestamp).toDateString() !== 
                new Date(messages[index - 1].timestamp).toDateString();
              
              return (
                <Fragment key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex ${
                      message.isFromMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        message.isFromMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      } ${message.isAutoResponse ? "border border-yellow-500" : ""}`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                      <div className="text-xs mt-1 opacity-70 text-right flex justify-end items-center gap-1">
                        {formatTime(message.timestamp)}
                        {message.isAutoResponse && (
                          <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-1 rounded">Auto</span>
                        )}
                        {message.isFromMe && (
                          <Check className="ml-1 h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        <div className="p-4 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="flex-shrink-0 text-muted-foreground"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 border-muted"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="flex-shrink-0 text-muted-foreground"
            >
              <Smile className="h-5 w-5" />
            </Button>
            <Button type="submit" size="icon" className="flex-shrink-0 bg-primary hover:bg-primary/90">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
