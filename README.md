# Brain-Boost Quiz : A modern Quiz Game Application 

![Lumina Quiz App Preview](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge) ![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS-yellow?style=for-the-badge) ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## 📖 Overview
The **SCT_WD_3 Quiz Game Application** (internally known as *Brain Boost Quiz*) is a modern, SaaS-grade, fully responsive quiz platform. Built as a top-tier internship project, it evaluates users on their technical and general knowledge through a highly interactive and premium user interface. 

The application utilizes a sleek glassmorphism aesthetic, advanced state management, and a robust scoring logic—all built entirely with Vanilla JavaScript without relying on external frontend frameworks.

## 🚀 Live Demo
You can experience the live application here:  https://sct-wd-3-dusky-seven.vercel.app/

---

## ✨ Key Features

- **Multiple Question Formats:** Fully supports Single-choice (MCQ), Multi-select (checkboxes), Fill-in-the-blanks, and True/False questions.
- **Advanced Navigation Grid:** Instantly jump to any question. Visual indicators show which questions are answered (Green), flagged for review (Purple), or currently active.
- **Dynamic Data Fetching:** Questions are dynamically fetched and randomized from a structured `questions.json` file.
- **Real-Time Timer:** A built-in 30-second timer per question that auto-submits when time expires.
- **Persistent Leaderboard:** Saves your top 10 scores, percentages, and exact timestamps locally using `localStorage`.
- **Premium UI/UX:** Features a modern glassmorphism design with an 8px grid system, custom ripple effects, floating animated background shapes, and smooth screen transitions.
- **Accessibility (a11y) & Audio:** Fully navigable via keyboard, complete with semantic ARIA labels, focus-visible states, and toggleable sound effects.
- **Theme Toggle:** Switch seamlessly between Dark Mode and Light Mode.

---

## 🛠️ Tech Stack

This project was developed strictly using core web technologies to demonstrate strong foundational frontend skills:
- **HTML5:** Semantic structure and accessibility.
- **CSS3:** Flexbox/Grid layouts, CSS Variables for theming, keyframe animations, and glassmorphism.
- **JavaScript (ES6+):** Modular namespace pattern for state management, DOM manipulation, asynchronous fetching, and local storage integration.

---

## 📂 Project Structure

```text
SCT_WD_3/
│
├── index.html         # Main HTML file structuring all application screens
├── style.css          # Extensive CSS for layout, theming, and animations
├── script.js          # Core logic (AppState, UIManager, StorageManager, etc.)
├── questions.json     # The datastore containing all quiz questions
└── README.md          # Project documentation
```

---

## 🧠 Architectural Highlights

The JavaScript codebase avoids spaghetti code by adopting a clean, modular namespace pattern. Key managers include:
- `AppState`: Manages current question indexes, user answers, and the final scoring logic.
- `UIManager`: Handles all DOM updates, screen transitions, and rendering of dynamic HTML elements.
- `StorageManager`: Safely reads and writes to `localStorage` for high scores and theme preferences.
- `GameController`: Acts as the central hub, binding events and coordinating between the managers.

---

## 👨‍💻 Author

**G VARUN**  
*Web Development Intern at Skill Craft Technology*  
Task 3 Submission
