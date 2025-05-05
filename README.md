# ZapBan - Sistema de Gerenciamento de WhatsApp

Sistema completo para gerenciamento de múltiplas instâncias de WhatsApp com recursos avançados.

## Funcionalidades

- Conexão com WhatsApp via QR Code
- Gerenciamento de múltiplas instâncias
- Chat responsivo
- Painel administrativo
- Suporte a múltiplos idiomas (Português e Inglês)
- Integração com Hotmart via webhook

## Estrutura do Projeto

- `backend/`: API Node.js com Express
- `frontend/`: Interface React com Vite e Tailwind CSS

## Instalação

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Melhorias Implementadas

### 🔄 QR Code e Reconexão
- Corrigido o problema de geração contínua do QR Code
- Implementado controle de expiração e retry com intervalo
- Adicionado tratamento de erros e mensagens claras para o usuário
- Melhorada a reconexão automática

### 📱 Responsividade
- Interface totalmente responsiva para desktop, tablet e celular
- Layout fluido e adaptativo para diferentes tamanhos de tela
- Melhorias no design do chat para todos os dispositivos

### 💬 Chat
- Corrigido problema de redirecionamento para o dashboard
- Melhorada a interface do chat com design moderno
- Implementado espaçamento adequado entre mensagens
- Adicionadas datas e bolhas organizadas

### 👑 Painel Administrativo
- Implementado painel completo para o administrador
- Funcionalidades para gerenciar usuários e instâncias
- Opções para ativar/desativar usuários
- Visualização de estatísticas

### 🌐 Internacionalização
- Suporte completo para Português (pt-BR) e Inglês (en-US)
- Opção para alternar idiomas no painel
- Preferência de idioma salva no localStorage
- Detecção automática do idioma do navegador

### 🔄 Webhook
- Endpoint para receber webhooks da Hotmart
- Criação automática de usuários
- Ativação/desativação baseada no status da compra
- Registro de eventos de webhook
