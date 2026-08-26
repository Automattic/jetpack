# Jetpack Admin Menu Separators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace group-based Jetpack menu customization with a sortable personal menu editor that supports titled separators, previews changes in the live WordPress sidebar, and can publish the current arrangement as a site default.

**Architecture:** The admin-ui package owns persistence, sanitization, activation, ordering, and server-rendered separator decoration. My Jetpack owns a normalized draft sequence and a small DOM adapter that applies the draft to the already-rendered sidebar without network writes. Personal metadata activates customization for its owner independently of the site-default flag; administrators can publish the same complete snapshot to site scope.

**Tech Stack:** PHP 7.2-compatible WordPress APIs, PHPUnit/WorDBless, React/TypeScript, Jest and Testing Library, jQuery UI Sortable, `@wordpress/ui`, SCSS, Jetpack CLI, Jurassic Tube Docker.

---

## File map

- Modify `projects/packages/admin-ui/src/class-admin-menu.php`: schema sanitization, personal activation, sequence resolution, separator decoration, customization model.
- Modify `projects/packages/admin-ui/tests/php/Admin_Menu_Test.php`: PHP behavior and rendering coverage.
- Modify `projects/packages/admin-ui/src/admin-ui-upgrade-menu.scss`: replace group visuals with separator visuals used in the actual submenu and live preview.
- Modify `projects/packages/admin-ui/changelog/add-customizable-admin-menu`: describe the separator-based customized menu.
- Modify `projects/packages/my-jetpack/src/class-initializer.php`: keep REST capability boundary while accepting the new layout shape.
- Modify `projects/packages/my-jetpack/tests/php/Admin_Menu_Customization_Rest_Test.php`: separator persistence and site/user scope coverage.
- Create `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/types.ts`: shared model and sequence types.
- Create `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/menu-sequence.ts`: pure sequence building, ordering, movement, and serialization helpers.
- Create `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/live-preview.ts`: reversible WordPress sidebar DOM adapter.
- Rewrite `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/content.tsx`: `@wordpress/ui` editor, rows, save states, and preview lifecycle.
- Rewrite `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/styles.module.scss`: row, separator, dirty-state, responsive, and drag styles using logical properties.
- Expand `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`: sequence and component behavior.
- Create `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/live-preview.test.ts`: reversible DOM preview behavior.
- Modify `projects/packages/my-jetpack/changelog/add-customizable-admin-menu`: describe the simplified live-preview editor.
- Generate changed build artifacts through the normal project builds.

### Task 1: Replace the admin-ui layout schema and activation rules

**Files:**
- Modify: `projects/packages/admin-ui/tests/php/Admin_Menu_Test.php`
- Modify: `projects/packages/admin-ui/src/class-admin-menu.php`

- [ ] **Step 1: Write failing PHP tests for separators and personal activation**

Add tests that save a personal layout without a site default, assert `is_customization_active()` is true for that user, and assert separator sanitization:

```php
public function test_personal_layout_activates_customization_without_site_default() {
	wp_set_current_user( self::$admin_user_id );
	add_filter( Admin_Menu::CUSTOMIZATION_FEATURE_FILTER, '__return_true' );
	Admin_Menu::update_user_menu_layout(
		array(
			'items' => array( 'scan' => array( 'order' => 10 ) ),
		),
		self::$admin_user_id
	);

	$this->assertTrue( Admin_Menu::is_customization_active() );
}

public function test_menu_layout_sanitizes_custom_separators() {
	$layout = Admin_Menu::sanitize_menu_layout(
		array(
			'separators' => array(
				'Custom Section!' => array( 'title' => '<b>Protect</b>', 'order' => '30' ),
			),
		)
	);

	$this->assertSame(
		array(
			'custom-section' => array(
				'id' => 'custom-section',
				'title' => 'Protect',
				'order' => 30,
			),
		),
		$layout['separators']
	);
}
```

- [ ] **Step 2: Run the admin-ui PHP suite and verify RED**

Run: `jp test php packages/admin-ui`

Expected: FAIL because personal metadata does not activate customization and `separators` is not sanitized.

- [ ] **Step 3: Implement the new schema and active-scope check**

Change default layouts to `enabled`, `items`, and `separators`; retain tolerant reads of old `groups` data by ignoring it. Add a private user-layout existence helper and resolve active state as feature flag plus either personal metadata or active site default:

```php
private static function has_user_menu_layout( $user_id = 0 ) {
	$user_id = $user_id ? (int) $user_id : get_current_user_id();
	return $user_id > 0 && metadata_exists( 'user', $user_id, self::CUSTOMIZATION_USER_META );
}

public static function is_customization_active() {
	if ( ! self::is_customization_feature_enabled() ) {
		return false;
	}

	$layout = self::get_site_menu_layout();
	$active = self::has_user_menu_layout() || ! empty( $layout['enabled'] );
	return (bool) apply_filters( self::CUSTOMIZATION_ACTIVE_FILTER, $active, $layout );
}
```

Sanitize each custom separator with `sanitize_key()`, `sanitize_text_field()`, and integer order. Merge item preferences as before; choose the personal separator collection wholesale when personal metadata exists, otherwise choose site separators.

- [ ] **Step 4: Run the admin-ui PHP suite and verify GREEN**

Run: `jp test php packages/admin-ui`

Expected: PASS.

- [ ] **Step 5: Commit the schema and activation change**

```bash
git add projects/packages/admin-ui/src/class-admin-menu.php projects/packages/admin-ui/tests/php/Admin_Menu_Test.php
git commit -m "fix(admin-ui): activate personal menu layouts"
```

### Task 2: Resolve anchored menu ordering and separator decoration

**Files:**
- Modify: `projects/packages/admin-ui/tests/php/Admin_Menu_Test.php`
- Modify: `projects/packages/admin-ui/src/class-admin-menu.php`
- Modify: `projects/packages/admin-ui/src/admin-ui-upgrade-menu.scss`

- [ ] **Step 1: Replace grouped-order tests with failing sequence tests**

Cover these exact sequences:

```php
public function test_customized_menu_uses_alphabetical_products_between_anchors() {
	wp_set_current_user( self::$admin_user_id );
	add_filter( Admin_Menu::CUSTOMIZATION_FEATURE_FILTER, '__return_true' );
	Admin_Menu::update_site_menu_layout( array( 'enabled' => true ) );
	Admin_Menu::add_menu( 'Settings', 'Settings', 'manage_options', 'admin.php?page=jetpack#/settings', '__return_null', 1 );
	Admin_Menu::add_menu( 'Scan', 'Scan', 'manage_options', 'jetpack-scan', '__return_null', 2 );
	Admin_Menu::add_menu( 'Forms', 'Forms', 'edit_pages', 'jetpack-forms-admin', '__return_null', 3 );
	Admin_Menu::add_menu( 'My Jetpack', 'My Jetpack', 'edit_posts', 'my-jetpack', '__return_null', 4 );

	do_action( 'admin_menu' );

	$this->assertSame(
		array( 'my-jetpack', 'jetpack-forms-admin', 'jetpack-scan', 'admin.php?page=jetpack#/settings' ),
		$this->get_registered_submenu_slugs()
	);
	$this->assertSubmenuItemHasClass( 'jetpack-forms-admin', 'jetpack-admin-menu-separator-start' );
	$this->assertSubmenuItemHasClass( 'admin.php?page=jetpack#/settings', 'jetpack-admin-menu-separator-start' );
}
```

Add separate tests for no product/no base separators, a titled custom separator applied to the following item, an untitled custom separator with no label markup, Settings before Jetpack Manage and other external items, and saved item order overriding alphabetical fallback.

- [ ] **Step 2: Run the admin-ui PHP suite and verify RED**

Run: `jp test php packages/admin-ui`

Expected: FAIL against the current group-based resolver.

- [ ] **Step 3: Implement normalized ordering and visual separator markers**

Keep registration metadata backward-compatible, but stop using groups during customized resolution. Partition resolved visible items into `my-jetpack`, on-site product items, `settings`, and external items. Sort products by a saved order when present and otherwise by decoded label. Force Jetpack Manage before other external items. Merge custom separators into the product order scale and apply every separator to its following visible menu item.

Decorate the target item as:

```php
$classes[] = 'jetpack-admin-menu-separator-start';
if ( '' !== $separator['title'] ) {
	$menu_title = '<span class="jetpack-admin-menu-separator-label" aria-hidden="true">'
		. esc_html( $separator['title'] )
		. '</span><span class="jetpack-admin-menu-item-label">'
		. wp_kses_post( $menu_title )
		. '</span>';
}
```

Apply untitled protected base separators before the first visible on-site product and before Settings only when at least one visible product exists. Always add stable `jetpack-admin-menu-item-id-{id}` classes while the feature flag is enabled so the live preview can address current sidebar nodes even before customization is active.

Replace group SCSS with `.jetpack-admin-menu-separator-start` and `.jetpack-admin-menu-separator-label` selectors. Preserve the existing subtle divider, uppercase optional title, logical margins, and item-label block behavior.

- [ ] **Step 4: Run the admin-ui PHP suite and verify GREEN**

Run: `jp test php packages/admin-ui`

Expected: PASS.

- [ ] **Step 5: Build admin-ui assets**

Run: `jp build packages/admin-ui`

Expected: webpack completes and updates the built customization stylesheet.

- [ ] **Step 6: Commit resolver and rendering**

```bash
git add projects/packages/admin-ui
git commit -m "feat(admin-ui): render customizable menu separators"
```

### Task 3: Persist separator layouts through the REST endpoint

**Files:**
- Modify: `projects/packages/my-jetpack/tests/php/Admin_Menu_Customization_Rest_Test.php`
- Modify: `projects/packages/my-jetpack/src/class-initializer.php`

- [ ] **Step 1: Write failing REST tests**

Change the site-save test to post a complete layout with `enabled`, `items`, and `separators`, then assert the canonical response. Add a user-save test proving a personal layout returns `active: true` while the site layout remains disabled:

```php
$request->set_body_params(
	array(
		'scope' => 'user',
		'layout' => array(
			'items' => array( 'scan' => array( 'hidden' => true, 'order' => 20 ) ),
			'separators' => array(
				'custom-tools' => array( 'title' => 'Tools', 'order' => 10 ),
			),
		),
	)
);
```

- [ ] **Step 2: Run the My Jetpack PHP suite and verify RED**

Run: `jp test php packages/my-jetpack`

Expected: FAIL until the admin-ui model exposes the resolved separators and personal active state.

- [ ] **Step 3: Return the canonical separator-aware model**

Update `Admin_Menu::get_customization_model()` to include `separators` and `hasPersonalLayout`. Keep `Initializer::update_admin_menu_customization()` as the capability boundary; ensure site saves force `enabled => true` and user saves do not write `enabled`.

- [ ] **Step 4: Run the My Jetpack PHP suite and verify GREEN**

Run: `jp test php packages/my-jetpack`

Expected: PASS.

- [ ] **Step 5: Commit REST behavior**

```bash
git add projects/packages/my-jetpack/src/class-initializer.php projects/packages/my-jetpack/tests/php/Admin_Menu_Customization_Rest_Test.php
git commit -m "feat(my-jetpack): persist menu separators"
```

### Task 4: Build and test the normalized client sequence

**Files:**
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/types.ts`
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/menu-sequence.ts`
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`

- [ ] **Step 1: Write failing Jest tests for default and saved sequences**

Test that `buildMenuSequence()` produces My Jetpack, base separator, alphabetized products, base separator, Settings, Jetpack Manage, then other external items. Test that no base separators exist without products; custom separators retain titles and order; blank titles remain blank; move helpers cannot cross anchors; and serialization excludes base separators.

```ts
expect( buildMenuSequence( items, [] ).map( node => node.id ) ).toEqual( [
	'my-jetpack',
	'base-products-start',
	'ai',
	'forms',
	'base-products-end',
	'settings',
	'jetpack-manage',
] );
```

- [ ] **Step 2: Run the focused Jest test and verify RED**

Run: `node projects/packages/my-jetpack/node_modules/jest/bin/jest.js --config=projects/packages/my-jetpack/tests/jest.config.js projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts --runInBand`

Expected: FAIL because `types.ts`, `menu-sequence.ts`, and their exports do not exist.

- [ ] **Step 3: Implement the pure sequence helpers**

Define discriminated `MenuItemNode` and `MenuSeparatorNode` types. Implement `buildMenuSequence`, `reorderEditableNodes`, `moveEditableNode`, `addCustomSeparator`, `updateCustomSeparator`, `removeCustomSeparator`, `serializeDraftLayout`, and structural equality for dirty-state detection. Use stable IDs `custom-${Date.now()}-${counter}` only at the insertion boundary; pure helpers accept the generated ID.

- [ ] **Step 4: Run the focused Jest test and verify GREEN**

Run the Step 2 command.

Expected: PASS.

- [ ] **Step 5: Commit the client model**

```bash
git add projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize
git commit -m "feat(my-jetpack): model menu separators as sortable rows"
```

### Task 5: Add a reversible live sidebar preview

**Files:**
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/live-preview.ts`
- Create: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/live-preview.test.ts`

- [ ] **Step 1: Write failing DOM adapter tests**

Create a realistic `#toplevel_page_jetpack .wp-submenu` fixture with stable item-ID classes. Assert `apply()` reorders existing `<li>` nodes, hides unchecked products, adds separator classes and optional label spans to following items, leaves blank separators textless, and `restore()` returns order, display, classes, and anchor markup exactly.

- [ ] **Step 2: Run the focused preview test and verify RED**

Run: `node projects/packages/my-jetpack/node_modules/jest/bin/jest.js --config=projects/packages/my-jetpack/tests/jest.config.js projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/live-preview.test.ts --runInBand`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement `createJetpackMenuPreview()`**

Snapshot original node order plus each node's `hidden`, `className`, and anchor `innerHTML`. Address rows via `.jetpack-admin-menu-item-id-${CSS.escape(id)}` with a small escape fallback for test/older-browser safety. `apply(sequence)` restores the baseline first, appends item nodes in sequence order, hides draft-hidden items, and decorates the next visible item for separators. `restore()` is idempotent and never replaces nodes.

- [ ] **Step 4: Run the focused preview test and verify GREEN**

Run the Step 2 command.

Expected: PASS.

- [ ] **Step 5: Commit the preview adapter**

```bash
git add projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/live-preview.ts projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/live-preview.test.ts
git commit -m "feat(my-jetpack): preview menu drafts in the sidebar"
```

### Task 6: Replace the screen with the simplified WordPress UI editor

**Files:**
- Modify: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/test/content.test.ts`
- Rewrite: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/content.tsx`
- Rewrite: `projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize/styles.module.scss`

- [ ] **Step 1: Add failing component tests**

Render the screen with mocked initial state and REST calls. Assert the title and live-preview copy; absence of Recommended menu, group controls, Save defaults, and Use legacy menu; protected anchors and base separators; Add separator workflow; optional title editing; primary Save my menu; admin-only Set as site default; `@wordpress/ui` success/error notices; dirty status; and save payload scopes.

- [ ] **Step 2: Run the focused content test and verify RED**

Run the focused command from Task 4.

Expected: FAIL against the group-based screen.

- [ ] **Step 3: Implement the screen using only `@wordpress/ui` components**

Use:

```tsx
import { Button, Card, Checkbox, IconButton, InputControl, Notice, Stack, Text } from '@wordpress/ui';
```

Render `Card.Root`/`Card.Content`, `Notice.Root`/`Notice.Description`/`Notice.CloseIcon`, `Button` with `loading`, `IconButton` movement/removal controls, labelled `Checkbox` visibility controls, and `InputControl` separator titles. Keep jQuery UI Sortable for pointer dragging, but sort a unified list of editable products and custom separators. Apply the preview adapter in an effect on every draft change and restore it on an unsaved unmount.

Personal save posts `{ scope: 'user', layout: serializeDraftLayout(draft) }`. Site default posts `{ scope: 'site', layout: { ...serializeDraftLayout(draft), enabled: true } }`. Successful responses reset the clean baseline and keep the canonical preview; failures retain the draft.

- [ ] **Step 4: Implement focused SCSS**

Use one editor card, protected/normal/separator row variants, a compact unsaved badge, responsive control wrapping, visible focus, sortable placeholder/helper states, and logical properties. Remove all `.components-*` selectors and group-grid styles.

- [ ] **Step 5: Run focused and full JavaScript tests**

Run the focused command from Task 4, then:

`node projects/packages/my-jetpack/node_modules/jest/bin/jest.js --config=projects/packages/my-jetpack/tests/jest.config.js --runInBand`

Expected: all 22+ suites pass with no console errors.

- [ ] **Step 6: Run My Jetpack typecheck**

Run: `pnpm --dir projects/packages/my-jetpack typecheck`

If the executable bit issue recurs, run the package's TypeScript entry through Node using the resolved local binary. Expected: no TypeScript errors.

- [ ] **Step 7: Commit the UI**

```bash
git add projects/packages/my-jetpack/_inc/components/my-jetpack-tab-panel/customize
git commit -m "feat(my-jetpack): simplify menu customization UX"
```

### Task 7: Update changelogs and build production assets

**Files:**
- Modify: `projects/packages/admin-ui/changelog/add-customizable-admin-menu`
- Modify: `projects/packages/my-jetpack/changelog/add-customizable-admin-menu`
- Modify generated build artifacts for affected projects.

- [ ] **Step 1: Update the existing feature changelogs**

Use imperative user-facing entries:

```text
Admin menu: Add feature-flagged personal layouts with sortable separators.
```

```text
My Jetpack: Add a feature-flagged live-preview editor for personal and site-default Jetpack menus.
```

- [ ] **Step 2: Build affected projects and dependencies**

Run:

```bash
jp build packages/admin-ui
jp build packages/my-jetpack
jp build plugins/jetpack --deps
```

Expected: all builds complete without errors.

- [ ] **Step 3: Run PHP, JS, and static-analysis verification**

Run:

```bash
jp test php packages/admin-ui
jp test php packages/my-jetpack
node projects/packages/my-jetpack/node_modules/jest/bin/jest.js --config=projects/packages/my-jetpack/tests/jest.config.js --runInBand
jp phan packages/admin-ui
jp phan packages/my-jetpack
git diff --check
```

Expected: all commands pass; the direct Jest command bypasses the known non-executable local `.bin/jest` shim in this slot.

- [ ] **Step 4: Commit changelogs and builds**

```bash
git add projects/packages/admin-ui projects/packages/my-jetpack projects/plugins/jetpack
git commit -m "chore: build customizable Jetpack menu"
```

### Task 8: Deploy and verify the usable Jurassic Tube preview

**Files:**
- No source files unless browser verification exposes a defect, in which case return to the relevant TDD task.

- [ ] **Step 1: Confirm the feature flag and Docker services**

Verify `tools/docker/mu-plugins/pr-50066-admin-menu.php` still enables `jetpack_admin_menu_customization_enabled`, and confirm the `devin-3` Jurassic environment is healthy.

- [ ] **Step 2: Open the Customize tab as the logged-in administrator**

Use the Jurassic Tube browser workflow to reach My Jetpack → Customize. Confirm the page uses the new editor and current `@wordpress/ui` notices/components.

- [ ] **Step 3: Verify live preview and personal persistence**

Move a product, hide another, add an untitled separator, add a titled separator, and confirm the actual Jetpack submenu changes before saving. Save my menu, reload, and verify the same menu returns.

- [ ] **Step 4: Verify site-default persistence and edge states**

Set the arrangement as site default and verify a user without personal metadata receives it. Confirm no base separators appear when no on-site products are registered and exactly two untitled base separators appear when products are present.

- [ ] **Step 5: Verify discard behavior and capture the final preview URL**

Make another unsaved edit, navigate away, and confirm persisted order returns. Leave the Jurassic Tube site running and provide its wp-admin URL plus the exact navigation path to the user.

- [ ] **Step 6: Commit any TDD fixes found during browser verification**

If browser testing found defects, add failing automated tests first, fix them, rerun the full verification matrix, and commit with a scoped `fix(...)` message. If no defects were found, make no empty commit.
