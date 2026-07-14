# FREEDOM_MODE.md

# Freedom Mode

## Purpose

Freedom Mode is the signature feature of Financial Friday.

Rather than editing numbers, users enter an interactive planning environment where they can safely explore financial decisions before committing them.

Nothing changes until the user selects **Commit Plan**.

Freedom Mode exists to answer one question:

> "What happens if I make this financial decision?"

---

# Philosophy

Freedom Mode transforms Financial Friday from a budgeting application into a financial decision platform.

Users should feel encouraged to experiment.

Planning should feel safe.

Every interaction should increase confidence.

---

# Entering Freedom Mode

Users enter Freedom Mode from a floating action button located in the upper-right corner of the application.

## Button

Appearance

- Floating
- Blue to green gradient
- Bold italic text
- Soft glow
- Premium appearance
- Always visible while not already in Freedom Mode

Text

Enter Freedom Mode

Selecting the button transitions the application into Freedom Mode.

---

# Transition Animation

Entering Freedom Mode should feel significant.

Animations

- Screen subtly darkens.
- Green theme transitions to blue.
- Cards animate smoothly.
- Progress bars brighten.
- Accent colors transition to Freedom Mode colors.
- Soft glow appears around the edge of the application.
- Persistent Freedom Mode banner slides into view.

The transition should take approximately 300–500 milliseconds.

---

# Freedom Mode Theme

Primary Color

Deep Sapphire Blue

Suggested

#0A0791

Accent

Silver

or

Soft Gold

Final accent color will be selected based on visual testing.

Green should not be used as the primary accent while Freedom Mode is active.

---

# Persistent Banner

A persistent banner remains visible across every page.

Purpose

Remind users they are safely experimenting.

Banner Text

Freedom Mode

Experiment safely.

Nothing changes until you Commit Plan.

Buttons

Commit Plan

Exit

The banner remains visible regardless of which navigation tab is selected.

---

# Navigation

Navigation does not change.

Users should already know where everything is located.

Only the purpose of each page changes.

---

# Overview

Normal Mode

Displays current financial position.

Freedom Mode

Displays projected financial position based on proposed changes.

Primary Message

You have increased your financial freedom by $XXX this month.

or

You have decreased your financial freedom by $XXX this month.

Supporting information should explain why.

---

# Accounts

Normal Mode

Displays current balances.

Freedom Mode

Displays

- Current Balance
- Projected Balance
- Difference

The purpose is to show how planning decisions affect available cash.

---

# Plan

Freedom Mode transforms the Plan page into a planning workspace.

Changes

- Every category becomes editable.
- Remaining values update live.
- Progress bars animate live.
- Section totals update live.
- Monthly totals update live.
- No Firestore updates occur until Commit Plan.

---

# Debt

Freedom Mode demonstrates opportunity.

Examples

Additional available cash

Suggested debt allocation

Projected payoff improvements

Interest savings

Future versions will include debt payoff simulations.

---

# Save Behavior

Freedom Mode never writes data automatically.

Selecting Commit Plan

- Saves changes to Firestore.
- Updates dashboard.
- Updates account projections.
- Updates plan values.
- Exits Freedom Mode.
- Returns application theme to Reality Mode.

---

# Exit Behavior

If no changes exist

Exit immediately.

If changes exist

Prompt

Discard planning changes?

Options

Keep Planning

Discard

Commit Plan

---

# Freedom Score

Future Enhancement

Freedom Mode will eventually calculate an overall Financial Freedom Score.

This score will represent the user's financial flexibility based on debt, savings, available cash, and monthly planning decisions.

---

# Future Enhancements

Import Previous Month

Scenario Comparison

Debt Simulations

Goal Planning

Purchase Advisor

AI Recommendations

Financial Forecasting

Friday Review Integration

---

# Design Principles

Freedom Mode should feel

- Premium
- Safe
- Encouraging
- Interactive
- Intelligent

It should never feel like editing a spreadsheet.

It should feel like exploring possibilities.

---

# Success Metric

A successful Freedom Mode session leaves the user feeling:

"I understand exactly what this decision will do before I commit to it."

That confidence is the purpose of Freedom Mode.
