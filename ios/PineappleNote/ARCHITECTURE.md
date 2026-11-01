# Pineapple Note iOS — arquitetura

## Princípios do produto
- Aplicativo nativo em SwiftUI.
- Todas as ferramentas disponíveis sem assinatura obrigatória, paywall ou limite artificial por plano.
- Dados pessoais isolados por usuário no Supabase.
- Credenciais de provedores de IA exclusivamente no servidor.
- Experiência offline-first: anotações, arquivos importados, flashcards e simulados continuam disponíveis sem internet.
- Sincronização em nuvem como camada adicional, sem apagar alterações locais em falhas de rede.

## Implementado no código nativo

### Anotações
- Criar, editar, excluir e pesquisar por título, conteúdo e matéria.
- Persistência JSON em UserDefaults.
- Migração dos dados salvos na chave anterior `pineapple.local-notes.v1`.
- Os exemplos são inicializados somente no primeiro uso; apagar todas as anotações não os recria.

### Gravação de áudio local\n- Gravação AAC em contêiner M4A com AVAudioRecorder.\n- Solicitação explícita da permissão de microfone do iOS.\n- Áudio salvo na pasta privada StudyMaterials e registrado na biblioteca local.\n- Nenhum áudio é enviado automaticamente para a nuvem.\n\n### Materiais e arquivos locais
- Importação pelo seletor nativo de arquivos do iOS.
- Tipos aceitos: PDF, áudio, vídeo, imagem e texto.
- Cópia para o diretório privado do aplicativo, com metadados persistidos.
- Pré-visualização com Quick Look e exclusão de arquivos importados.
- Abertura e importação são locais; upload, transcrição e IA ainda não estão ligados.

### Flashcards offline
- Criar, editar e excluir cartões.
- Pergunta, resposta e matéria/categoria.
- Revisão com mostrar/ocultar resposta, navegação e contagem de revisões.

### Quiz e simulados offline
- Questões com quatro alternativas, resposta correta e explicação opcional.
- Simulado embaralhado, correção por questão, pontuação e resultado final.
- Edição e exclusão de questões.

### Interface
- SwiftUI com abas Início, Biblioteca, Estudar e Perfil.
- Contadores de materiais locais e identidade visual inicial.

## Próximos módulos
1. **Authentication** — cadastro, login, logout e recuperação de senha Supabase.
2. **Sync** — fila de sincronização, estado pendente e resolução de conflitos.
3. **Recorder** — gravação de áudio com permissões explícitas e controles.
4. **Processing** — upload, transcrição e geração de resultados.
5. **StudyTools** — geração de resumos, flashcards e quizzes a partir de materiais.
6. **Assistant** — chat seguro via Edge Function `study-chat`.
7. **Quality** — testes unitários, compilação automatizada e testes em dispositivo.

## Backend
O repositório web configura o cliente Supabase por variáveis de ambiente e possui Edge Functions para processamento de materiais, ferramentas de IA e chat. Antes de conectar o app nativo, é necessário confirmar qual projeto Supabase pertence a este produto. Não utilizar credenciais nem banco de outro aplicativo. A chave `GEMINI_API_KEY` permanece exclusivamente no servidor.

## Limites desta etapa
O código foi atualizado no GitHub, mas não foi compilado nem executado em simulador ou iPhone. Persistência, permissões do seletor de arquivos, pré-visualização, navegação e fluxos de estudo precisam passar por build e testes em dispositivo antes de declarar a versão pronta para uso.
