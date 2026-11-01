# Pineapple Note — iOS nativo

Aplicativo iOS nativo em SwiftUI, estruturado como pacote SwiftPM para desenvolvimento com [xtool](https://github.com/xtool-org/xtool).

## Funcionalidades implementadas no código
- Anotações: criar, editar, excluir e pesquisar.
- Materiais: importar PDF, áudio, vídeo, imagens e textos pelo seletor nativo; arquivos copiados para armazenamento local e abertos com Quick Look.
- Flashcards: criar, editar, excluir, revisar e contar revisões.
- Quiz e simulados: cadastrar perguntas de quatro alternativas, corrigir respostas e acompanhar pontuação.
- Armazenamento local para uso offline.
- Interface com abas Início, Biblioteca, Estudar e Perfil.

As funcionalidades precisam passar por compilação e testes no iPhone antes de serem consideradas validadas.

## Requisitos de desenvolvimento
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
