# ADR-001 — Application Mode Architecture

**Status:** Accepted

**Date:** July 2026

---

# Context

Financial Friday is evolving from a traditional budgeting application into an interactive financial planning platform.

Upcoming features—including Freedom Mode, Reality Mode, scenario planning, and future AI-powered recommendations—require the application to support temporary financial simulations without affecting the user's real financial data.

Using individual feature flags throughout the application would increase complexity and make future development more difficult.

---

# Decision

Financial Friday will use a centralized **Application Mode** architecture.

The application will always operate in one of two primary modes:

- **Reality Mode**
- **Freedom Mode**

Every screen, component, and calculation will reference the current application mode rather than implementing its own feature-specific logic.

The application mode becomes the single source of truth for application behavior.

---

# Application State

```
Application State
│
├── Reality
│     └── Current Budget
│
└── Freedom
      ├── Planning Session
      ├── Pending Changes
      └── Financial Freedom Calculation
```

---

# Reality Mode

Reality Mode represents the user's actual financial data.

Characteristics:

- Reads directly from Firestore
- Displays current financial information
- Reflects committed monthly plans
- No temporary calculations

---

# Freedom Mode

Freedom Mode provides a safe environment for financial planning.

Characteristics:

- Uses a temporary Planning Session
- Does not immediately update Firestore
- Allows unlimited experimentation
- Calculates changes in financial freedom in real time
- Can be committed or discarded

---

# Benefits

## Centralized Logic

Application behavior is determined by one state instead of scattered conditional logic.

---

## Scalability

Future features naturally integrate into the existing architecture.

Examples:

- Compare Plans
- Saved Scenarios
- AI Recommendations
- Retirement Planning
- Debt Payoff Simulations

---

## Maintainability

Individual pages no longer need to know how planning works.

They simply request data from the active application mode.

---

## User Experience

The entire application behaves consistently while planning.

Visual indicators, calculations, summaries, and navigation all remain synchronized.

---

# Consequences

Positive:

- Cleaner architecture
- Easier future development
- Consistent application behavior
- Simplified feature implementation

Trade-offs:

- Requires an application-wide state manager
- Initial implementation is more complex than isolated feature flags

---

# Future Considerations

Potential future application modes may include:

- Scenario Comparison
- Advisor Mode
- AI Guidance
- Historical Analysis

The Application Mode architecture is designed to support these additions without major refactoring.

---

# Decision Summary

Financial Friday will manage user interaction through a centralized Application Mode architecture.

Reality Mode represents committed financial information.

Freedom Mode represents temporary planning sessions.

All application behavior will derive from the active mode rather than individual feature-specific conditions.

This decision establishes the architectural foundation for Chapter 2 and future planning capabilities.
