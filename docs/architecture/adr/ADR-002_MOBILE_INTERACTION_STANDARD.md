# ADR-002 — Mobile Interaction Standard

**Status:** Accepted

**Date:** July 2026

---

# Context

Financial Friday is designed to be a mobile-first financial planning application.

Many user interactions—including editing planned amounts, planning sessions, confirmations, and future budgeting tools—will rely on bottom sheets, dialogs, and form inputs.

During development of v0.4.0, testing revealed that the on-screen keyboard could obscure primary action buttons on smaller devices.

Rather than treating this as an isolated bug, the project establishes a consistent interaction standard for all future mobile interfaces.

---

# Decision

Financial Friday will adopt a **Mobile Interaction Standard** that ensures every interactive surface remains fully usable while the software keyboard is visible.

This standard applies to all current and future features.

---

# Interaction Principles

## Always Reachable

Primary actions must always remain accessible.

Examples:

- Save
- Cancel
- Continue
- Commit
- Confirm

The user should never need to dismiss the keyboard to complete an action.

---

## Keyboard Awareness

Interactive surfaces must respond appropriately when the software keyboard appears.

Acceptable behaviors include:

- Expanding the bottom sheet
- Becoming scrollable
- Automatically repositioning content
- Adjusting for device safe areas

---

## Sticky Actions

Whenever practical, primary action buttons should remain pinned to the bottom of the interactive surface.

Content may scroll independently, but actions should remain visible.

---

## Comfortable Touch Targets

Interactive controls should maintain comfortable spacing regardless of keyboard visibility.

Buttons should never become difficult to reach because of screen size or keyboard placement.

---

## Consistency

Every dialog, bottom sheet, modal, and form should behave consistently.

Users should quickly learn how Financial Friday behaves without needing to adapt to different interaction patterns.

---

# Design Philosophy

Financial Friday prioritizes reducing friction.

The application should feel responsive, predictable, and comfortable on every supported device.

Users should remain focused on their financial decisions rather than the interface itself.

---

# Benefits

## Improved Accessibility

Users can complete tasks without unnecessary interaction with the keyboard.

---

## Better Mobile Experience

The application feels intentionally designed for phones rather than adapted from a desktop interface.

---

## Reusable Behavior

Future features inherit a consistent interaction model.

Examples include:

- Freedom Mode
- Reality Mode
- Planning dialogs
- Transaction editing
- Category management
- AI recommendations

---

# Consequences

Positive:

- More polished mobile experience
- Consistent interaction patterns
- Fewer usability defects
- Higher user confidence

Trade-offs:

- Additional implementation effort for dialogs and bottom sheets
- Requires testing across multiple screen sizes

---

# Implementation Guidelines

Interactive surfaces should:

- Remain fully usable while the keyboard is visible.
- Preserve visibility of primary actions.
- Support scrolling when content exceeds available space.
- Respect modern device safe areas.
- Maintain comfortable touch targets.

These guidelines become part of the project's UI standards and should be considered during feature development rather than as post-release fixes.

---

# Decision Summary

Financial Friday adopts a mobile-first interaction standard.

Interactive surfaces must remain fully usable while the software keyboard is visible.

Primary actions should never be obscured.

This decision establishes a consistent user experience for all current and future mobile interactions.
