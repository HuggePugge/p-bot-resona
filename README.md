# Kontrollavgift App

En modern React-applikation för att skapa och hantera parkeringsböter (kontrollavgifter) med Firebase-integration och TM Print Assistant-stöd.

## Funktioner

- 🔐 Firebase-autentisering
- 📝 Formulär för kontrollavgifter
- 💾 Sparar data till Firebase Firestore
- 🖨️ Utskrift via TM Print Assistant
- 📱 Responsiv design
- 🎨 Modern UI/UX

## Installation

1. Klona projektet:
```bash
git clone <repository-url>
cd kontrollavgift-app
```

2. Installera beroenden:
```bash
npm install
```

3. Konfigurera miljövariabler:
```bash
cp env.example .env
```

4. Uppdatera `.env` med dina riktiga värden:
- Firebase-konfiguration
- ImageKit-konfiguration (valfritt)

## Konfiguration

### Firebase
1. Skapa ett Firebase-projekt på [Firebase Console](https://console.firebase.google.com/)
2. Aktivera Authentication (Email/Password)
3. Aktivera Firestore Database
4. Kopiera konfigurationsvärdena till `.env`

### ImageKit (valfritt)
1. Skapa ett ImageKit-konto på [ImageKit.io](https://imagekit.io/)
2. Kopiera API-nycklarna till `.env`

## Användning

### Utvecklingsläge
```bash
npm start
```

### Produktionsbygg
```bash
npm run build
```

### Testning
```bash
npm test
```

## Struktur

```
src/
├── components/
│   ├── Login.tsx              # Inloggningskomponent
│   ├── Login.css
│   ├── KontrollavgiftForm.tsx # Huvudformulär
│   └── KontrollavgiftForm.css
├── firebase.ts                # Firebase-konfiguration
├── imagekit.ts                # ImageKit-konfiguration
├── App.tsx                    # Huvudapplikation
└── App.css
```

## Miljövariabler

Se `env.example` för alla nödvändiga miljövariabler.

## Deployment

Applikationen kan deployas till:
- Firebase Hosting
- Vercel
- Netlify
- GitHub Pages

## Teknisk stack

- React 18
- TypeScript
- Firebase (Auth, Firestore)
- ImageKit (valfritt)
- CSS3 med modern styling
