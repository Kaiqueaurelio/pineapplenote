# Pineapple Note iOS — arquitetura

## Princípios do produto

- Aplicativo nativo em SwiftUI.
- Todas as ferramentas disponíveis sem assinatura obrigatória, paywall ou limite artificial por plano.
- Dados pessoais isolados por usuário no Supabase.
- Credenciais de provedores de IA exclusivamente no servidor.
- Experiência offline-first: anotações, flashcards e simulados continuam disponíveis sem internet.
- Sincronização em nuvem como camada adicional, sem apagar alterações locais em falhas de rede.

## Implementado no código nativo

### Biblioteca local
- Criar, editar e excluir anotações.
- Busca por título, conteúdo e matéria.
- Persistência JSON em UserDefaults, com inicialização demonstrativa somente no primeiro uso.
- A exclusão de todas as anotações não recria os exemplos automaticamente.

### Flashcards offline
- Criar, editar e excluir cartões.
- Pergunta, resposta e matéria/categoria.
- Revisão com mostrar/ocultar resposta, navegação entre cartões e contagem de revisões.
- Persistência local após fechar e reabrir o aplicativo.

### Quiz e simulados offline
- Cadastro e edição de questões com quatro alternativas.
- Seleção da alternativa correta e explicação opcional.
- Simulado com questões embaralhadas, correção por questão, pontuação e resultado final.
- Exclusão de questões e persistência local.

### Interface
- SwiftUI com abas Início, Biblioteca, Estudar e Perfil.
- Contadores de materiais locais.
- Identidade visual Pineapple inicial.

## Próximos módulos

1. **Authentication** — cadastro, login, logout e recuperação de senha Supabase.
2. **Sync** — fila de sincronização, estado pendente e resolução de conflitos.
3. **Materials** — importação e organização de PDF, áudio, vídeo e documentos.
4. **Recorder** — gravação de áudio com permissões explícitas e controles.
5. **Processing** — upload, transcrição e resultados de processamento.
6. **StudyTools** — geração de resumos, flashcards e quizzes a partir de materiais.
7. **Assistant** — chat seguro via Edge Function `study-chat`.
8. **Quality** — testes unitários, compilação automatizada e testes em dispositivo.

## Backend existente

O projeto web possui cliente Supabase configurado por variáveis de ambiente e a Edge Function `study-chat`. Ela deve ser reutilizada com sessão de usuário autenticada. A chave `GEMINI_API_KEY` permanece exclusivamente no servidor. Não inserir segredos no bundle do aplicativo nem em arquivos versionados.

## Limites desta etapa

O código foi atualizado no GitHub, mas não foi compilado nem executado em simulador ou iPhone. Persistência, navegação, criação de cartões e fluxo de quiz precisam ser validados por build e testes em dispositivo antes de declarar a versão pronta para uso.
