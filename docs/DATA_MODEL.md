# DATA_MODEL.md

# Firestore Data Model

This document describes the Firestore collections used by Financial Friday.

---

# Collections

## users

Stores user profile information.

---

## accounts

Stores financial account balances.

Examples

- Navy Federal
- Purdue Federal
- Capital One
- OneKey

---

## budget

Monthly planning information.

Structure

budget

└── monthlyBudget<br>
    └── months
            └── YYYY-MM

Fields

mb-fixed-rent-budgeted
mb-fixed-rent-actual

mb-purdue-groceries-budgeted
mb-purdue-groceries-actual

...

---

# Future Collections

transactions

stores imported transactions

goals

stores savings goals

debts

stores debt payoff information

planningSessions

stores Freedom Mode simulations before they are committed

reviews

stores historical Friday Reviews
