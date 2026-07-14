# Changelog

## v0.1.0 - Foundation

### Added
- Initial GitHub repository
- Firebase Authentication
- Firestore integration
- Overview dashboard
- Net worth calculation
- Cash and debt summary cards
- Weekly trend chart
- Top spending summary
- Bottom navigation

### Changed
- Separated HTML, CSS, and JavaScript into individual files.
- Established project documentation structure.

### Fixed
- Firebase login issue on GitHub Pages.

---

## v0.2.0 - Accounts

### Added
- Accounts page
- Cash and Debt cards
- Animated card transitions
- Edit Balance modal
- Responsive account layout

### Changed
- Replaced the Accounts placeholder with a functional interface.

### Added
- UI Guidelines documentation

#### v0.2.1 - Manage Account Balances

### Added
- Firestore-backed account editing
- Live account balance updates
- Shared account data model
- Balance validation
- Save state and error handling

### Changed
- Overview refreshes automatically after account updates.
- Account totals refresh immediately after saving.

### Documentation
- Added Product Identity document.

### Documentation
- Added Architecture document.

### Documentation
- Updated repository README.

## v0.3.3 - Plan UI Refinement

### Added
- Collapsible Plan sections
- Section-level progress indicators
- Persistent collapsed state

### Changed
- Improved visual hierarchy for expanded and collapsed cards
- Increased subcategory readability
- Balanced card layout for desktop
- Refined section header styling

# v0.4.0 — First Step

**Release Date:** July 2026

## Architect's Intent

Establish the reusable editing workflow that will become the foundation of Freedom Mode. This release introduces direct editing of planned amounts while maintaining a fast, intuitive user experience and preparing the application for planning sessions in future releases.

---

## Added

- Quick Edit for individual Monthly Plan categories.
- Mobile-friendly bottom sheet editor.
- Planned amount validation.
- Firestore persistence for planned amounts.
- Immediate recalculation of remaining category balances.
- Live updates for progress bars, section totals, and monthly totals.
- Visual confirmation after successful updates.
- Added `ARCHITECT_NOTES.md`.

---

## Changed

- Plan category rows are now directly editable.
- Established the reusable editing workflow for future Freedom Mode.
- Updated application assets to cache version 9.

---

## Fixed

- N/A

---

## Known Issues

- On some mobile devices, the on-screen keyboard can partially obscure the Save and Cancel buttons while editing planned amounts.
- Planned for resolution in a future UI enhancement release.

---

## Release Status

**Completed and Approved**

- ✅ Feature complete
- ✅ QA passed
- ✅ Firestore integration verified
- ✅ Mobile tested
- ✅ No console errors
- ✅ Ready for merge
