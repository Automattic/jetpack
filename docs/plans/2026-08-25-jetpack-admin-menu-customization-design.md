# Jetpack Admin Menu Customization UX Design

**Date:** 2026-08-25

**Status:** Approved interaction design; awaiting written-spec review

**Scope:** PR #50066, My Jetpack `Customize` tab, and Jetpack submenu rendering

## Summary

Replace the current group-based editor with one direct representation of the Jetpack submenu: an ordered list containing menu items and separators. Every edit previews immediately in the real Jetpack submenu. The primary action saves the current user's menu, while administrators get a clearly secondary action to publish the same arrangement as the site default.

This removes the conflict between category dropdowns and drag-and-drop ordering, makes the effect of each change visible before saving, and prevents site-wide settings from competing with the personal-menu workflow.

## Problem

The current screen combines two mental models:

- Each item has a group selected from a dropdown.
- The same item can be dragged into an arbitrary order.

It also combines two persistence scopes without making their consequences clear:

- **Save my menu** writes user metadata.
- **Save defaults** writes a site option and controls whether the customized renderer is active.

This produces several UX failures:

- A group assignment can contradict the visible drag order.
- Saving a personal menu can succeed without changing the rendered submenu because site-level activation is still disabled.
- `Recommended menu`, editable group labels, `Save my menu`, `Save defaults`, and `Use legacy menu` compete for attention.
- The editor offers no direct confirmation of how the WordPress admin submenu will look.
- The screen uses legacy `@wordpress/components` controls, including its old Notice API, despite `@wordpress/ui` being available in My Jetpack.

## Goals

- Make the editor's list the exact conceptual model of the rendered Jetpack submenu.
- Let users arrange items and separators with one drag-and-drop system.
- Preview edits immediately in the existing Jetpack submenu without persisting them.
- Make **Save my menu** the obvious primary action and ensure it activates the saved layout for that user.
- Let administrators publish the current arrangement as the site default through a distinct secondary action.
- Preserve protected anchors and safe ordering for required and off-site items.
- Use current `@wordpress/ui` components throughout this screen, including compound notices.
- Provide complete keyboard and screen-reader alternatives to pointer dragging.

## Non-goals

- Customizing WordPress menu sections outside the Jetpack submenu.
- Renaming registered Jetpack product items.
- Moving `My Jetpack`, `Settings`, or off-site items into unsupported positions.
- Adding product activation or connection controls to the menu editor.
- Persisting a draft or live preview before the user chooses a save action.

## Information Architecture

The tab remains **Customize**, and the editor itself is titled **Customize my Jetpack menu**. Supporting copy states: “Drag items and separators. Changes preview live.”

The screen contains one editor card with:

1. An unsaved-changes status.
2. The ordered menu sequence.
3. An **Add separator** action.
4. **Save my menu** as the primary action.
5. **Set as site default** as a secondary action shown only to administrators.

The existing Defaults fieldset, `Recommended menu` toggle, group-name inputs, group dropdowns, and competing `Save defaults` action are removed.

## Default Menu Sequence

The generated default depends on the currently registered and enabled menu items.

When at least one enabled on-site product item exists:

1. `My Jetpack` — protected and always first.
2. Untitled base separator — protected.
3. Enabled on-site product items — alphabetical by label until a user or site order has been saved.
4. Untitled base separator — protected.
5. `Settings` — protected.
6. `Jetpack Manage` — first enabled off-site item when registered.
7. Other enabled off-site items — after Jetpack Manage, retaining their registered order.

When no enabled on-site product items exist, including the disconnected state:

1. `My Jetpack`.
2. `Settings`.
3. `Jetpack Manage`, if registered.
4. Other enabled off-site items.

No base separators are generated in the second state. The conditional is based on enabled, registered on-site product items—not connection status alone—so the menu responds correctly as products become available or disappear.

## Menu Rows

### Protected item rows

`My Jetpack` and `Settings` are visible, non-hideable anchors. Their rows display a lock treatment and a short explanation such as “Always first” or “Always here.” They cannot be dragged.

`Settings` divides on-site product content from off-site destinations. Off-site items remain after it and cannot be dragged into the on-site product region.

### Product item rows

Each enabled product has one row containing:

- A drag handle.
- Its registered label.
- A visibility control.
- Keyboard-accessible move actions.

Reordering is constrained to the supported region between the two base separators. Hidden items remain represented in the editor so they can be re-enabled, but they are removed from the live submenu preview.

### Base separator rows

The two base separators are generated only when at least one enabled on-site product exists. They are untitled, protected, and not persisted as custom separators. In the editor they are identified as “Base separator”; in the real submenu they render only the divider.

### Custom separator rows

**Add separator** inserts a sortable separator row into the editable product region. A custom separator has:

- A stable generated ID.
- An optional title.
- A position in the unified sequence.
- Rename and remove actions.
- The same pointer and keyboard movement affordances as product rows.

A blank title renders only a divider. A non-empty title renders its sanitized text with the divider treatment. Removing a custom separator immediately removes it from both editor state and the live preview.

Custom separators cannot be moved above `My Jetpack`, below `Settings`, or into the off-site region.

## Editing and Live Preview

The client maintains a normalized draft sequence for the current session. Every visibility, ordering, insertion, rename, or removal change updates both the editor and the existing Jetpack submenu DOM immediately.

The preview adapter:

- Captures the original submenu state once when the editor mounts.
- Reuses existing registered submenu nodes for menu items so URLs, classes, and WordPress behavior remain intact.
- Reorders or hides those nodes according to the draft.
- Creates transient submenu nodes for separators.
- Never writes REST data while previewing.
- Restores the original submenu when the editor unmounts without a successful save. A full navigation naturally reconstructs the submenu from persisted server state.

The screen shows **Unsaved changes** whenever the draft differs from the last persisted model. After a successful save, the current sequence becomes the clean baseline. If saving fails, the preview and draft remain intact so the user can retry.

## Save Semantics

### Save my menu

This is always the primary action. It persists the current sequence and visibility choices to the current user's metadata.

A personal layout is sufficient to activate menu customization for that user. It must not depend on the site-default `enabled` flag. Resolution becomes:

1. Use the current user's saved layout when one exists.
2. Otherwise use the active site default when one exists.
3. Otherwise use the existing legacy menu outside the editor; opening the editor starts from the generated recommended draft.

Success uses an `@wordpress/ui` success notice with copy such as “My menu was saved.”

### Set as site default

This action is visible only to users with the existing site-default capability check. It persists the current arrangement as the site layout and activates it for users without a personal layout. It does not overwrite other users' saved personal menus.

The action is visually secondary and labeled by outcome, avoiding the ambiguous `Save defaults` wording. Success uses an `@wordpress/ui` success notice such as “Site default was updated.”

Both save actions submit an immutable snapshot of the draft, disable conflicting actions while pending, expose a loading state on the invoked button, and apply the returned canonical model only on success.

## Data Model

The persisted layout no longer needs groups. Items and custom separators share an order scale so the server and client can reconstruct one sequence.

Conceptually:

```ts
type MenuItemPreference = {
	hidden?: boolean;
	order?: number;
};

type MenuSeparator = {
	id: string;
	title: string;
	order: number;
};

type AdminMenuLayout = {
	enabled?: boolean; // Site scope only.
	items: Record< string, MenuItemPreference >;
	separators: Record< string, MenuSeparator >;
};
```

Base separators are derived and never stored in `separators`. Custom separator IDs are sanitized, scoped to the layout, and must not collide with registered menu item IDs.

The server sanitizes separator IDs, titles, and numeric order values. Unknown item preferences may remain stored so a temporarily unavailable product can recover its saved position later, but only currently registered items are returned for rendering.

Because this work is still feature-flagged and unreleased, the implementation may replace the group schema directly. The read path should nevertheless tolerate existing group-shaped data from earlier PR testing by ignoring `groups` and deriving the new default sequence when `separators` is absent.

## Server Rendering and Resolution

The admin-menu package becomes the source of truth for sequence resolution:

- Determine whether a personal layout exists independently of site activation.
- Select personal, site, or legacy scope using the precedence above.
- Generate conditional base separators after registered items are known.
- Sort enabled on-site products alphabetically only when no saved order exists.
- Apply saved item and custom-separator order together.
- Force `My Jetpack` first and `Settings` before all off-site items after resolution.
- Emit separator markup using dedicated classes and no clickable destination.
- Omit title markup entirely when the sanitized separator title is empty.

Newly registered products that are missing from a saved layout are inserted into the on-site product region using alphabetical fallback without disturbing the relative order of previously saved items. Newly registered off-site items are appended after Jetpack Manage according to registered order.

## WordPress UI Components

The Customize screen must not retain imports from legacy `@wordpress/components`. Use the current `@wordpress/ui` APIs available to My Jetpack:

- `Notice.Root`, `Notice.Title`, `Notice.Description`, and `Notice.CloseIcon` for load, save, and availability messages.
- `Card.Root` and `Card.Content` for the editor surface.
- `Button` and `IconButton` for primary, secondary, move, rename, remove, and drag-handle controls.
- `Checkbox` with an explicit accessible label for item visibility.
- `InputControl` for optional separator titles.
- `Stack`, `Text`, and `VisuallyHidden` for layout and accessible supporting text.
- Button `loading` and `loadingAnnouncement` for save progress instead of a legacy standalone spinner.

Custom SCSS should be limited to menu-editor structure and drag states, use WordPress design tokens where possible, and use logical CSS properties for RTL support.

## Notices and Error Handling

Notices use the compound `@wordpress/ui` Notice API and semantic intents:

- `info`: customization unavailable.
- `success`: personal menu or site default saved.
- `error`: initial model load or save failed.

Error notices explain what did not happen and preserve the draft. Dismissible notices include `Notice.CloseIcon` with a translated accessible label. Save failures do not reset the user's arrangement. Load failure disables editing because there is no trustworthy baseline.

## Accessibility

- The ordered rows are exposed as a labelled list.
- Every drag operation has equivalent Move up and Move down controls.
- Move buttons respect protected boundaries and announce the resulting position through `@wordpress/a11y`.
- Drag handles have accessible labels and are not the only way to reorder.
- Visibility checkboxes include the product name in their label.
- Separator title fields identify the separator's current position.
- Rename and remove controls are keyboard accessible and use explicit labels.
- Live submenu updates announce a concise summary without announcing every intermediate pointer movement.
- Focus remains on the operated row after reorder or deletion moves to the nearest surviving row.
- Divider-only separator markup is ignored by assistive technology; titled separators expose the title as non-interactive structural text.

## Responsive Behavior

On wide screens, the editor uses the normal My Jetpack content width while the actual WordPress sidebar remains the live preview. On narrow layouts, row controls wrap below the label without changing sequence. Primary and secondary save actions remain grouped, with the primary action first in reading and tab order.

## Testing Strategy

### PHP unit tests

- Personal layout activates customization for that user without a site default.
- Users without personal layouts receive the active site default.
- Legacy behavior remains when neither layout applies.
- Base separators appear only with at least one enabled on-site product.
- Product fallback order is alphabetical.
- `My Jetpack`, `Settings`, Jetpack Manage, and other off-site items preserve their required regions.
- Separator IDs, titles, and order values are sanitized.
- Empty separator titles produce divider-only markup.
- Custom separators survive site and user persistence round trips.
- Earlier group-shaped stored layouts are tolerated.

### REST tests

- User scope accepts items and custom separators and cannot modify site scope without capability.
- Site scope activates the saved default.
- Responses return the canonical resolved sequence.
- Invalid layout and separator payloads are rejected or sanitized consistently.

### React tests

- Default connected and disconnected states match the required sequences.
- Dragging and keyboard moves update the normalized draft.
- Protected anchors and base separators cannot move or hide.
- Custom separators can be added, titled, moved, renamed, and removed.
- Blank titles remain divider-only.
- Every draft edit updates the live preview adapter.
- Unmount restores an unsaved preview.
- Save actions send the correct scope and snapshot.
- Dirty, loading, success, and error states behave correctly.
- The screen renders only `@wordpress/ui` component APIs.

### Manual verification

- Verify pointer and keyboard workflows in LTR and RTL.
- Verify submenu links and current-item classes still behave after live reordering.
- Verify disconnected, connected-with-no-products, and multiple-product states.
- Verify personal and site-default behavior with separate administrator and non-administrator users.
- Verify leaving without saving restores persisted behavior.

## Rollout and Compatibility

The existing feature flag remains the outer availability gate. The schema and UX can evolve inside the flagged PR without migrating production data. The REST route and capability boundary remain stable, while payload fields change from groups to custom separators.

The implementation should update changelog entries for both `admin-ui` and `my-jetpack` if both projects change. Build artifacts, PHP tests, JavaScript tests, static analysis, and a Jurassic Tube browser pass are required before the PR is considered ready.

## Acceptance Criteria

- No category/group dropdowns or editable group labels remain.
- The editor and rendered Jetpack submenu show the same item/separator order while editing.
- Personal saves visibly affect the current user's Jetpack submenu without requiring a site-default toggle.
- Administrators can publish the current layout as the site default through a clearly secondary action.
- No base separators render when there are no enabled on-site product items.
- With enabled products, exactly two protected untitled base separators bracket the product region.
- Custom separators support optional titles and full add, move, rename, and remove workflows.
- `My Jetpack` is always first; `Settings` always precedes Jetpack Manage and other off-site items.
- Empty separator titles render no visible text.
- The Customize screen uses current `@wordpress/ui` components throughout, including compound notices.
- Pointer, keyboard, screen-reader, RTL, persistence, and live-preview behaviors are covered by tests.
