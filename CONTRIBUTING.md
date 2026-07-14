# Contributing to Financial Friday

Welcome to the Financial Friday project!

This document defines the development workflow, coding standards, release process, and repository conventions used throughout the project.

---

# Development Environment

## Required Software

- Visual Studio Code
- Git for Windows
- GitHub Desktop
- ChatGPT Desktop
- Google Chrome

## Recommended VS Code Extensions

- Live Server
- Prettier
- GitHub Pull Requests

The repository includes shared VS Code workspace settings under:

```
.vscode/
```

---

# Repository Workflow

All development is performed using feature branches.

Never develop directly on `main`.

### Branch Naming

```
feature/v0.4.1-into-the-blue
feature/v0.4.2-import-plan
feature/v0.5.0-dashboard-refresh
```

---

# Development Process

1. Create a GitHub Issue.
2. Create a feature branch from `main`.
3. Implement the feature.
4. Test locally using Live Server.
5. Commit changes.
6. Push the branch.
7. Open a Pull Request.
8. Complete QA.
9. Merge into `main`.
10. Delete the feature branch.
11. Sync local `main`.

---

# Commit Message Convention

Financial Friday follows Conventional Commits.

## Features

```
feat: add Freedom Mode banner
```

## Bug Fixes

```
fix: correct remaining budget calculation
```

## Documentation

```
docs: update PRODUCT_IDENTITY
```

## Refactoring

```
refactor: simplify budget card rendering
```

## Styling

```
style: improve category spacing
```

## Tooling / Configuration

```
chore: standardize VS Code workspace
```

---

# Pull Requests

Each Pull Request should include:

- Summary
- Features Added
- Testing Completed
- Related Issue

Example:

```
Closes #5
```

---

# Testing Checklist

Before merging:

- Login works
- Firestore reads data
- Firestore writes data
- Mobile layout verified
- Desktop layout verified
- Progress bars update correctly
- Console contains no errors
- Existing functionality remains intact

---

# Documentation Requirements

Each release updates documentation as needed.

Possible documents include:

- CHANGELOG.md
- Release Notes
- ARCHITECT_NOTES.md
- DECISION_LOG.md
- UI_GUIDELINES.md
- FEATURE_BACKLOG.md

---

# Project Structure

```
financial-friday-app/
│
├── .vscode/
├── docs/
├── app.js
├── index.html
├── styles.css
└── README.md
```

As the application grows, additional folders (assets, css, js, etc.) may be introduced.

---

# Design Philosophy

Financial Friday is designed around four core principles.

## Clarity

Financial information should always be easy to understand.

## Speed

Users should accomplish common tasks with minimal effort.

## Consistency

Similar actions should behave the same throughout the application.

## Confidence

The application should help users feel in control of their finances rather than overwhelmed.

---

# Release Workflow

Every release follows the same process.

1. Complete development.
2. Perform QA testing.
3. Update documentation.
4. Create Pull Request.
5. Merge into `main`.
6. Update CHANGELOG.
7. Publish Release Notes.
8. Close associated issues.
9. Delete feature branch.

---

# Branch Protection

The `main` branch represents stable production-ready code.

Feature work should never be committed directly to `main`.

---

# Long-Term Vision

Financial Friday is being developed as a polished personal finance platform with a strong emphasis on usability, visual design, and thoughtful financial planning.

Every contribution should move the project closer to that vision.

# AI-Assisted Development

Financial Friday embraces AI-assisted software development.

### ChatGPT

Used for:

- Product planning
- Software architecture
- UX design
- Documentation
- Code review
- Release planning

### Visual Studio Code

Used for:

- Development
- Local testing
- Debugging

### GitHub Desktop

Used for:

- Branch management
- Commits
- Pull Requests

AI-generated code should always be reviewed, tested, and validated before merging into `main`.
