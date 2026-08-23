# PhyNetix

### A modern online examination platform built for competitive exam preparation.

**PhyNetix** is a full-stack examination platform designed to provide a realistic, reliable, and data-driven testing experience for students preparing for competitive examinations such as **JEE**.

It combines online test delivery, question attempting, performance analytics, authentication, and administrative capabilities into a single platform.

**Live:** https://phynetix.me

---

## ✨ Features

### 📝 Online Test Platform

* JEE-style online examinations
* Real-time question navigation
* Multiple-choice question support
* Question status tracking
* Mark for review
* Test timer and automatic submission
* Exam-style interface designed for focused attempting

### 📊 Performance Analytics

* Test performance tracking
* Score and accuracy analysis
* Question-wise performance
* Attempt history
* Performance insights for identifying weak areas

### 🔐 Authentication & User Management

* Secure user authentication
* Student registration and login
* Protected application routes
* User profiles
* Role-based access control

### 🛡️ Proctoring & Monitoring

PhyNetix is designed with online examination integrity in mind.

Planned/implemented monitoring capabilities include:

* Camera access
* Microphone access
* Screen sharing
* Fullscreen monitoring
* Tab/focus change detection
* Permission-state monitoring
* Proctoring event logging
* Test-attempt based monitoring

### ⚙️ Administrative System

* Test management
* Question management
* Student management
* Attempt monitoring
* Test configuration
* Performance monitoring

---

## 🏗️ Tech Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Frontend           | React + TypeScript      |
| Styling            | Tailwind CSS            |
| Backend / Database | Supabase                |
| Authentication     | Supabase Auth           |
| Database           | PostgreSQL              |
| Server-side Logic  | Supabase Edge Functions |
| Version Control    | Git + GitHub            |
| Deployment         | Vercel                  |
| Domain             | phynetix.me             |

---

## 🧠 Architecture

```text
                    ┌──────────────────┐
                    │     Student      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PhyNetix Web   │
                    │ React + TypeScript│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        Authentication    Database      Edge Functions
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │     Supabase     │
                    │   PostgreSQL DB   │
                    └──────────────────┘
```

---

## 📂 Project Structure

```text
PhyNetix/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── ...
│
├── supabase/
│   ├── functions/
│   └── migrations/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

> Project structure may evolve as PhyNetix continues to develop.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git

### Clone the repository

```bash
git clone https://github.com/adarshgupta/PhyNetix.git
cd PhyNetix
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit private keys, service-role keys, passwords, or other secrets to GitHub.

### Start development server

```bash
npm run dev
```

The application will be available locally through the development server URL shown in your terminal.

### Build for production

```bash
npm run build
```

---

## 🗄️ Database

PhyNetix uses **PostgreSQL through Supabase** for persistent application data.

The database handles areas such as:

* User profiles
* Tests
* Questions
* Test attempts
* Results
* Proctoring configuration
* Monitoring events
* User-specific test settings

Database security is handled using authentication and **Row Level Security (RLS)** policies where appropriate.

---

## 🔒 Security

Security is an important part of an examination platform.

PhyNetix uses:

* Authentication
* Protected routes
* Database access policies
* Row Level Security
* Server-side Edge Functions
* Environment variables for sensitive configuration
* Role-based authorization

Secrets and service credentials should never be committed to the repository.

---

## 🎯 Project Goals

PhyNetix aims to provide:

1. A realistic competitive-exam testing experience
2. Reliable online test delivery
3. Meaningful performance analytics
4. A scalable backend architecture
5. Better examination integrity through monitoring
6. A platform that can grow beyond a simple test-series website

---

## 🛣️ Roadmap

* [x] Student authentication
* [x] Online test interface
* [x] Test attempts
* [x] Basic performance tracking
* [x] Supabase database integration
* [x] Protected routes
* [ ] Advanced performance analytics
* [ ] Advanced proctoring dashboard
* [ ] Live candidate monitoring
* [ ] Advanced anti-cheating detection
* [ ] More examination categories
* [ ] Improved question management
* [ ] Scalable deployment architecture
* [ ] Mobile experience

---

## 📸 Screenshots

Add screenshots of the actual product here.

```text
docs/
└── screenshots/
    ├── landing-page.png
    ├── test-interface.png
    ├── dashboard.png
    └── admin-panel.png
```

Example:

```markdown
![PhyNetix Test Interface](docs/screenshots/test-interface.png)
```

---

## 🌐 Links

* **Website:** https://phynetix.me
* **Documentation:** https://doc.phynetix.me
* **GitHub:** https://github.com/adarshgupta/PhyNetix

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

If you find a bug or have an improvement:

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Test your changes
5. Open a Pull Request

For major changes, open an issue first to discuss the proposed change.

---

## 📄 License

This project is currently maintained as a personal project.

Add an appropriate open-source license to the repository if you intend to allow reuse, modification, or redistribution of the source code.

---

## 👨‍💻 Author

**Adarsh Gupta**

Building PhyNetix as a full-stack examination platform focused on competitive exam preparation.

GitHub: https://github.com/adarshgupta162

---

<p align="center">
  <b>PhyNetix — Practice. Analyze. Improve.</b>
</p>

