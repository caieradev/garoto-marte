# Estrutura do Projeto Garoto Marte

```
garoto-marte-app/          # Diretório raiz do projeto
├── .env.local             # Arquivo de variáveis de ambiente (não incluir no git)
├── .env.local.example     # Exemplo de arquivo .env para outros desenvolvedores
├── package.json           # Dependências e scripts do projeto
├── tsconfig.json          # Configurações do TypeScript
├── next.config.ts         # Configurações do Next.js
├── public/                # Arquivos estáticos
└── src/                   # Código fonte
    ├── app/               # Diretório de rotas do App Router
    │   ├── admin/         # Área administrativa
    │   │   ├── layout.tsx # Layout da área administrativa
    │   │   ├── page.tsx   # Dashboard admin
    │   │   └── produtos/  # Gestão de produtos
    │   │       ├── page.tsx         # Lista de produtos
    │   │       ├── novo/            # Adicionar novo produto
    │   │       │   └── page.tsx     # Formulário para novo produto
    │   │       └── [id]/            # Detalhes do produto
    │   │           ├── page.tsx     # Editar produto
    │   │           └── excluir/     # Excluir produto
    │   │               └── page.tsx # Confirmação de exclusão
    │   ├── produtos/      # Páginas públicas de produtos
    │   │   ├── layout.tsx # Layout da área de produtos
    │   │   ├── page.tsx   # Lista de produtos
    │   │   └── [id]/      # Detalhes do produto
    │   │       └── page.tsx # Página de detalhes do produto
    │   ├── layout.tsx     # Layout global do site
    │   ├── page.tsx       # Página inicial
    │   ├── globals.css    # Estilos globais
    │   └── not-found.tsx  # Página 404
    ├── components/        # Componentes reutilizáveis
    │   └── ui/            # Componentes de UI
    │       ├── button.tsx   # Botão
    │       ├── card.tsx     # Card
    │       ├── dialog.tsx   # Modal
    │       ├── form.tsx     # Formulário 
    │       ├── input.tsx    # Input
    │       ├── label.tsx    # Label
    │       ├── select.tsx   # Select
    │       ├── table.tsx    # Tabela
    │       ├── textarea.tsx # Área de texto
    │       ├── product-gallery.tsx # Galeria de imagens de produto
    │       └── product-form/       # Formulários de produto
    │           ├── delete-product.tsx # Componente de exclusão
    │           └── product-form.tsx   # Formulário de produto
    ├── lib/                         # Utilitários e serviços
    │   ├── utils.ts                 # Funções utilitárias
    │   ├── cloudinary.ts            # Serviço de upload de imagens
    │   └── firebase/                # Configuração e serviços do Firebase
    │       ├── firebase.ts          # Inicialização do Firebase
    │       └── products.ts          # CRUD de produtos
    └── types/                       # Definições de tipos
        └── product.ts               # Interface de Produto
```

## Funcionalidades por Área

### Painel Administrativo
- **Admin Dashboard**: Exibe uma visão geral do sistema
- **Gerenciamento de Produtos**: CRUD completo para produtos
  - Listagem de produtos
  - Adicionar novos produtos
  - Editar produtos existentes
  - Excluir produtos
  - Upload de imagens via Cloudinary

### Loja (Frontend)
- **Home**: Destaque de produtos em destaque, sobre a marca, newsletter
- **Lista de Produtos**: Navegação por todos os produtos disponíveis
- **Detalhes do Produto**: Visualização detalhada de cada produto
  - Galeria de imagens
  - Descrição
  - Medidas
  - Opção de gravata (quando aplicável)
  - Preço
  - Status (em estoque/esgotado)
  - Botão para adicionar ao carrinho

### Integração com Serviços
- **Firebase/Firestore**: Banco de dados para armazenar produtos, usuários, pedidos
- **Cloudinary**: Armazenamento e otimização de imagens
- **Auth (pendente)**: Sistema de autenticação para administradores e clientes
- **Carrinho (pendente)**: Funcionalidade de carrinho de compras
- **Checkout (pendente)**: Processo de finalização de compra
