# Garoto Marte E-commerce

Este é um projeto de e-commerce para a marca Garoto Marte, desenvolvido com Next.js, TypeScript, Tailwind CSS, e shadcn/ui.

## Tecnologias

- **Frontend**: Next.js + TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Auth
- **Armazenamento de Imagens**: Cloudinary
- **Pagamentos**: Mercado Pagamentos
- **Hospedagem**: Vercel

## Requisitos

- Node.js (versão recomendada: 18.x ou superior)
- NPM ou Yarn
- Conta Firebase
- Conta Cloudinary
- Conta Mercado Pago (para processamento de pagamentos)

## Configuração

1. Clone o repositório
2. Copie o arquivo `.env.local.example` para `.env.local` e preencha com suas variáveis de ambiente:

```bash
cp .env.local.example .env.local
```

3. Instale as dependências:

```bash
npm install
# ou
yarn install
```

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
