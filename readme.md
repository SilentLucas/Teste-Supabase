# 🛡️ Sistema de Autenticação com Supabase & Vanilla JS

Um sistema de autenticação completo (Login, Cadastro e Logout) desenvolvido com **HTML5**, **CSS3** e **JavaScript Puro (Vanilla JS)** integrado ao **Supabase**, projetado com foco em **privacidade** e **segurança em nível de banco de dados (Hardened Security)**.

---

## 🚀 Funcionalidades

- **Autenticação Completa:** Cadastro de novos usuários, login com validação de credenciais e encerramento de sessão (Logout).
- **Zero Vazamento de Chaves:** As credenciais do Supabase não ficam gravadas no código-fonte nem são enviadas para o repositório. Ficam salvas localmente no `localStorage` do navegador de cada usuário.
- **Painel de Configuração Rápida:** Interface gráfica integrada para conectar e desconectar projetos Supabase a qualquer momento.
- **Auditoria & Segurança Máxima (RLS):** Banco de dados blindado contra SQL Injection, IDOR e elevação de privilégios.

---

## 🔒 Arquitetura de Segurança

O projeto segue boas práticas de segurança recomendadas pelo Supabase e PostgreSQL:

1. **Row Level Security (RLS) Forçado:** Usuários autenticados têm permissão de leitura (`SELECT`) e atualização (`UPDATE`) estritamente sobre o seu próprio perfil (`auth.uid() = id`).
2. **Prevenção de Elevação de Privilégios:** Uma trigger `BEFORE UPDATE` no PostgreSQL impede que usuários alterem seu papel (`role`) para administrador via requisições diretas na API.
3. **Bloqueio de Inserção Fraudulenta:** Usuários comuns não podem forjar registros na tabela pública. A criação do perfil ocorre automaticamente via trigger `AFTER INSERT` a partir do `auth.users`.
4. **Validação Estrita de Dados:** Verificação por expressões regulares (Regex) para garantir formatos válidos de e-mail e impedir payloads maliciosos.

---

## 📂 Estrutura de Arquivos

```text
├── index.html     # Interface do sistema e telas de autenticação
├── style.css      # Estilização moderna e responsiva
├── app.js         # Lógica de conexão, autenticação e gerenciamento de sessão
├── schema.sql     # Script SQL com as tabelas, funções, triggers e políticas RLS
└── README.md      # Documentação do projeto