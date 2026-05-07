 @echo off
  rem — Matar procesos anteriores
  taskkill /F /IM node.exe >nul 2>&1
  taskkill /F /FI "WINDOWTITLE eq bot.js" >nul 2>&1

  rem — Node server (segundo plano, sin ventana)
  start /B "" /D "C:\Users\User\Desktop\Proyectos\ControlRedes\server" node server.js >nul 2>&1

  rem — Claude arranca en home, sin proyecto forzado
  start "" /D "C:\Users\User" claude --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions

  rem — Otro Node.js (bot) con ventana propia
  cd /D "C:\Users\User\Desktop\Proyectos\controlBun"
  start cmd /k "node bot.js"