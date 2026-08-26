# Jetpack Admin Menu Product Discovery Design

## Context

The separator-based **My menu** editor makes the active Jetpack submenu easy to reorder, but it does not clearly distinguish between a product being enabled and its menu item being visible. Hiding every inactive product also makes product discovery difficult and gives an administrator no obvious path from enabling a product to placing its menu item.

This design keeps menu organization focused on active products while adding an inactive-product discovery surface. It does not add inferred categories such as “Other,” and editor filters never become separators or sections in the saved WordPress menu.

## Goals

- Show a sortable menu containing only enabled Jetpack product menu items.
- Let users discover inactive products and, when permitted, activate them without leaving the Customize tab.
- Give activations elsewhere in My Jetpack a clear path back to menu customization.
- Provide one quick action that alphabetizes products independently inside every separator-defined section.
- Preserve the existing live preview, personal-menu save, site-default save, protected anchors, and optional separator titles.
- Use current `@wordpress/ui` components and compound notices throughout the screen.

## Non-goals

- Reintroducing product categories or a menu-group dropdown.
- Adding an “Other” section or automatically assigning a new product to a titled separator section.
- Making inactive products draggable or showing them in the live WordPress submenu.
- Changing product entitlement, purchase, or activation rules.

## Editor modes

The editor has a compact two-option status filter:

1. **Active** is the default. It shows the real sortable menu sequence, including My Jetpack, active product rows, custom and base separators, Settings, and registered off-site destinations. Existing visibility controls continue to determine whether an enabled product appears in the WordPress submenu.
2. **Inactive** shows product-backed menu items that are available to the site but are not currently enabled. These rows are a discovery list rather than a menu sequence: they have no drag handles, visibility controls, separators, or submenu preview nodes. Each row includes the product name, a concise description or status, and the existing contextual My Jetpack product action. The action is **Activate** when direct activation is permitted; products that require a purchase or another prerequisite retain the appropriate existing action. Users without activation permission see the product status without an activation control.

There is no combined “All” mode. Mixing inactive products into the ordered sequence would imply that they belong to a user-created section even though they do not appear in the menu.

The filter controls only the editor view. It is never serialized as menu data and does not alter separators.

## Product activation state

The Customize tab uses the same live product and module activation data that drives the existing My Jetpack product controls. A product is active when My Jetpack considers its plugin or module enabled, even if the product also needs attention, has an expiring entitlement, or has a connection error. A product is inactive when its plugin is absent or inactive, its module is disabled, or it still needs activation or a required plan.

Known product-backed menu items have an explicit product-slug mapping. Protected anchors and registered off-site destinations do not depend on product status. Off-site items appear only when registered for the current site; the fallback product catalog must not manufacture off-site destinations.

Product-query loading does not flash inactive products into the Active editor. Until current status is available, the server-rendered registered menu items are the temporary source of truth. If product status cannot be loaded, the active editor remains usable from that registered snapshot and the inactive discovery view shows a current `@wordpress/ui` error notice with a retry action.

## Activation flow

Activating from the Inactive view reuses My Jetpack's existing product activation mutations, prerequisites, and permission checks rather than introducing a second activation endpoint.

On success:

1. Product status is refetched through the shared My Jetpack product query.
2. The editor switches to Active.
3. The activated row is focused, highlighted temporarily, and announced through the existing live region.
4. A product with no saved position is inserted at the beginning of the product region, after the protected base separator below My Jetpack and before every custom separator. Multiple unpositioned active products are alphabetized there.
5. A previously positioned product returns to its saved position because the administrator already assigned it deliberately.
6. The live WordPress submenu preview gains the item immediately. The editor becomes dirty only when inserting the product changes the saved menu layout.

On failure, the product remains in Inactive and a dismissible current `@wordpress/ui` error notice explains that activation failed without losing menu edits.

When activation succeeds elsewhere in My Jetpack, the existing success feedback includes a **Customize menu** action. Following it opens the Customize tab; shared product-query data ensures the newly active item is already reflected there.

## Alphabetize sections

The Active toolbar includes one secondary action labeled **Alphabetize sections**. It is available whenever the active product region contains at least two sortable product rows.

A section is a contiguous run of active product rows bounded by a base or custom separator. Activating the action:

- Sorts product labels A–Z independently inside every section using the locale-aware label comparison already used by the default menu.
- Includes enabled rows hidden by their menu visibility checkbox so their future visible position remains predictable.
- Leaves My Jetpack, Settings, registered off-site items, every separator, and every separator title in place.
- Updates the live submenu preview immediately.
- Marks the draft as changed but does not persist until **Save my menu** or **Set as site default** is used.
- Announces the change through the screen-reader live region.

If there are no custom separators, the entire active product region is one section. Empty and single-item sections are unchanged.

Per-section buttons were rejected because they add repeated controls and visual noise. A display-only A–Z filter was rejected because it would not provide the requested quick way to improve the saved menu.

## Data and persistence

The admin-menu model exposes the product slug for product-backed menu items while retaining stable menu IDs. The editor combines three inputs:

- the admin-menu catalog and saved layout from the customization endpoint;
- the server-rendered set of registered menu items for the initial safe snapshot and off-site destinations;
- the shared live My Jetpack product query for active/inactive status.

Menu serialization continues to contain item order, menu visibility, and custom separators only. Product activation status is owned by the existing product APIs and is never copied into the menu layout.

Preferences for a temporarily inactive product must not be deleted merely because the row is absent from the Active view. Saving another menu change merges the visible draft into the existing layout so unavailable product preferences remain recoverable if the product is enabled again.

## Accessibility and component use

- The Active/Inactive control exposes the selected state and item counts accessibly.
- Activation loading state is attached to the individual product action and announced.
- Switching to Active after activation moves focus to the activated row without unexpected page scrolling.
- Drag-and-drop retains the existing keyboard move controls.
- Alphabetizing and activation changes are announced in the existing polite live region.
- Success, error, and retry notices use the current compound `Notice` API from `@wordpress/ui`; legacy WordPress component notices are not introduced.

## Testing

Pure sequence tests cover:

- filtering active and inactive product-backed items without affecting anchors or registered off-site destinations;
- placing multiple active items with no saved position before custom separators in alphabetical order;
- restoring an intentionally saved position;
- alphabetizing each separator-bounded section independently;
- keeping separators, hidden active items, Settings, and off-site destinations fixed;
- preserving unavailable product preferences during serialization.

Component tests cover:

- Active as the default mode and Inactive as a non-sortable discovery list;
- successful activation, status refetch, mode switch, focus, highlight, dirty state, and preview update;
- failed activation with a current WordPress UI notice and retained draft;
- the activation success link from other My Jetpack product surfaces;
- Alphabetize sections updating the draft and live preview without saving automatically;
- product-status loading and retry behavior.

PHP tests cover the product-slug field, catalog/registered-item boundaries, and persistence merging for inactive product preferences. Browser verification covers activation, section-aware alphabetizing, saving, reload persistence, submenu preview parity, keyboard controls, and a clean console.
