# Wei Fansub Drive Downloader

Extensão de navegador (Manifest V3) que baixa em sequência os episódios do Google Drive das páginas de dorama do [Wei Fansub](https://weifansub.com.br/), sem você precisar abrir cada link, clicar em "Baixar" e esperar a segunda aba.

## Recursos

- Detecta automaticamente os episódios da página (qualquer quantidade de episódios)
- Painel na própria página para escolher quais episódios baixar
- Abre cada link do Drive em segundo plano, clica no botão de download e passa para o próximo
- Status por episódio: ⏳ baixando, ✅ concluído, ❌ falhou
- Salva organizado e renomeado: `Downloads/<Drama>/<Drama> - EP01.mp4`
- Pausa curta entre episódios para não sobrecarregar o Drive

## Requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave, Opera, Vivaldi...)
- Estar logado na conta Google no mesmo navegador

## Instalação

1. Baixe o projeto e extraia.
2. Abra a página de extensões do navegador:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Ative o **Modo do desenvolvedor** (canto superior direito ou lateral, dependendo do navegador).
4. Clique em **Carregar sem compactação** e selecione a pasta `Wei Fansub Downloader`.
5. A extensão aparece na lista. Se quiser, fixe-a na barra do navegador.

Para atualizar depois, substitua os arquivos da pasta e clique no botão de recarregar (🔄) da extensão em `chrome://extensions`.

## Como usar

1. Abra a página de um drama no Wei Fansub, por exemplo `https://weifansub.com.br/2025/02/18/the-first-frost/`.
2. Clique no botão **⬇ Drive** no canto inferior direito da página.
3. Marque os episódios desejados (ou use "todos") e clique em **Iniciar**.
4. Deixe o navegador aberto. As abas do Drive abrem e fecham sozinhas em segundo plano.
5. Use **Parar** para interromper a fila a qualquer momento.

### Primeira execução

O navegador pode perguntar se `drive.usercontent.google.com` pode baixar vários arquivos automaticamente. Clique em **Permitir**, senão a fila trava no segundo episódio. Se você perdeu o aviso, libere em *Configurações do site → Downloads automáticos*.

## Como funciona

| Arquivo | Função |
| --- | --- |
| `manifest.json` | Configuração e permissões da extensão |
| `content-wei.js` | Lê os episódios da página do Wei Fansub e mostra o painel |
| `background.js` | Service worker com a fila: abre uma aba por episódio, detecta o início do download, fecha a aba e renomeia o arquivo |
| `content-drive.js` | Nas abas abertas pela fila, clica no botão "Baixar assim mesmo" do Drive |

Para cada episódio, a extensão abre `https://drive.google.com/uc?export=download&id=<ID>`, que leva direto à página de confirmação de download do Drive. O `content-drive.js` só age em abas criadas pela fila, então não interfere no seu uso normal do Drive.

## Permissões

- `downloads`: iniciar e renomear os downloads
- `storage`: guardar o estado da fila (para o painel mostrar o progresso e pular o que já foi concluído)
- `tabs`: abrir e fechar as abas do Drive
- Acesso aos sites `weifansub.com.br`, `drive.google.com` e `drive.usercontent.google.com`

A extensão não envia dados para nenhum servidor.

## Limitações conhecidas

- Só funciona com links do Google Drive (Mega, Pixeldrain e Mediafire não são suportados).
- Links que apontam para **pastas** do Drive são ignorados (aparecem como "sem link do Drive").
- O Drive limita downloads de arquivos muito acessados. Nesse caso o episódio fica com ❌ (passe o mouse para ver o motivo) e a fila segue para o próximo. Tente de novo mais tarde marcando só os que falharam.
- Se o navegador for fechado no meio da fila, ela é interrompida. Ao iniciar de novo, os episódios já concluídos são pulados.
- Se o Google mudar a página de confirmação de download, o clique automático pode deixar de funcionar. Abra uma issue com o HTML do botão.
- A extensão depende da estrutura atual das páginas do Wei Fansub (`<strong>EPISÓDIO NN</strong>` seguido dos links).

## Solução de problemas

| Problema | O que fazer |
| --- | --- |
| O botão **⬇ Drive** não aparece | Recarregue a página. Confirme que a extensão está ativada e que a página tem episódios com link do Drive |
| Fila trava no episódio 2 | Permita downloads múltiplos para `drive.usercontent.google.com` (veja "Primeira execução") |
| ❌ "botão de download não encontrado" | O Google pode ter mudado a página. Abra uma issue com o HTML do botão |
| ❌ "tempo esgotado" | O download não começou em 30 s. Verifique login no Google e tente de novo |
| Arquivos sem renomear | Outra extensão de downloads pode estar concorrendo pelo nome do arquivo. Desative-a temporariamente |

## Aviso

Projeto independente, sem qualquer vínculo com o Wei Fansub ou com o Google. Use com responsabilidade e respeite as regras do site e os direitos autorais das obras.

## Licença

[MIT](LICENSE)
