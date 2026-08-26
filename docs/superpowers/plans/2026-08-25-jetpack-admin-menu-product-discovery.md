# Jetpack Admin Menu Product Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Jetpack menu editor expose a clear Active menu and an Inactive product catalog, support contextual activation, and alphabetize each product section without moving separators or protected destinations.

**Architecture:** Extend the admin-menu model with a stable My Jetpack product slug and a registered-state marker, then return the recommended product catalog merged with the menu items registered on the current request. Keep product-state classification and sequence manipulation in pure TypeScript helpers. The Customize screen consumes the existing My Jetpack product/module queries, renders only current `@wordpress/ui` primitives, optimistically inserts newly activated products into the active sequence, and preserves saved preferences for products that are not in the visible draft.

**Tech Stack:** PHP 7.2-compatible WordPress code, React/TypeScript, `@wordpress/ui`, React Query-backed My Jetpack hooks, Jest/Testing Library, PHPUnit/WorDBless, SCSS modules.

---

### Task 1: Expose a complete, state-aware menu catalog

**Files:**
- Modify: `projects/packages/admin-ui/tests/php/Admin_Menu_Test.php`
- Modify: `projects/packages/admin-ui/src/class-admin-menu.php`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/types.ts`

- [ ] Add PHP assertions that the customization model contains both registered and recommended product-backed items, reports `registered: true` only for real registrations, and reports mappings such as `forms -> jetpack-forms`, `ai -> jetpack-ai`, and `akismet-anti-spam -> anti-spam`.
- [ ] Run the Admin UI PHP suite and confirm the new assertions fail:
  `jp test php packages/admin-ui`
- [ ] Add `product_slug` defaults to known product-backed menu metadata, normalize it with `sanitize_key`, and expose it as nullable `productSlug` in the UI model.
- [ ] Mark recommended catalog records as unregistered, real records as registered, and merge catalog plus registered records by stable item ID so actual labels/slugs replace catalog placeholders while unknown third-party registered items remain present.
- [ ] Add `productSlug?: string` and `registered: boolean` to `AdminMenuItem` and update fixtures.
- [ ] Re-run the Admin UI PHP suite until green:
  `jp test php packages/admin-ui`

### Task 2: Classify active and inactive products without losing menu preferences

**Files:**
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/product-catalog.ts`
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/product-catalog.test.ts`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/menu-sequence.ts`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`

- [ ] Write table-driven tests for active product statuses, inactive statuses, module-state overrides, registered non-product destinations, and alphabetical inactive rows.
- [ ] Write sequence tests proving a newly active product with no saved order enters immediately after the upper base separator, while a reactivated saved product returns to its prior position.
- [ ] Write a serialization test proving preferences for inactive products survive a save by merging the visible draft into the previous resolved layout.
- [ ] Run the two focused Jest files and confirm failures:
  `pnpm --filter @automattic/jetpack-my-jetpack test -- --runInBand _inc/components/my-jetpack-tab-panel/customize/test/product-catalog.test.ts _inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`
- [ ] Implement pure helpers to classify catalog items from product/module status, return `{ activeItems, inactiveItems }`, and merge newly activated items into the active list.
- [ ] Update `buildMenuSequence` ordering so unsaved newly activated products precede saved/custom-positioned nodes while the untouched default remains alphabetical.
- [ ] Extend `serializeDraftLayout(sequence, previousLayout)` so non-visible item preferences are retained and only the visible product/separator region is updated.
- [ ] Re-run the focused Jest files until green.

### Task 3: Alphabetize each separator-delimited section

**Files:**
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/menu-sequence.ts`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`

- [ ] Add failing tests showing `alphabetizeMenuSections` sorts every contiguous product run independently, includes hidden items, and leaves base/custom separators, My Jetpack, Settings, and off-site entries in their exact slots.
- [ ] Run the focused sequence test and verify red.
- [ ] Implement `alphabetizeMenuSections(sequence)` as a pure pass that buffers sortable product nodes until a separator/protected node, locale-sorts the buffer, writes it back, and normalizes product-region order values.
- [ ] Re-run the focused test until green.

### Task 4: Build the Active/Inactive editor and direct product actions

**Files:**
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/content.tsx`
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/inactive-product-row.tsx`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/styles.module.scss`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/editor.test.tsx`

- [ ] Extend the `@wordpress/ui` Jest mock with `Tabs` and `Badge`, mock product/module/activation/navigation hooks, and add failing editor tests for: Active default tab, alphabetical Inactive rows, absence of drag/visibility controls in Inactive, activating an eligible product, switching back to Active, highlighting the inserted product, Learn more for products requiring prerequisites, error feedback, and the section-aware alphabetize action.
- [ ] Run the focused editor test and verify red:
  `pnpm --filter @automattic/jetpack-my-jetpack test -- --runInBand _inc/components/my-jetpack-tab-panel/customize/test/editor.test.tsx`
- [ ] Read products with `useAllProducts` and modules with `useAllJetpackModules`; merge REST refreshes with the prior model so accurate registered menu labels/slugs from the initial admin request are not replaced by catalog placeholders.
- [ ] Render `Tabs.Root/List/Tab` for Active and Inactive. Keep the sortable menu editor, separator controls, alphabetize action, live preview, dirty state, and save actions only in Active.
- [ ] Implement an inactive product row using only current `@wordpress/ui` components. Use the existing activation mutation for immediately activatable products; otherwise route to the existing My Jetpack product interstitial with a Learn more action, or show an unavailable status when the module/product cannot be changed.
- [ ] On activation success, refetch product state, mark the item active locally, rebuild the menu sequence, select Active, focus/highlight the inserted row, and show a dismissible current `Notice` success message. On failure, keep Inactive selected and show a current `Notice` error message.
- [ ] Add the `Alphabetize sections` button to Active and announce the change through the existing live region; applying it must update the sidebar preview immediately and require an explicit save.
- [ ] Add compact responsive styles for the tab header, inactive product rows, status/action column, and temporary highlight, using logical CSS properties and existing WPDS variables.
- [ ] Re-run the editor test until green.

### Task 5: Make activation elsewhere discover the editor

**Files:**
- Modify: `projects/packages/my-jetpack/_inc/data/products/use-activate-plugins.ts`
- Modify: `projects/packages/my-jetpack/_inc/data/products/test/use-activate-plugins.test.tsx`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/products/pending-notice.ts`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/products/test/pending-notice.test.ts`

- [ ] Add failing tests asserting successful activation notices include a `Customize menu` action targeting the Customize route, and persisted reload notices retain that action.
- [ ] Run both focused hook tests and verify red.
- [ ] Add the notice action through the existing global notices API and extend pending-notice storage from a bare string to a backwards-compatible `{ message, customizeMenu }` record.
- [ ] Re-run the focused hook tests until green.

### Task 6: Changelog, quality gates, and production build

**Files:**
- Modify: `projects/packages/admin-ui/changelog/add-customizable-admin-menu`
- Modify: `projects/packages/my-jetpack/changelog/add-customizable-admin-menu`
- Modify: any files changed by project formatters, limited to this feature

- [ ] Update both existing changelog entries in imperative, user-facing language.
- [ ] Run Prettier/ESLint autofix for only the changed JS/TS/SCSS files, then inspect the diff for unrelated changes.
- [ ] Run the complete My Jetpack Jest suite:
  `jp test js packages/my-jetpack`
- [ ] Run My Jetpack and Admin UI PHP tests:
  `jp test php packages/my-jetpack`
  `jp test php packages/admin-ui`
- [ ] Run PHPCS and Phan for both packages using their package scripts or `jp phan packages/admin-ui packages/my-jetpack` where supported.
- [ ] Build Admin UI, My Jetpack, and Jetpack directly so the preview receives current assets:
  `jp build packages/admin-ui`
  `jp build packages/my-jetpack`
  `jp build plugins/jetpack`
- [ ] Review `git diff --check`, `git status --short`, and the complete diff; commit the implementation and changelog.

### Task 7: Live Jurassic verification and preview handoff

**Files:**
- No source changes expected; browser-discovered defects return to the relevant test-first task above.

- [ ] Confirm slot 3 health and branch placement with the Jurassic slot skill.
- [ ] Open My Jetpack's Customize tab in the in-app browser.
- [ ] Verify the Active view matches the real Jetpack submenu and live preview; verify the Inactive view is alphabetical, non-sortable, and exposes appropriate actions.
- [ ] Activate one safe eligible feature, confirm it moves into Active below My Jetpack, confirm focus/highlight and the sidebar preview, and restore the test site's prior state if needed.
- [ ] Add a separator, alphabetize sections, hide/show a row, save My menu, reload, and confirm the persisted order/visibility and current `@wordpress/ui` notices.
- [ ] Leave the authenticated Customize URL open and provide it as the live preview handoff.
