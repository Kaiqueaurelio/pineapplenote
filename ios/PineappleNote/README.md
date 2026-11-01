# Pineapple Note — iOS nativo

Aplicativo iOS nativo em SwiftUI, compilado como pacote SwiftPM com [xtool](https://github.com/xtool-org/xtool).

## Estado atual

A primeira fundação visual está criada. As telas ainda usam dados demonstrativos; autenticação, sincronização Supabase, gravação, importação e IA serão conectadas nas próximas etapas.

## Requisitos de desenvolvimento

- Linux com Swift 6.4.
- xtool instalado e configurado.
- SDK iOS extraído de um Xcode.xip obtido no portal oficial Apple Developer.
- Para instalar no iPhone: usbmuxd, libimobiledevice-utils, cabo USB e dispositivo pareado.

Consulte o guia oficial: https://xtool.sh/documentation/xtool/installation-linux/

## Compilar e executar

Na raiz deste diretório:

```bash
xtool dev
```

O xtool compila, assina e instala no dispositivo conectado, após a configuração inicial e o pareamento.

## Identidade

- Nome: Pineapple Note
- Bundle ID: com.decodeanalytics.pineapplenote
- Interface: SwiftUI
- Plataforma mínima: iOS 17
- Modelo de produto: gratuito, sem assinatura ou paywall obrigatório

## Próximas integrações

1. Supabase Auth e sessão segura.
2. Biblioteca sincronizada com os materiais do usuário.
3. Upload de arquivos e gravação de áudio.
4. Processamento/transcrição via serviços de backend.
5. Resumos, chat de estudo e ferramentas de aprendizagem.
