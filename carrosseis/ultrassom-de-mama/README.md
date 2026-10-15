# Carrossel — Ultrassom de mama · Clínica Agra Centramed

5 cards para Instagram, 1080 × 1350 px (4:5), prontos em `export/`.

| Card | Conteúdo | Composição |
|---|---|---|
| 01 | Capa: “Cuidar das mamas também é uma forma de se cuidar.” | Foto em arco + título editorial |
| 02 | O que é o ultrassom de mama? | Foto sangrando à direita com curva orgânica |
| 03 | Quando esse exame pode ser indicado? | Fundo vinho, tópicos numerados, monograma em marca-d’água |
| 04 | É simples e não utiliza radiação. | Foto do exame + detalhe do transdutor com gel + frase de destaque |
| 05 | Sua saúde merece atenção. · CTA | Bloco vinho com botão + logotipo e contatos |

## Antes de publicar

No card 05, preencha os contatos em `carrossel.html` (bloco `CONTATOS`):
troque os textos entre colchetes e remova a classe `ph` de cada `<span>`. Depois exporte de novo.

## Editar e exportar

- **Textos:** direto em `carrossel.html`, cada card é uma `<section class="card">`.
- **Cores e fontes:** tokens em `:root` (off-white, rosé, vinho, cinza quente).
- **Imagens:** pasta `img/`; o enquadramento de cada foto fica no CSS do card (`.cN .photo img`).
- **Exportar:** abra o HTML no navegador para conferir e rode

```bash
NODE_PATH=$(npm root -g) node exportar.cjs        # 1080×1350
NODE_PATH=$(npm root -g) node exportar.cjs --2x   # 2160×2700
```

(requer Playwright: `npm i -g playwright`).

Fontes: Cormorant Garamond e Manrope (licença OFL, arquivos em `fonts/`).

## Tratamento das fotos

- `medica-monitor.jpg`: textos ilegíveis gerados por IA no monitor e no frasco foram desfocados.
- `exame-acolhimento.jpg`: original de 500 px ampliado com Lanczos e nitidez leve. Para máxima qualidade, substitua por um original maior.

## Sugestão de legenda

> Cuidar das mamas também é uma forma de se cuidar. 🤍
>
> O ultrassom de mama é um exame de imagem que usa ondas sonoras, sem radiação ionizante, e pode ajudar a investigar alterações como nódulos e cistos. A indicação é individual: converse com um profissional de saúde para saber qual exame é o mais adequado para você.
>
> Agende sua avaliação na Clínica Agra Centramed.
>
> #ultrassomdemama #saudedamulher #prevencao #saudedasmamas #clinicaagra
