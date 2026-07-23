# Auto-update do Arrow (Tauri Updater)

O Arrow usa o `tauri-plugin-updater` para baixar e instalar novas versões automaticamente.

## Pré-requisitos

1. App instalado via **instalador** (`.exe` / `.msi` / `.dmg`) — não funciona copiando só o `.exe`
2. Repositório no GitHub com releases publicadas
3. Chave de assinatura configurada (já gerada localmente)

## 1. Ajustar URL do repositório

Edite `src-tauri/tauri.conf.json` e troque `SEU_USUARIO` pelo seu usuário/org do GitHub:

```json
"endpoints": [
  "https://github.com/SEU_USUARIO/arrow/releases/latest/download/latest.json"
]
```

## 2. Chaves de assinatura

| Arquivo | Onde fica | Commitar? |
|---------|-----------|-----------|
| `C:\Users\vitor\.tauri\arrow.key` | Sua máquina | **Nunca** |
| `src-tauri/updater.pub` | Repositório | Sim (pública) |

Chave privada já gerada em:

```
C:\Users\vitor\.tauri\arrow.key
```

Para gerar outra (se perder a atual):

```powershell
npx tauri signer generate -w "$env:USERPROFILE\.tauri\arrow.key" --ci -f
```

Copie o conteúdo de `arrow.key.pub` para `plugins.updater.pubkey` no `tauri.conf.json` e para `src-tauri/updater.pub`.

## 3. Secret no GitHub

No repositório: **Settings → Secrets → Actions → New repository secret**

| Secret | Valor |
|--------|--------|
| `TAURI_SIGNING_PRIVATE_KEY` | Conteúdo completo do arquivo `arrow.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Deixe vazio se a chave não tiver senha |

## 4. Publicar uma versão

1. Atualize a versão em **3 arquivos** (mesmo número):
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`

2. Commit e tag:

```powershell
git tag v0.5.1
git push origin main
git push origin v0.5.1
```

3. O workflow `.github/workflows/release.yml` gera os instaladores e um **draft release** no GitHub com `latest.json` + assinaturas.

4. Revise o draft release e publique.

## 5. Build local assinado (opcional)

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$env:USERPROFILE\.tauri\arrow.key" -Raw
npm.cmd run build:desktop
```

Artefatos de update ficam em `src-tauri/target/release/bundle/`.

## Comportamento no app

- **Ao abrir**: checa updates 4s depois de carregar o vault (silencioso)
- **Configurações → Atualizações**: botão manual
- **Nova versão**: toast com botão "Atualizar" → download → reinicia sozinho
- **Modo dev** (`npm run dev:desktop`): updater desativado

## Windows

- `installMode: passive` — barra de progresso, instalação automática
- O app **fecha** antes de instalar (comportamento normal do instalador Windows)
