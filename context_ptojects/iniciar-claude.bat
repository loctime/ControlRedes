@echo off
rem — Node server (necesita su directorio)
start "" /D "C:\Users\User\Desktop\Proyectos\ControlRedes\server" node server.js

rem — Claude arranca en home, sin proyecto forzado
start "" /D "C:\Users\User" claude --channels plugin:telegram@claude-plugins-official --dangerously-skip-permissions
