# Architecture

## Overview

Financial Friday follows a simple three-layer architecture:

```
User Interface
      │
      ▼
Application Logic
      │
      ▼
Firebase
```

The goal is to keep business logic separate from the user interface so new features can be added without rewriting existing code.

---

# Architecture Principles

- One source of truth for each type of data.
- UI should display data, not own data.
- Firebase is persistent storage.
- JavaScript objects are the application's working state.
- Every feature should follow the same data flow.

---

# Current Data Flow

```
Firebase
    │
    ▼
Load Data
    │
    ▼
Application State
(accountData)
    │
    ├──────────┐
    ▼          ▼
Overview   Accounts
```

When a balance changes:

```
User edits balance
        │
        ▼
Validation
        │
        ▼
Save to Firestore
        │
        ▼
Update accountData
        │
        ▼
Refresh UI
```

---

# Firestore Structure

```
budget
│
├── accounts
│     ├── navyFederal
│     ├── purdueFCU
│     ├── savorOne
│     └── oneKey
│
├── monthlyBudget
│     └── months
│
└── weeklyLog
      └── entries
```

---

# Current Application State

```
accountData
```

Future state objects:

```
budgetData
weeklyData
goalData
settingsData
```

Each state object should have a single responsibility.

---

# UI Components

Current reusable components:

- Cards
- Modal
- Buttons
- Metric Tiles
- Bottom Navigation

Future components should reuse these whenever possible.

---

# Code Organization

Current

```
app.js
styles.css
index.html
```

Future

```
js/
│
├── firebase.js
├── accounts.js
├── overview.js
├── budget.js
├── charts.js
├── ui.js
└── app.js
```

This refactor will happen only when the project grows enough to justify it.

---

# Naming Conventions

Variables

camelCase

```
accountData
monthlyBudget
weeklyTrend
```

Functions

Verb first

```
loadAccountData()
refreshOverview()
renderAccounts()
saveAccountBalance()
```

Constants

UPPER_CASE

```
ACCOUNT_DOC
EMPTY_ACCOUNTS
```

---

# Design Goals

The architecture should be:

- Easy to understand
- Easy to test
- Easy to extend
- Easy to maintain

New features should integrate into the existing architecture rather than introducing new patterns.

---

# Future Architecture

As Financial Friday grows, additional modules will include:

- Budget Engine
- Debt Planner
- Goals
- Financial Coach
- Reports
- Notifications

Each module should manage its own state while following the same architecture principles established above.
