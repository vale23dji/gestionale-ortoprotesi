# Progetto Orto-Protesi - Documentazione Tecnica

## Stack Tecnologico
- Frontend: Angular 17 + SCSS
- Backend: .NET (verrà integrato in seguito)
- Database: SQL Server
- Obiettivo: Web app con futura espansione Android/iOS
- Tool gratuito: VS Code, Node.js, Angular CLI

## Step 1 - Setup Frontend
- Installato Node.js v20.x
- Installato Angular CLI
- Creato progetto Angular con routing e SCSS

STEP 2: Creazione struttura pagine (componenti + routing)
Obiettivo
Creiamo i componenti base per ognuna delle schermate che mi hai mostrato:

login → Pagina di accesso

register → Pagina di registrazione

clienti → Lista clienti iscritti

nuova-lavorazione → Inserimento nuova lavorazione

lavorazioni → Lista lavorazioni

CREARE COMPONENTI ANGULAR : 
ng generate component pages/login
ng generate component pages/register
ng generate component pages/clienti
ng generate component pages/nuova-lavorazione
ng generate component pages/lavorazioni


## Step 2 - Creazione Pagine e Routing

Componenti creati:
- login
- register
- clienti
- nuova-lavorazione
- lavorazioni

Routing configurato in `app-routing.module.ts`, con redirect automatico a `/login`.

## Step 3 - Pagina Login

- Creato componente standalone `LoginComponent`
- Layout responsive con SCSS
- Form con [(ngModel)] su `email` e `password`
- Aggiunti link per "Password dimenticata" e "Nuova registrazione"
