<div align="center">

  <h1>♟️ ChessMentorGPT</h1>
  <p><b>An AI-Powered Grandmaster in Your Browser</b></p>

  <!-- Badges -->
  <a href="https://chess-mentor-gpt.vercel.app/">
    <img src="https://img.shields.io/badge/Website-Live_App-4c1d95?style=for-the-badge&logo=vercel&logoColor=white" alt="Live App" />
  </a>
  <a href="https://chessmentorgpt-backend.onrender.com">
    <img src="https://img.shields.io/badge/API-Render_Backend-2563eb?style=for-the-badge&logo=render&logoColor=white" alt="Render API" />
  </a>
  <img src="https://img.shields.io/badge/Frontend-React_|_Vite-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React Vite" />
  <img src="https://img.shields.io/badge/AI_Engine-Groq_|_Llama_3-f97316?style=for-the-badge&logo=meta&logoColor=white" alt="Groq Llama 3" />
  <img src="https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge" alt="License" />

  <br /><br />

  <!-- App Screenshot Showcase -->
  <a href="https://chess-mentor-gpt.vercel.app/">
    <img src="./image.png" alt="ChessMentorGPT Application Screenshot" width="850" style="border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
  </a>

  <br />
  <p><i>Click the image above to play live!</i></p>

</div>

---

## 🌟 Overview

**ChessMentorGPT** is a full-stack, real-time chess platform that pairs an interactive chessboard with an instant AI coach. By integrating **Llama 3 via the Groq LPU engine**, players receive grandmaster-level positional feedback, strategic breakdown, and game insights after every single move.

---

## 🔥 Key Features

| Feature | Description |
| :--- | :--- |
| 🧩 **Interactive Board** | Responsive drag-and-drop piece controls powered by `react-chessboard` and `chess.js`. |
| 🤖 **AI Coach Integration** | Real-time tactical analysis and strategy advice driven by Groq's high-speed Llama 3 API. |
| ⚡ **Quick-Prompt Chips** | One-click analysis triggers for opening advice, pawn structure, or endgame evaluation. |
| 📱 **Mobile First Design** | Custom media queries ensuring fluid responsiveness on smartphones, tablets, and desktop screens. |
| ⚡ **Decoupled Architecture** | Microservice structure separating the Vercel frontend from the Render backend. |

---

## 🛠️ Tech Stack & Architecture

```text
 ┌────────────────────────────────┐         ┌────────────────────────────────┐
 │   React (Vite) Frontend        │  HTTP   │   Python / Groq API Backend    │
 │   Hosted on Vercel             ├────────►│   Hosted on Render             │
 │   (chessmentorgpt.vercel.app)  │  POST   │   (chessmentorgpt-backend...)  │
 └────────────────────────────────┘         └────────────────────────────────┘