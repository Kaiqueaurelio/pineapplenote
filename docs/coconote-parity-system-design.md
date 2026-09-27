# Pineapple Note — Coconote Parity System Design

> Fonte funcional: análise pública do Coconote em 27/09/2026.
> Este documento define a referência de produto para incorporar os padrões funcionais observados ao Pineapple Note sem substituir a identidade visual própria do Pineapple Note.

## 1. Objetivo

O Pineapple Note deve reunir em um único fluxo:

1. Capturar conteúdo.
2. Transcrever quando houver áudio/vídeo.
3. Organizar o conteúdo em notas estruturadas.
4. Gerar materiais de estudo.
5. Permitir conversar com o material.
6. Permitir revisão ativa.
7. Traduzir.
8. Compartilhar/exportar.
9. Sincronizar o estudo entre dispositivos.
10. Manter tudo associado à conta do usuário.

## 2. Funcionalidades de referência

### Captura

- Gravar áudio diretamente no navegador.
- Upload de áudio.
- Upload de vídeo.
- Upload de PDF/documentos.
- Importar links.
- Importar vídeos.
- Importar páginas/websites.
- Informar o assunto/tópico da gravação para orientar a IA.
- Detecção automática de idioma.
- Seleção manual do idioma.
- Processamento assíncrono com estados: enviado, processando, pronto e falhou.

### Resultado da IA

Cada material deve produzir:

- título;
- resumo;
- capítulos/seções;
- subtítulos;
- principais ideias/takeaways;
- tópicos;
- transcript;
- flashcards;
- quiz;
- prova/practice exam;
- tradução;
- conversa com IA;
- jogos de estudo;
- podcast gerado por IA;
- vídeo/material complementar quando a função estiver disponível;
- feedback/reportar problema.

### Transcrição

- Visualizar transcript.
- Editar transcript.
- Copiar transcript.
- Baixar transcript.
- Associar transcript ao material original.
- Preservar idioma de origem.
- Preparar estrutura para timestamps e diarização.

### Notas

- Cabeçalho com título, origem, data e duração quando disponível.
- Conteúdo organizado por capítulos.
- Hierarquia visual de título > seção > subtítulo > takeaway.
- Edição manual.
- Feedback sobre qualidade.
- Ações rápidas no topo:
  - Quiz
  - Flashcards
  - Editar nota
  - Traduzir
  - Compartilhar
  - Mais opções
  - AI Chat
  - Podcast
  - Jogos

### AI Chat

- Chat contextual por material.
- A IA deve responder usando prioritariamente o conteúdo do material.
- Perguntas sugeridas:
  - "Quais são os pontos principais?"
  - "Explique este conceito de forma simples."
  - "O que pode cair na prova?"
  - "Crie exemplos."
  - "Compare os conceitos."
- Histórico por material.
- Streaming de resposta.
- Estado de carregamento.
- Tratamento de erro.
- Limpeza do histórico.

### Flashcards

- Geração automática.
- Frente/pergunta.
- Verso/resposta.
- Navegação.
- Marcar acerto/erro.
- Repetição.
- Progresso.
- Preparar base para revisão espaçada.

### Quizzes

- Múltipla escolha.
- Feedback imediato.
- Indicação de resposta correta.
- Explicação.
- Progresso.
- Resultado final.
- Reportar questão problemática.
- Reiniciar tentativa.

### Practice Exam

- Gerar uma prova completa a partir do material.
- Quantidade configurável de questões.
- Modo simulado.
- Resultado final.
- Percentual de acerto.
- Explicações.
- Revisão das questões erradas.

### Tradução

- Traduzir a nota.
- Traduzir transcript.
- Selecionar idioma de destino.
- Preservar estrutura de capítulos.
- Permitir voltar ao idioma original.
- Preparar suporte para 100+ idiomas.

### Study Games

Criar uma área de jogos baseada no conteúdo:

- Card Match.
- Study Run.
- Perguntas rápidas.
- Pontuação.
- Acertos/erros.
- Sessões curtas.
- Reiniciar partida.
- Resultado da sessão.

### AI Podcast

- Gerar um podcast a partir da nota.
- Usar a nota como fonte.
- Gerar roteiro.
- Gerar áudio.
- Player integrado.
- Play/pause.
- Barra de progresso.
- Download quando permitido.
- Estado: preparando > gerando > pronto > erro.

### Compartilhamento

- Link compartilhável.
- Página pública de material compartilhado.
- Copiar texto.
- Web Share API quando disponível.
- Controle de privacidade.
- Revogar link.
- Nunca expor materiais privados por padrão.

### Biblioteca

- Ordenação por mais recente.
- Busca.
- Filtros por tipo.
- Estado de processamento.
- Abrir material.
- Remover material.
- Futuramente: pastas/organização avançada.

### Sincronização

- Conta única.
- Materiais persistidos no servidor.
- Progresso persistido.
- Estado dos outputs persistido.
- Atualização em tempo real quando apropriado.
- Continuidade entre mobile, tablet e desktop.

## 3. Arquitetura de telas

### Mobile

Navegação inferior:

- Início
- Biblioteca
- Criar
- Estudar
- Perfil

Ação primária flutuante ou central:

- Nova nota

### Desktop

Sidebar:

- Início
- Biblioteca
- Estudar
- Jogos
- Configurações

Área principal:

- Busca global.
- CTA de criação.
- Materiais recentes.
- Progresso.
- Atalhos de estudo.

### Workspace do material

Ordem recomendada:

1. Voltar.
2. Título.
3. Origem/media player.
4. Ações rápidas.
5. Nota organizada.
6. Takeaways.
7. Transcript.
8. AI Chat.
9. Flashcards.
10. Quiz.
11. Practice Exam.
12. Tradução.
13. Jogos.
14. Podcast.
15. Compartilhar.

## 4. Design language de referência

O Coconote público atual usa uma experiência de alto contraste, com superfícies escuras em telas de estudo, tipografia branca forte, acentos roxos vibrantes, cards arredondados e ações compactas. As telas de estudo priorizam conteúdo e colocam as ferramentas em uma grade de ações rápidas.

Para o Pineapple Note:

- preservar a identidade Pineapple Note;
- usar roxo/violeta como acento de interação;
- manter superfícies claras no dashboard quando isso combinar com a identidade atual;
- permitir workspace de estudo escuro;
- usar cards arredondados;
- bordas discretas;
- sombras suaves;
- estados de processamento claramente visíveis;
- ícones Lucide;
- botões com área de toque mínima confortável;
- foco em leitura no celular.

## 5. Tokens sugeridos

### Cor

- brand-primary: violeta/roxo do Pineapple Note.
- brand-secondary: amarelo do abacaxi.
- success: verde.
- danger: vermelho.
- surface: branco.
- surface-dark: carvão.
- surface-muted: cinza suave.
- text: quase preto.
- text-inverse: branco.
- border: cinza de baixo contraste.

### Forma

- cards: 14–20px.
- botões: 10–14px.
- inputs: 10–14px.
- badges: totalmente arredondados.
- player: 16–24px.

### Espaçamento

Escala base de 4px:

4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.

### Tipografia

- display: 32–44px.
- h1 mobile: 28–32px.
- h2: 20–24px.
- body: 15–16px.
- metadata: 12–13px.
- buttons: 14–15px, semibold.

## 6. Estado do Pineapple Note atual

Já existente:

- autenticação;
- confirmação de e-mail;
- recuperação de senha;
- troca de senha com reautenticação;
- rota autenticada;
- perfil;
- papel admin;
- PWA;
- biblioteca;
- upload de áudio/vídeo/documento;
- gravação de áudio;
- Storage privado;
- processamento IA;
- transcrição;
- resumo;
- tópicos;
- flashcards;
- quiz;
- progresso;
- workspace de material;
- preview do arquivo original;
- copiar/baixar transcript;
- responsividade mobile/tablet/desktop.

## 7. Lacunas prioritárias

Implementar no Pineapple Note:

1. AI Chat por material.
2. Importação por YouTube/link.
3. Importação de websites.
4. Edição da nota.
5. Edição do transcript.
6. Tradução.
7. Practice Exam.
8. Study Games.
9. AI Podcast.
10. Compartilhamento público seguro.
11. Feedback/reportar problema.
12. Detecção/seleção de idioma.
13. Histórico de chat.
14. Player e assets gerados.
15. Atualização de processamento em tempo real.
16. Organização avançada da biblioteca.
17. Métricas de estudo e revisão.
18. Base para revisão espaçada.

## 8. Banco de dados alvo

Além de `study_materials`, `material_outputs` e `study_progress`, preparar:

- material_notes
- material_chat_messages
- material_translations
- material_exams
- material_exam_attempts
- material_games
- material_game_attempts
- material_podcasts
- material_shares
- material_feedback
- material_review_cards

Todas as tabelas devem ter RLS por usuário, com políticas SELECT/INSERT/UPDATE/DELETE coerentes com `auth.uid()`.

## 9. Regra de produto

O Pineapple Note não deve virar uma cópia visual do Coconote.

A referência é funcional e de experiência:

Coconote -> padrões de fluxo e capacidades observadas.
Pineapple Note -> identidade, logo, nome, cores e componentes próprios.

## 10. Definition of Done

A paridade de produto será considerada concluída quando o usuário puder:

1. criar uma nota por gravação;
2. enviar áudio;
3. enviar vídeo;
4. enviar documento;
5. importar link;
6. receber transcript;
7. receber nota estruturada;
8. editar nota/transcript;
9. conversar com a nota;
10. gerar flashcards;
11. responder quiz;
12. fazer practice exam;
13. traduzir;
14. jogar uma atividade de estudo;
15. gerar/ouvir podcast;
16. compartilhar;
17. acompanhar progresso;
18. continuar o estudo em outro dispositivo.

## Fontes de referência

- Coconote homepage: https://coconote.app/
- Coconote guide/note: https://coconote.app/notes/429d6153-ae06-44d7-894e-81aa78a7bba7
- Coconote arcade: https://coconote.app/arcade
