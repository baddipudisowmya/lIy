# 🎯 LIY — Let's Interview You

**AI-Powered Resume Analyzer for Job Seekers**

Upload your resume, select your experience level, choose roles you're interested in, and get personalized AI feedback with a learning roadmap.

---

## 🚀 Project Overview

**LIY (Let's Interview You)** is an AI-powered platform that analyzes your resume and tells you exactly what you need to focus on to land your dream job.

**The Problem:**
Job seekers often struggle with: "Will my resume match this role?" or "What skills should I learn?" Without personalized feedback, preparing for interviews becomes guesswork.

**The Solution:**
- Upload your resume in seconds
- Get an honest AI evaluation against the role you want
- Receive a personalized learning roadmap
- Practice with role-specific interview questions

**Why LIY?**
- Fair evaluation based on your experience level (not comparing freshers to seniors)
- Encouraging, growth-focused feedback (never negative)
- Actionable roadmaps, not just scores
- 4-week structured learning plan
- Ready-to-practice interview questions

**Target Users:**
- Job seekers at all career stages

---

## 🚀 Setup Instructions

### Prerequisites
- Java 11+
- Python 3.7+
- Hugging Face API token (free from https://huggingface.co/settings/tokens)

### Quick Start

**1. Set your API token:**
```powershell
$env:HF_API_TOKEN = "hf_YourHuggingFaceToken"
```

**2. Start the application:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
& "c:\Users\baddipudi.sowmya\Desktop\Project Resurrection\lIy\RUN_APPLICATION.ps1"
```

**3. Open in browser:**
```
http://localhost:8080
```

Frontend runs on port 8080, backend on port 8082.

---

## ✨ Features

### Resume Upload & Analysis
Upload your resume (PDF or text) and get instant AI-powered analysis.

### Experience Level Selection
Choose your level (Fresher to Lead/Principal) for fair, experience-appropriate evaluation.

### 10 Tech Roles
Software Development Engineer, Frontend Developer, Backend Developer, Data Scientist, DevOps Engineer, ML Engineer, Mobile Developer, Cloud Architect, Cybersecurity Analyst, Test/QA Engineer.

### Smart Verdict System
- **Score ≥ 70%**: Interview preparation with top 6 focus areas and 40+ practice questions.
- **Score < 70%**: Growth roadmap with recommended skills, 4-week learning plan, and course suggestions.

### Personalized Learning Roadmap
4-week structured plan covering core concepts, intermediate skills, practical projects, and interview prep.

### Interview Preparation
40+ role-specific interview questions organized by category and difficulty.

---

## 🏛️ Architecture & Workflow

**How It Works:**

1. **Upload Resume** - Drag and drop your resume file
2. **Select Level** - Choose your experience level (Fresher to Lead/Principal)
3. **Choose Roles** - Pick the roles you're interested in
4. **AI Analysis** - Backend analyzes your resume against role requirements
5. **Get Verdict** - View your match score and personalized feedback
   - Score ≥ 70%: Interview prep with practice questions
   - Score < 70%: Growth roadmap with learning plan
6. **Learn & Improve** - Use the roadmap and resources to build skills

**System Diagram:**

```
┌─────────────────────────────────────────────────────────┐
│                   YOU (Job Seeker)                      │
│                                                         │
│  Upload Resume → Select Level → Choose Roles            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   LIY Frontend (Web)    │
        │                        │
        │  • Upload interface    │
        │  • Display results     │
        │  • Learning roadmap    │
        └────────────┬───────────┘
                     │
                     ▼ API Call
        ┌────────────────────────┐
        │   LIY Backend (AI)      │
        │                        │
        │  • Analyze resume      │
        │  • Calculate score     │
        │  • Generate feedback   │
        └────────────┬───────────┘
                     │
                     ▼ AI Request
        ┌────────────────────────┐
        │  Hugging Face LLM      │
        │                        │
        │  • Claude / Llama      │
        │  • Evaluates resume    │
        │  • Returns analysis    │
        └────────────┬───────────┘
                     │
                     ▼ Response
        ┌────────────────────────┐
        │   Your Results          │
        │                        │
        │  • Match score         │
        │  • Focus areas         │
        │  • Learning roadmap    │
        │  • Interview questions │
        └────────────────────────┘
```

---

## 🤖 AI Capabilities

### LLM as Judge
The AI analyzes your resume in two steps:
1. **Resume Analysis** - Extracts skills, experience, and strengths from your resume
2. **Verdict Generation** - Evaluates how well you match each role and generates fair feedback

### Experience-Aware Evaluation
Your experience level matters. A fresher isn't penalized for lacking senior skills. Each level has appropriate expectations for fair assessment.

### Fair & Encouraging Feedback
All feedback is positive and growth-focused. We highlight your strengths and frame gaps as learning opportunities, never discouraging language.

### PII Validation & Privacy
Your personal information is protected:
- **Automatic Detection** - System detects sensitive data (emails, phone numbers, addresses) in resumes
- **Secure Handling** - Personal information is only used for analysis, never stored or shared
- **Privacy First** - Resume content is processed securely and not retained after analysis
- **Compliance** - Built with privacy best practices in mind

---

## 🔧 Challenges Faced

- **Backend Startup Time** - First run takes 30-60 seconds due to dependency downloads
- **LLM API Rate Limiting** - Hugging Face API has request limits for concurrent users
- **Resume Text Extraction** - PDF parsing accuracy varies depending on format
- **Mobile Responsiveness** - Complex verdict cards optimized for small screens with multi-breakpoint CSS
- **Dark Theme Accessibility** - High contrast design ensures WCAG compliance

---

## 🔮 Future Improvements

- **PII Validation & Privacy** - Secure data handling
- **Interview Practice Mode** - Live simulations with feedback
- **Progress Tracking** - Monitor learning journey
- **Job Market Integration** - Real-time in-demand skills
- **Multi-Language Support** - Global accessibility
- **Local AI Models** - Faster, private analysis
- **Admin Dashboard** - For organizations
- **Explainability** - Understand your scores
- **Accessibility** - WCAG compliance

