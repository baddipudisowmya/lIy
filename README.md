# 🎯 LIY — Let's Interview You

<p align="center">
  <strong>AI-Powered Resume Analyzer & Interview Readiness Platform</strong>
</p>

<p align="center">
  Upload your resume • Select target roles • Get instant AI analysis • Take domain quizzes • Know your readiness
</p>

---

## 🚀 What is LIY?

**LIY (Let's Interview You)** is a full-stack application that analyzes your resume against industry-standard role requirements using AI, provides a dramatic pass/fail verdict, tests your domain knowledge with MCQs, and gives you a comprehensive readiness assessment with actionable suggestions.

### ✨ Features

- 📄 **Resume Upload** — Drag & drop PDF upload with instant text extraction
- 🎯 **Multi-Role Targeting** — Check qualifications for 10+ tech roles simultaneously
- 🤖 **AI-Powered Analysis** — 3-stage LLM pipeline using Meta LLaMA 3.1 via HuggingFace
- 🎬 **Dramatic Verdict** — Suspenseful processing animation with particle effects for pass/fail reveal
- 📝 **Domain MCQ Quiz** — 10 curated questions per role to validate knowledge
- 📊 **Readiness Dashboard** — Percentage score, observations, and personalized improvement suggestions

### 🏗️ Architecture

```
┌─────────────────┐     REST API      ┌──────────────────────┐      API       ┌──────────────┐
│    Frontend     │ ◄──────────────► │  Spring Boot Backend  │ ◄────────────► │ HuggingFace  │
│  HTML/CSS/JS    │                   │     Java 21+          │                │  LLaMA 3.1   │
│  Dark Theme     │                   │  • PDF Parser         │                │   8B Instruct│
│  Glassmorphism  │                   │  • LLM Service        │                └──────────────┘
│  Particle FX    │                   │  • MCQ Service        │
└─────────────────┘                   └──────────────────────┘
```

### 🔄 3-Stage LLM Pipeline

| Stage | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Stage 1** | Resume → Structured JSON | PDF text + role requirements | Skills, Experience, Strengths, Gaps |
| **Stage 2** | Pass/Fail Verdict | Structured analysis + requirements | Verdict, Confidence, Key findings |
| **Stage 3** | Final Assessment | MCQ scores + resume analysis | Readiness %, Observations, Suggestions |

### 🎭 Supported Roles

| Role | Description |
|------|-------------|
| 💻 Software Development Engineer (SDE) | Full-stack problem solver |
| 🎨 Frontend Developer (FDE) | UI/UX implementation specialist |
| 🧪 Test/QA Engineer | Quality assurance expert |
| 📊 Data Scientist | Data analysis & ML practitioner |
| ⚙️ DevOps Engineer | CI/CD & infrastructure specialist |
| 🧠 ML Engineer | Machine learning systems builder |
| 🔧 Backend Developer | Server-side architecture expert |
| 📱 Mobile Developer | iOS/Android app developer |
| ☁️ Cloud Architect | Cloud infrastructure designer |
| 🔒 Cybersecurity Analyst | Security specialist |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21+, Spring Boot 3.4, Apache PDFBox |
| **Frontend** | HTML5, CSS3 (Glassmorphism), Vanilla JS |
| **AI/LLM** | Meta LLaMA 3.1 8B Instruct via HuggingFace |
| **HTTP Client** | Spring WebFlux WebClient |

---

## 📦 Getting Started

### Prerequisites

- **Java 21+** (JDK installed and on PATH)
- **A modern browser** (Chrome, Firefox, Edge)
- **HuggingFace API Token** (configured in `backend/src/main/resources/application.properties`)

### 1. Clone & Navigate

```bash
git clone <your-repo-url>
cd shortList
```

### 2. Start the Backend

```bash
cd backend
./mvnw spring-boot:run        # Linux/Mac
mvnw.cmd spring-boot:run      # Windows
```

The backend starts on **http://localhost:8080**

### 3. Open the Frontend

Open `frontend/index.html` in your browser, or serve it:

```bash
cd frontend
# If you have Python:
python -m http.server 3000
# Or use any static file server
```

The frontend runs on **http://localhost:3000**

### 4. Use the App

1. 📄 Upload your resume (PDF)
2. ✅ Select target roles
3. 🎬 Watch the AI analysis with suspense effects
4. 📝 Take the domain MCQ quiz
5. 📊 Get your readiness report!

---

## 📁 Project Structure

```
shortList/
├── backend/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── src/main/java/com/liy/
│   │   ├── LiyApplication.java
│   │   ├── config/
│   │   │   ├── CorsConfig.java
│   │   │   └── LlmConfig.java
│   │   ├── controller/
│   │   │   └── ResumeController.java
│   │   ├── model/
│   │   │   ├── ResumeAnalysis.java
│   │   │   ├── Verdict.java
│   │   │   ├── Assessment.java
│   │   │   └── McqQuestion.java
│   │   └── service/
│   │       ├── PdfParserService.java
│   │       ├── LlmService.java
│   │       └── McqService.java
│   └── src/main/resources/
│       ├── application.properties
│       ├── roles/          # Role qualification definitions
│       └── mcqs/           # MCQ question banks
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js
│   │   └── effects.js
├── README.md
└── .gitignore
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ by the LIY Team</p>
