# Studio — Orçamento personalizado + Painel administrativo

Landing page premium para agência de **Social Media e Produção Audiovisual**, com configurador de orçamento em tempo real e painel `/admin` protegido por login, em que o proprietário altera preços, serviços, textos, fotos e contatos sem mexer no código.

**Stack:** React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide · Vite · Express 5 · SQLite (`node:sqlite`)

---

## Como rodar

Requisito: **Node.js 22.5+** (usa o SQLite nativo do Node).

```bash
npm install
cp .env.example .env        # opcional: defina ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # site em http://localhost:5173 · API em http://localhost:3001
```

No primeiro boot o banco é criado em `data/studio.db` com serviços, textos e imagens iniciais, além da **conta proprietária**:

- E-mail: `ADMIN_EMAIL` (padrão `owner@studio.com`)
- Senha: `ADMIN_PASSWORD`. Se ficar vazia, uma senha aleatória é gerada e exibida **uma única vez** no console.

Acesse **`/admin`**, entre e troque a senha em *Configurações → Conta & equipe*.

### Produção

```bash
npm run build     # compila frontend (dist/) e backend (dist-server/)
npm start         # um único processo Node serve a API e o site
```

Atrás de HTTPS/proxy reverso, defina `COOKIE_SECURE=true`, `TRUST_PROXY=true` e `PUBLIC_ORIGIN=https://seudominio.com.br`. Mantenha a pasta `data/` (banco + uploads) num volume persistente e inclua-a no backup.

### Testes

```bash
npm test          # testes de API: permissões, CSRF, recálculo de preço, uploads
npm run typecheck
```

---

## Fluxo do cliente

1. Hero → conhece o estúdio → resultados (Reels com visualizações)
2. **Monte seu plano**: escolhe um plano mensal de preço fixo (4, 8 ou 12 vídeos por mês)
3. Se quiser, adiciona avulsos (carrossel com 3 ajustes, vídeo avulso, vídeo institucional) e define a quantidade (atalhos, `− 04 +` ou digitação manual)
4. O investimento é recalculado em tempo real, separando o valor mensal do plano e o dos avulsos (no celular, numa barra fixa inferior)
5. **Solicitar orçamento** (com nome/contato opcionais) ou **Enviar pelo WhatsApp**
6. O pedido é registrado no painel e o WhatsApp abre com a mensagem pronta:

```
Olá! Gostaria de solicitar um orçamento personalizado.

Plano mensal: 8 vídeos por mês (R$ 1.200,00/mês)

Avulsos:
Carrossel avulso: 2 carrosséis
Vídeo institucional: 1 vídeo

Plano: R$ 1.200,00/mês
Avulsos: R$ 680,00
Investimento estimado: R$ 1.880,00

Ref.: ORC-0007
```

## Painel `/admin`

| Seção | O que faz |
|---|---|
| **Dashboard** | Orçamentos no mês, valor estimado, ticket médio, gráfico de 30 dias, formatos mais pedidos |
| **Serviços** | Criar, editar, excluir, ativar/desativar e reordenar. Tipo (plano mensal de preço fixo ou avulso por unidade), nome, descrição, itens inclusos, preço, ícone, imagem, qtd. mín./máx./padrão, atalhos, unidade, selo |
| **Preços** | Edição rápida dos preços com prévia. Ao salvar, o site público já usa o novo valor |
| **Imagens** | Biblioteca (upload múltiplo, arrastar e soltar, substituir mantendo as referências, excluir, adicionar por URL), imagem de cada seção, galeria editorial e vitrine de Resultados |
| **Configurações** | Nome, logo, cor de destaque, todos os textos (título, subtítulo, CTA…), SEO, WhatsApp, Instagram, e-mail, mensagem automática, senha e equipe |
| **Orçamentos** | Leads com itens, total, contato e status (novo, em contato, fechado, perdido) |

Nos títulos, trechos entre `*asteriscos*` viram itálico serifado (assinatura tipográfica da página).

## Segurança e permissões

A proteção acontece **no servidor**: esconder o painel no frontend é só uma questão de interface.

- **Papéis:** `owner` altera tudo; `viewer` só consulta. Toda rota que escreve passa por `requireRole('owner')` (`server/routes/admin/index.ts`), e o cliente final não tem conta.
- **Preço nunca vem do navegador:** `POST /api/public/quotes` recebe apenas `serviceId` + quantidade. O total é recalculado com os preços do banco e as quantidades são limitadas ao mín./máx. de cada serviço.
- **Sessões:** token aleatório em cookie `httpOnly` + `SameSite=Strict` (+ `Secure` em produção). No banco fica só o hash SHA-256 do token, e logout ou troca de senha invalidam a sessão no servidor.
- **Senhas:** `scrypt` com salt; o login tem rate limit e responde em tempo constante para e-mails inexistentes.
- **CSRF:** cookie `SameSite=Strict`, verificação de `Origin` e só aceita JSON/multipart.
- **Uploads:** formato validado pelos *bytes* do arquivo (JPG/PNG/WEBP/AVIF/GIF; SVG é bloqueado), nome aleatório, limite de 12 MB e `nosniff`.
- **Cabeçalhos:** Helmet com CSP restritiva, `frame-ancestors 'none'` e HSTS.
- **Validação:** todo payload passa por schemas Zod (`server/services/schemas.ts`).

## Estrutura

```
shared/                 contratos e regras usados pelo front e pelo back
  types.ts              tipos (serviços, configurações, orçamentos…)
  pricing.ts            cálculo do orçamento + mensagem do WhatsApp (fonte única)
  icons.ts              ícones permitidos para serviços
server/
  db/                   conexão SQLite, migrações versionadas, seed e conteúdo inicial
  auth/                 hash de senha e sessões
  middleware/           autenticação/papéis, CSRF, rate limit, erros
  services/             repositórios (serviços, mídia, configurações, orçamentos, usuários) + schemas
  routes/               public · auth · admin
src/
  components/           ui/ (botões, vidro, contador…) · layout/ · sections/ · configurator/
  pages/                HomePage, NotFound
  admin/                painel (layout, pages, components, hooks) — carregado sob demanda
  services/             clientes HTTP da API
  hooks/                dados do site, montagem do orçamento, animações, auth
  config/               mapa de ícones, âncoras, motion
  data/                 navegação e layouts da galeria
  assets/
data/                   banco SQLite e uploads (fora do git)
```

## Personalização sem código

Pelo painel você altera: logo, nome da empresa, cor de destaque, fotos (hero, seções, galeria, resultados, serviços, login), serviços, preços, quantidades, ícones, todos os textos e CTAs, WhatsApp, Instagram, e-mail e a mensagem automática.

As fotos iniciais vêm do Unsplash, escolhidas na estética das referências (preto e branco, edição, claquete, celular, bastidores), e servem só como ponto de partida: troque por fotos do estúdio em **Imagens → Biblioteca → Substituir**. A seção **Resultados** já está com as visualizações dos seus vídeos (120 mil, 85 mil, 78,4 mil, 54,8 mil, 11,1 mil), mas ainda usa capas provisórias. Envie os prints reais em **Imagens → Resultados**.
