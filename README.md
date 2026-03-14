<!-- Don't delete it -->
<div name="readme-top"></div>

<!-- Organization Logo -->
<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 16px;">
  <img alt="AOSSIE" src="public/aossie-logo.svg" width="175">
  <img src="public/todo-project-logo.svg" width="175" />
</div>

&nbsp;

<!-- Organization Name -->
<div align="center">

[![Static Badge](https://img.shields.io/badge/aossie.org/TODO-228B22?style=for-the-badge&labelColor=FFC517)](https://TODO.aossie.org/)

<!-- Correct deployed url to be added -->

</div>

<!-- Organization/Project Social Handles -->
<p align="center">
<!-- Telegram -->
<a href="https://t.me/StabilityNexus">
<img src="https://img.shields.io/badge/Telegram-black?style=flat&logo=telegram&logoColor=white&logoSize=auto&color=24A1DE" alt="Telegram Badge"/></a>
&nbsp;&nbsp;
<!-- X (formerly Twitter) -->
<a href="https://x.com/aossie_org">
<img src="https://img.shields.io/twitter/follow/aossie_org" alt="X (formerly Twitter) Badge"/></a>
&nbsp;&nbsp;
<!-- Discord -->
<a href="https://discord.gg/hjUhu33uAn">
<img src="https://img.shields.io/discord/1022871757289422898?style=flat&logo=discord&logoColor=white&logoSize=auto&label=Discord&labelColor=5865F2&color=57F287" alt="Discord Badge"/></a>
&nbsp;&nbsp;
<!-- Medium -->
<a href="https://news.stability.nexus/">
  <img src="https://img.shields.io/badge/Medium-black?style=flat&logo=medium&logoColor=black&logoSize=auto&color=white" alt="Medium Badge"></a>
&nbsp;&nbsp;
<!-- LinkedIn -->
<a href="https://www.linkedin.com/company/aossie/">
  <img src="https://img.shields.io/badge/LinkedIn-black?style=flat&logo=LinkedIn&logoColor=white&logoSize=auto&color=0A66C2" alt="LinkedIn Badge"></a>
&nbsp;&nbsp;
<!-- Youtube -->
<a href="https://www.youtube.com/@AOSSIE-Org">
  <img src="https://img.shields.io/youtube/channel/subscribers/UCKVVLbawY7Gej_3o2WKsoiA?style=flat&logo=youtube&logoColor=white%20&logoSize=auto&labelColor=FF0000&color=FF0000" alt="Youtube Badge"></a>
</p>

---

<div align="center">
<h1>AutoInitialIssues</h1>
</div>

**AutoInitialIssues** is a powerful GitHub Action designed to automatically populate new repositories with a set of well-defined, categorized initial issues. By leveraging both preset issue banks and AI-powered generation (via GitHub Models), it helps maintainers quickly set up their projects with standard tasks, specialized framework-specific issues, and project-specific requirements.

---

- **Tiered Execution Modes**: Choose between `preset` (fast), `prompt` (tailored), and `advanced` (expert) modes.
- **AI-Powered Generation**: Integrates with GitHub Models (GPT-4o) to generate issues based on your project description.
- **Extensive Issue Banks**: Access pre-defined issues for `frontend`, `backend`, `blockchain`, `ml`, `mobile`, and `devops`.
- **Framework Specification**: Supports specific frameworks like `nextjs` and `express` for more relevant task generation.
- **Categorization & Skills**: Filter issue generation based on specific project categories and developer skills.

---

## 💻 Tech Stack

TODO: Update based on your project

### Backend
- Node.js (v20+)
- GitHub Actions SDK (`@actions/core`, `@actions/github`)

### AI/ML
- GitHub Models API (GPT-4o)
- Custom Prompt Engineering for Issue Generation

---

## ✅ Project Checklist

TODO: Complete applicable items based on your project type

- [x] **The AI/ML components**:
   - [x] LLM/model selection (GPT-4o) and configuration are documented.
   - [x] Prompts and system instructions are version-controlled in `src/agent.js`.
   - [x] API keys (GitHub Token) and rate limits are managed via GitHub Actions.

---

## 🏗️ Architecture Diagram

TODO: Add your system architecture diagram here

```mermaid
graph TD
    subgraph Tiers [Execution Tiers]
        T1[Tier 1: preset]
        T2[Tier 2: prompt]
        T3[Tier 3: advanced]
    end

    subgraph Inputs [Input Handling]
        I1["Input<br/>preset: 'frontend-nextjs'"]
        I2["Input<br/>project_description: '...'"]
        I3["Input<br/>categories, skills, prompts..."]
    end

    subgraph Logic [Processing Logic]
        L1["Parse + resolve<br/>No AI — pure file lookup"]
        L2["GitHub Models AI<br/>Classify + filter via GITHUB_TOKEN"]
        L3["Multi-step AI pipeline<br/>GitHub Models + custom skills"]
    end

    T1 --> I1 --> L1
    T2 --> I2 --> L2
    T3 --> I3 --> L3

    Baseline["issues.json — mandatory baseline<br/>agent always includes default issues"]

    L1 --> Baseline
    L2 --> Baseline
    L3 --> Baseline

    Final["GitHub API ➔ issues created + self-destruct"]
    Baseline --> Final

    style T1 fill:#1b4a8a,color:#fff
    style T2 fill:#4b3a8a,color:#fff
    style T3 fill:#1b5a4a,color:#fff
    style I1 fill:#1b4a8a,color:#fff
    style I2 fill:#4b3a8a,color:#fff
    style I3 fill:#1b5a4a,color:#fff
    style Baseline fill:#8a5a1b,color:#fff
    style Final fill:#1b5a1b,color:#fff
```

You can create architecture diagrams using:
- [Draw.io](https://draw.io)
- [Excalidraw](https://excalidraw.com)
- [Lucidchart](https://lucidchart.com)
- [Mermaid](https://mermaid.js.org) (for code-based diagrams)

Example structure to include:
- Frontend components
- Backend services
- Database architecture
- External APIs/services
- Data flow between components

---

## 🔄 User Flow

TODO: Add user flow diagrams showing how users interact with your application

```
[User Flow Diagram Placeholder]
```

### Key User Journeys

1. **Preset Setup**:
   - User adds `AutoInitialIssues` to their workflow.
   - User specifies `mode: preset` and `preset: frontend-nextjs`.
   - Action creates standard issues for Next.js and base project setup.

2. **AI-Tailored Setup**:
   - User specifies `mode: prompt` and provides a `project_description`.
   - Action calls GitHub Models API to generate context-aware issues.
   - Action creates a tailored set of issues in the repository.

---

## �🍀 Getting Started

### Prerequisites

TODO: List what developers need installed

- Node.js 18+ / Python 3.9+ / Flutter SDK
- npm / yarn / pnpm
- [Any specific tools or accounts needed]

### Installation

TODO: Provide detailed setup instructions

### Configuration

Add the following step to your `.github/workflows/main.yml`:

```yaml
- name: Auto Create Initial Issues
  uses: AOSSIE-Org/AutoInitialIssues@v1
  with:
    mode: 'prompt'
    project_description: 'A task management application built with Next.js and Supabase'
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

#### Inputs

| Name | Description | Default |
|------|-------------|---------|
| `mode` | Execution mode: `preset`, `prompt`, or `advanced` | `preset` |
| `preset` | Preset string for Tier 1 (e.g., `frontend-nextjs`, `backend-express`) | - |
| `project_description` | Detailed description for AI generation (Required for `prompt`/`advanced`) | - |
| `project_template` | Hint for AOSSIE project template stack (e.g., `GIFT`, `AOSS`) | - |
| `categories` | Comma-separated categories to prioritize (e.g., `frontend,backend`) | - |
| `skills` | Comma-separated skills to emphasize (e.g., `React,Python`) | - |
| `max_issues` | Maximum number of issues to generate | `15` |
| `label_prefix` | Prefix to append to all generated issue labels | - |
| `github_token` | GitHub Token for API calls (Requires `issues: write` scope) | `${{ github.token }}` |

---

## 🛠️ How it Works

### 1. Mandatory Baseline
Every repository gets a set of foundational issues regardless of the mode selected. These include:
- **Set up project Code of Conduct**: Encouraging community standards.
- **Create Contributing Guidelines**: Helping new contributors get started.

### 2. Tiered Generation
- **Preset Mode**: Uses pre-defined JSON banks located in `issue-banks/`. It follows a `{category}-{framework}` naming convention.
- **Prompt/Advanced Mode**: Uses GitHub Models (GPT-4o) to intelligently select and adapt issues from the banks based on your `project_description`.

### 3. Issue Banks
The action maintains a library of issues categorized by area and framework:
- **Frontend**: `default`, `nextjs`
- **Backend**: `default`, `express`
- **Future Support**: Plans for `blockchain`, `ml`, `mobile`, and `devops`.

---

## 🚀 Getting Started

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/AOSSIE-Org/AutoInitialIssues.git
cd AutoInitialIssues
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Build & Test

```bash
npm run build
npm test
```

For more detailed setup instructions, please refer to our [Installation Guide](./docs/INSTALL_GUIDE.md).

#### 6. Run Tests

The project uses [Jest](https://jestjs.io/) for unit testing. Tests cover the parser, issue creation, AI agent, and the main entrypoint with all external calls mocked.

```bash
npm test
```

---

## 🙌 Contributing

⭐ Don't forget to star this repository if you find it useful! ⭐

Thank you for considering contributing to this project! Contributions are highly appreciated and welcomed. To ensure smooth collaboration, please refer to our [Contribution Guidelines](./CONTRIBUTING.md).

---

## ✨ Maintainers

TODO: Add maintainer information

- [Maintainer Name](https://github.com/username)
- [Maintainer Name](https://github.com/username)

---

## 📍 License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for details.

---

## 💪 Thanks To All Contributors

Thanks a lot for spending your time helping TODO grow. Keep rocking 🥂

[![Contributors](https://contrib.rocks/image?repo=AOSSIE-Org/TODO)](https://github.com/AOSSIE-Org/TODO/graphs/contributors)

© 2025 AOSSIE 
