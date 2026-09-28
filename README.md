# Isabelly & Cassiano · Lista de Presentes

Site de lista de presentes com pagamento via PIX e painel para os noivos.

- **Frontend:** Vite + React
- **API:** Hono (em `server/app.ts`), servida como Vercel Function em `api/index.ts`
- **Dados:** Firebase Firestore (via `firebase-admin`, somente no servidor)
- **Imagens:** Vercel Blob (opcional) ou URL externa

## Rodando localmente

```bash
pnpm install
cp .env.example .env   # opcional no início
pnpm dev
```

- Site: http://localhost:5173
- Painel: http://localhost:5173/admin (senha padrão em dev: `admin`)

Sem as variáveis do Firebase, a API usa um armazenamento em memória com presentes de exemplo.

## Fluxo

1. Os noivos cadastram presentes no `/admin`.
2. O convidado escolhe um presente, vê o QR Code do PIX e paga pelo app do banco.
3. Ele clica em **Já fiz o PIX**, informa o nome e uma mensagem → o presente fica **reservado**.
4. No painel, os noivos conferem o extrato e clicam em **Recebi o PIX** (presente vira **comprado**) ou **Não recebi** (volta a ficar disponível).

O status de cada presente também pode ser alterado manualmente no painel.

## QR Code do PIX

A imagem fica em `public/pix-qr.png` (hoje, um placeholder). Quando tiver o QR definitivo, substitua o arquivo e defina `isPlaceholder: false` em `src/config.ts`. Se quiser, preencha também `copyPaste` (código copia e cola) ou `key` (chave PIX).

## Configurando o Firebase

1. Crie um projeto em https://console.firebase.google.com (plano gratuito Spark serve).
2. Em **Build > Firestore Database**, crie o banco (modo produção). As regras podem bloquear tudo, pois só o servidor acessa:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```
3. Em **Configurações do projeto > Contas de serviço**, clique em **Gerar nova chave privada** e copie `project_id`, `client_email` e `private_key` para as variáveis `FIREBASE_*`.

## Imagens

Usamos **Vercel Blob**, que tem cota gratuita no plano Hobby e fica no mesmo lugar do deploy. As fotos são redimensionadas e convertidas para WebP no navegador antes do envio (~100–200 KB cada), então a cota rende bastante.

Para ativar: no projeto da Vercel, **Storage > Create > Blob** e conecte ao projeto — a variável `BLOB_READ_WRITE_TOKEN` é criada automaticamente (para dev local, rode `vercel env pull .env`).

Sem o token, o painel aceita apenas URL de imagem (ex.: foto do produto na loja).

Para trocar de provedor (UploadThing, Cloudinary…), basta reimplementar `server/images.ts`.

## Deploy na Vercel

1. Importe o repositório na Vercel (o `vercel.json` já configura Vite + pnpm).
2. Defina as variáveis de ambiente: `ADMIN_PASSWORD`, `SESSION_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (e o Blob, se usar).
3. Deploy.
