# Arrow

Aplicativo desktop local-first para planejamento por ciclos de 12 semanas, execução diária, foco e acompanhamento pessoal.

## Desenvolvimento

```bash
npm install
npm run dev:desktop
```

## Vault e sincronização

Todo o conteúdo do usuário fica em uma pasta de vault: `.arrow/arrow.db`, `notes/` e `attachments/`. Para manter os dados em mais de um dispositivo, crie ou abra o vault dentro de uma pasta sincronizada pelo iCloud Drive, Dropbox, Google Drive ou serviço equivalente.

Abra o vault em apenas um dispositivo por vez quando estiver fazendo muitas alterações. Se o provedor sinalizar conflito de arquivo, feche o Arrow, mantenha a cópia mais recente do banco e reabra o vault. Backups automáticos versionados são uma evolução futura; o provedor de sincronização continua sendo uma camada adicional, não um substituto para cópias de segurança.
