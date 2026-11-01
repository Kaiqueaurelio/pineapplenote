# Pineapple Note iOS — arquitetura

## Princípios do produto

- Aplicativo nativo em SwiftUI.
- Todas as ferramentas disponíveis sem assinatura obrigatória, paywall ou limite artificial por plano.
- Dados pessoais isolados por usuário no Supabase.
- Credenciais de provedores de IA exclusivamente no servidor.
- Experiência offline-first: anotações locais continuam acessíveis sem internet.
- Sincronização em nuvem como camada adicional, sem apagar alterações locais em falhas de rede.

## Estado implementado nesta etapa

### Biblioteca local
- Criar, editar e excluir anotações.
- Busca por título, conteúdo e matéria.
- Persistência local codificada em JSON no UserDefaults.
- Ordenação por última atualização.
- Acesso às anotações pela tela inicial e biblioteca.

### Interface
- SwiftUI com abas Início, Biblioteca, Estudar e Perfil.
- Cartões de ferramentas para resumo, flashcards, quiz e chat.
- Identidade visual Pineapple inicial.

## Próximos módulos

1. **Core/Models** — modelos compartilhados e migração de dados.
2. **Core/Persistence** — repositório local com versionamento e testes.
3. **Core/Networking** — cliente Supabase, sessão e tratamento de erros.
4. **Features/Authentication** — login, cadastro e recuperação de conta.
5. **Features/Materials** — importação de PDF, áudio, vídeo e documentos.
6. **Features/Recorder** — gravação de áudio com permissões explícitas.
7. **Features/Processing** — estado de processamento, transcrição e resultados.
8. **Features/StudyTools** — resumos, flashcards, quizzes, jogos e slides.
9. **Features/Assistant** — chat seguro via Edge Function study-chat.
10. **Sync** — fila de sincronização e resolução de conflitos.

## Contratos existentes no backend web

O projeto web já contém a Edge Function `study-chat`, que valida o usuário autenticado e consulta materiais pertencentes ao próprio usuário antes de chamar o Gemini. O app iOS deverá reutilizar esse contrato autenticado, sem incluir GEMINI_API_KEY no cliente.

## Importante

O código desta etapa foi gravado no GitHub, mas ainda não foi compilado nem executado em simulador ou iPhone. A compilação e os testes de dispositivo precisam ser feitos em ambiente com Swift 6.4, SDK iOS preparado pelo xtool e dispositivo pareado.
