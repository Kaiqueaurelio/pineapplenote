# Pineapple Note — iOS nativo

Aplicativo iOS nativo em SwiftUI, estruturado como pacote SwiftPM para desenvolvimento com [xtool](https://github.com/xtool-org/xtool).

## Funcionalidades implementadas no código
- Anotações: criar, editar, excluir e pesquisar.
- Materiais: importar PDF, áudio, vídeo, imagens e textos pelo seletor nativo; arquivos copiados para armazenamento local e abertos com Quick Look.
- Flashcards: criar, editar, excluir, revisar e contar revisões.
- Quiz e simulados: cadastrar perguntas de quatro alternativas, corrigir respostas e acompanhar pontuação.
- Armazenamento local para uso offline.\n- Backup JSON de anotações, flashcards e questões, com restauração mesclada por identificador.\n- Gravação de aulas em segundo plano, com autorização do microfone.
- Interface com abas Início, Biblioteca, Estudar e Perfil.

As funcionalidades precisam passar por compilação e testes no iPhone antes de serem consideradas validadas.

## Gravação de aulas\n\nA gravação nativa usa o microfone apenas após ação explícita do estudante e consentimento do iOS. Os áudios são salvos na biblioteca local do aplicativo. O modo de áudio em segundo plano permite continuar a gravação com a tela bloqueada, sujeito às interrupções do sistema. A mensagem de privacidade do microfone está declarada no Info.plist.\n\n## Requisitos de desenvolvimento
- Linux com Swift 6.4.
- xtool instalado e configurado.
- SDK iOS preparado a partir de um Xcode.xip obtido no portal oficial Apple Developer.
- Para instalar no iPhone: usbmuxd, libimobiledevice-utils, cabo USB e dispositivo pareado.

Guia oficial: https://xtool.sh/documentation/xtool/installation-linux/

## Compilar e executar
Na raiz deste diretório, depois de preparar o ambiente:

```bash
xtool dev
```

## Identidade e produto
- Nome: Pineapple Note
- Bundle ID: com.decodeanalytics.pineapplenote
- Interface: SwiftUI
- Plataforma mínima: iOS 17
- Modelo: gratuito, sem assinatura ou paywall obrigatório

## Próximas integrações
1. Confirmar o projeto Supabase correto e configurar Auth/sincronização.
2. Upload de arquivos, armazenamento em nuvem e transcrição.
3. Gravação e processamento de aulas.
4. Resumos, chat e geração de materiais por IA através de backend seguro.


## Estado da versão nativa para iOS

A versão SwiftUI está sendo desenvolvida isoladamente em `feature/ios-native-swiftui`; a aplicação web em `main` não é substituída por este trabalho.

### Recursos implementados localmente

- Anotações com criação, edição, exclusão, pesquisa e compartilhamento em texto.
- Biblioteca local de PDFs, documentos, imagens, áudio e vídeo, com pré-visualização suportada pelo iOS.
- Gravação de aulas em M4A, com solicitação de permissão e suporte à gravação em segundo plano.
- Flashcards com autoavaliação e repetição espaçada (10 minutos quando precisa revisar; 1, 3, 7, 14 e 30 dias conforme a sequência de acertos).\n- Jogo Card Match offline, que associa perguntas e respostas dos flashcards.\n- Leitura em voz alta de anotações em português brasileiro usando o sintetizador nativo do iOS.\n- Pesquisa de materiais por nome, tipo e extensão.
- Questões de múltipla escolha, simulados e histórico de resultados.
- Backup JSON versionado de anotações, flashcards, questões e tentativas de simulados.

### Validação automatizada

GitHub Actions executa análise de sintaxe Swift, build iOS sem assinatura e teste de abertura no simulador. O workflow do simulador também executa testes de regressão do armazenamento e backup.

### Recursos ainda pendentes

Login e sincronização Supabase, processamento/transcrição de arquivos, geração automática de resumos, chat com IA e distribuição assinada para iPhone físico. A integração Supabase aguarda acesso ao projeto original configurado no repositório; nenhum projeto diferente deve ser usado como substituto.

O aplicativo permanece sem paywall e sem assinatura obrigatória. Serviços externos de hospedagem e IA podem ter custos operacionais próprios.
