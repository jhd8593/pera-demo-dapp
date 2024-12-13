@echo off
cd %~dp0
set NODE_OPTIONS=--openssl-legacy-provider
npx react-scripts start
