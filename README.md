# 🛡️ AI Disaster Rescue Planning System

A modern, interactive web-based simulator designed to visualize intelligent rescue planning using state-of-the-art AI search algorithms. This project demonstrates how algorithms like BFS, UCS, and A* can be applied to navigate complex disaster scenarios and find optimal paths to rescue victims.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Tech Stack](https://img.shields.io/badge/tech-Vanilla_JS-yellow)

## ✨ Features

-   **Interactive Grid Map**: A responsive 20x20 grid where you can design your own disaster scenarios.
-   **Intelligent Algorithms**:
    -   **Breadth-First Search (BFS)**: Guarantees the shortest path in unweighted environments.
    -   **Uniform Cost Search (UCS)**: Explores paths based on cumulative cost.
    -   **A\* Search**: Uses Manhattan distance heuristics for highly efficient goal-oriented navigation.
-   **Dynamic Tools**:
    -   🏠 **Rescue Base**: Define the starting point for rescue units.
    -   🆘 **Victim**: Set the target location for the rescue mission.
    -   🚧 **Blocked Roads**: Create obstacles and simulate collapsed infrastructure.
    -   🛣️ **Safe Roads**: Define traversable paths.
-   **Real-time Metrics**: Track simulation performance including time taken (ms), nodes explored, and total path length.
-   **Premium UI**: Glassmorphism-inspired design with a dynamic interactive network background.

## 🚀 Getting Started

### Prerequisites

No special installation is required! This is a pure frontend project.

### Running Locally

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ai-rescue-plan.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd ai-rescue-plan
    ```
3.  Open `index.html` in your favorite web browser.
    *   *Tip: Use a development server like VS Code's "Live Server" for the best experience.*

## 🛠️ Built With

-   **HTML5**: Semantic structure and Canvas for the background effect.
-   **Vanilla CSS**: Custom styling with CSS Variables, Flexbox, and Grid.
-   **Javascript**: Core logic for search algorithms and DOM manipulation.
-   **Google Fonts**: "Outfit" for modern typography.

## 📖 Algorithm Insights

### A* Search Algorithm
The A* algorithm is the highlight of this system. It combines the actual cost from the start node ($g(n)$) and an estimated cost to the goal ($h(n)$), typically using Manhattan distance on a grid:
$$f(n) = g(n) + h(n)$$
This allows it to "ignore" paths that are moving away from the target, making it much faster than BFS or UCS in most scenarios.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (or just use it freely!).

---
Developed with ❤️ by [Your Name/Handle]
