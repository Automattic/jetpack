# Route Contract for Premium Analytics

This document defines the required contract for routes in
projects/packages/premium-analytics/routes

---

## Why This Exists

Routes are discovered from package.json metadata and lazy-loaded into the
full-page SPA shell.

A route is not valid unless BOTH metadata and implementation exist.

---

## Required Route Structure

Each route MUST live in:

routes/<route-name>/

Each route directory MUST contain:

* package.json
* stage.tsx

---

## Required package.json Metadata

Each route package.json MUST include:

* "private": true
* "name": "<unique-route-package-name>"
* "route": { "path": "<path>", "page": "jetpack-premium-analytics" }

Example:

{
"private": true,
"name": "_@jetpack-premium-analytics/dashboard-route",
"route": {
"path": "/dashboard",
"page": "jetpack-premium-analytics"
}
}

---

## Required stage.tsx Export

Each route MUST export:

stage()

Example:

import React from 'react';

export const stage = () => {
return <div>Example Route</div>;
};

---

## Path Rules

Routes MUST:

* use unique route.path values
* use leading slashes (e.g. /dashboard, /reports)
* map ONLY to page id jetpack-premium-analytics

Routes MUST NOT:

* duplicate another route path
* register a different page id
* omit the route metadata block
* rely on side effects instead of exporting stage()

---

## Route-to-Sidebar Consistency

If a route is navigable, sidebar items MUST match the route path.

Example:

* sidebar key: dashboard
* label: Dashboard
* path: /dashboard

---

## Adding a New Route (Agent Procedure)

1. Create directory under routes/<route-name>/
2. Add package.json with valid route metadata
3. Implement stage.tsx
4. Run build
5. Verify route loads in SPA
6. (Optional) Add sidebar entry

---

## Definition of Done

A route is complete ONLY if:

* metadata exists and is valid
* stage() is exported
* build succeeds
* route loads correctly
* no duplicate paths exist
* sidebar (if any) matches path
* loading / empty / error states defined (if data exists)

---

## Validation Rules

Agents MUST validate:

* JSON syntax in package.json
* valid TS/JS in stage.tsx
* stage() export exists
* no runtime errors

---

## Escalation Rules

Agents MUST request human review before:

* modifying existing route paths
* renaming routes used externally
* changing route.page
* adding dynamic routing
