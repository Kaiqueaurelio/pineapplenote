# Pineapple Note: AI Study Assistant

Criar o novo aplicativo Pineapple Note utilizando o logo e as diretrizes de identidade visual anexadas:

Plataforma de estudo com IA que transforma aulas, áudios, vídeos e documentos em materiais de estudo organizados.
Nome oficial: Pineapple Note (nome curto: Pineapple).
Slogan principal: "Sua aula. Organizada pela IA."
Utilize o logo da imagem anexada em destaque no cabeçalho, favicon e interface.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pineapplenote.vercel.app

## Build with Lovable

Continue desenvolvendo este projeto no [Lovable editor](https://lovable.dev/projects/ec59cb23-61a3-425c-9d11-f604ee058f6f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Configuração do chat com IA

O chat de cada material é executado no servidor pela Edge Function `study-chat`.
Isso mantém a chave do provedor de IA fora do navegador e preserva o isolamento entre estudantes.

Para concluir a publicação no Supabase:

1. Aplique `drizzle/migrations/0006_material_chat_messages.sql` no projeto correto.
2. Publique `supabase/functions/study-chat/index.ts` com verificação de JWT ativa.
3. Em **Edge Functions → Secrets**, crie `GEMINI_API_KEY` com uma chave Gemini nova e ativa. Opcionalmente, defina `GEMINI_MODEL` (o padrão é `gemini-2.5-flash`).
4. Confirme que a tabela `material_chat_messages` está com RLS ativado e que a função responde apenas a usuários autenticados.

Para desenvolvimento local, copie `supabase/functions/.env.example` para
`supabase/functions/.env` e preencha a chave apenas na sua máquina. Esse arquivo é ignorado pelo Git.

