import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from '../ui/use-toast';

type AuthFormProps = {
  type: 'login' | 'register' | 'reset-password';
  onSuccess?: () => void;
};

export function AuthForm({ type, onSuccess }: AuthFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, insira seu email para redefinir a senha');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Email enviado",
        description: "Verifique seu email para redefinir sua senha",
        variant: "default"
      });
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar email de redefinição de senha');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (type === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
            emailRedirectTo: `${window.location.origin}/auth/login`,
          },
        });

        if (error) throw error;
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              email,
              name,
            },
          ]);

        if (profileError) throw profileError;
        
        toast({
          title: "Conta criada com sucesso",
          description: "Verifique seu email para confirmar sua conta",
          variant: "default"
        });
        
        navigate('/auth/login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciais inválidas. Verifique seu email e senha.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Email não confirmado. Verifique sua caixa de entrada.');
          } else if (error.message.includes('User not found')) {
            throw new Error('Usuário não encontrado.');
          } else {
            throw error;
          }
        }
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {type === 'login' ? 'Login' : 
           type === 'register' ? 'Cadastro' : 
           'Recuperar Senha'}
        </CardTitle>
        <CardDescription>
          {type === 'login'
            ? 'Digite suas credenciais para acessar sua conta'
            : type === 'register'
            ? 'Crie uma nova conta para começar'
            : 'Digite seu email para receber instruções de recuperação de senha'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {type === 'reset-password' ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {resetSent && (
              <Alert>
                <AlertDescription>
                  Email de recuperação enviado. Verifique sua caixa de entrada.
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Email de Recuperação'}
            </Button>
            <div className="text-center mt-4">
              <Button 
                variant="link" 
                className="p-0" 
                onClick={() => navigate('/auth/login')}
              >
                Voltar para o Login
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              {type === 'login' && (
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="px-0 font-normal text-xs" 
                    onClick={() => navigate('/auth/reset-password')}
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Carregando...'
                : type === 'login'
                ? 'Entrar'
                : 'Criar Conta'}
            </Button>
            
            {type === 'login' && import.meta.env.DEV && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => {
                  console.log('Using development login bypass');
                  localStorage.setItem('userEmail', 'dev@example.com');
                  localStorage.setItem('userName', 'Development User');
                  localStorage.setItem('userId', 'dev-user-id');
                  navigate('/dashboard');
                }}
              >
                Dev Login (Bypass Auth)
              </Button>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {type === 'login' ? (
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/auth/register')}>
              Cadastre-se
            </Button>
          </p>
        ) : type === 'register' ? (
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/auth/login')}>
              Entrar
            </Button>
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
