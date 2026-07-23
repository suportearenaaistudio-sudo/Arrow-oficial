# Arrow no Windows

O Arrow usa Tauri, React e Rust e pode ser compilado nativamente para Windows.

## Pré-requisitos

- Node.js 20 ou superior
- Rust com a toolchain `stable-x86_64-pc-windows-msvc`
- Microsoft C++ Build Tools, com o workload **Desktop development with C++**
- Microsoft Edge WebView2 Runtime (incluído na maioria das instalações atuais do Windows)

## Desenvolvimento

No PowerShell, caso a política de execução bloqueie `npm.ps1`, use a extensão `.cmd`:

```powershell
npm.cmd install
npm.cmd run dev:desktop
```

## Build do instalador

```powershell
npm.cmd run build:desktop
```

Os artefatos são gerados em `src-tauri\\target\\release\\bundle\\`, normalmente como instaladores NSIS (`.exe`) e MSI (`.msi`).

## Transparência nativa

O controle **Efeito de vidro** nas configurações funciona no Windows. O app usa Mica no Windows 11 e Acrylic no Windows 10 (1809 ou mais recente). Em versões sem suporte, o app continua funcionando sem o efeito nativo.

## Controles de janela

No Windows, a barra nativa é ocultada (`decorations: false`) e os botões minimizar, maximizar e fechar ficam integrados na TopBar, no mesmo estilo dos outros ícones do app.
