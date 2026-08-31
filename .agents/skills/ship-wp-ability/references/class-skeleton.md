# Registrar subclass skeleton

Two templates below — one for the plugin context (class lives under `projects/plugins/jetpack/src/abilities/`) and one for the package context (class lives under `projects/packages/<pkg>/src/abilities/`). The shape is identical; the namespace root differs.

Each template shows one **read** ability and one **write** ability so the annotation and permission contrasts are visible. Both demonstrate the consolidated shape — a filtered `get-<objects>` with optional single-id filter, and a declarative `set-<object>-<attribute>` state-setter. See `references/consolidation-heuristic.md` for why; don't split these into `list-` / `get-` / `activate-` / `deactivate-` atomic variants. Before copying the template, read `references/agent-ergonomics.md` for description, response-shape, pagination, and error-message guidance — the template gives you the skeleton; ergonomics makes it worth calling.

Canonical reference for the base class: `projects/packages/wp-abilities/src/class-registrar.php`. Canonical fixture examples: the `TestFixtureRegistrar`, `TestExplicitCategoryRegistrar`, and `TestEmptyRegistrar` classes at the bottom of `projects/packages/wp-abilities/tests/php/RegistrarTest.php`.

## What `Registrar` does for you

Do not re-implement any of this in the subclass:

- **Top-level feature gate** — reads `apply_filters( 'jetpack_wp_abilities_enabled', false )`. Default false: abilities roll out gradually, not on every site the moment the package loads.
- **Lifecycle hooks** — wires `wp_abilities_api_categories_init` and `wp_abilities_api_init`. Also handles the late-load case: if either action has already fired by the time `init()` is called, the corresponding registration runs synchronously rather than hooking.
- **Per-category / per-ability allow-listing** — every registration passes through `apply_filters( 'jetpack_wp_abilities_should_register', true, $type, $slug )` so site owners can gate individual slugs.
- **WP < 6.9 compatibility** — guards every call to `wp_register_ability_category()` and `wp_register_ability()` with `function_exists()`.
- **Category auto-injection** — if a spec in `get_abilities()` omits the `category` key, the base class injects `get_category_slug()`. Don't set `category` manually.

### When the category is registered upstream (preferred for site-wide abilities)

The skill steers you toward shared/core categories (e.g. `site`) when the abilities are general site management. In that case **you don't register the category** — WordPress core / wpcom already did. Override `register_category()` to a no-op:

```php
public static function get_category_slug(): string {
    return 'site';
}

// Required by the abstract parent but unused — the `site` category is
// already registered upstream so we don't re-declare it.
public static function get_category_definition(): array {
    return array(
        'label'       => __( 'Site', 'jetpack-<pkg>' ),
        'description' => __( 'Site-wide management abilities (registered upstream).', 'jetpack-<pkg>' ),
    );
}

// `Registrar::init()` still hooks this onto `wp_abilities_api_categories_init`;
// making it a no-op avoids "already registered" notices.
public static function register_category() {
    // No-op: `site` is registered upstream.
}
```

`register_abilities()` keeps its normal behavior. Ability slugs are still product-namespaced (`jetpack-backup/get-backup-overview`) — the category and the slug prefix are independent.

The subclass just needs the three abstract getters plus execute + permission callbacks.

## Plugin-context template

Path: `projects/plugins/jetpack/src/abilities/class-<name>-abilities.php`

```php
<?php
/**
 * Jetpack <Domain> Abilities Registration
 *
 * Registers Jetpack <domain-label> abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack <domain-label> abilities with the WordPress Abilities API.
 *
 * Exposes <one-line summary of what the abilities do> so AI agents can
 * <read/manage> <domain-label> through the standard `wp-abilities/v1` REST
 * surface.
 */
class <Name>_Abilities extends Registrar {

	public static function get_category_slug(): string {
		return 'jetpack-<name>';
	}

	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack <Domain-Label>',
			'description' => __( 'Abilities for <one-line purpose>.', 'jetpack' ),
		);
	}

	public static function get_abilities(): array {
		// One consolidated read + one declarative write. See references/consolidation-heuristic.md.
		$object_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'     => array( 'type' => 'string' ),
				'name'   => array( 'type' => 'string' ),
				'status' => array( 'type' => 'string' ),
			),
		);

		return array(
			// Consolidated read: slug/id is an OPTIONAL filter that returns a 0- or 1-element array.
			// Do NOT add a second `get-<object>` ability — the single-id case is handled here.
			'jetpack-<name>/get-<objects>' => array(
				'label'               => __( 'Get <objects>', 'jetpack' ),
				'description'         => __( 'Return zero or more <objects> as an array. Combine id/status/search filters to narrow the result. When id is provided, returns at most one element.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'id'     => array(
							'type'        => 'string',
							'description' => __( 'Return a single <object> by id. Unknown ids yield an empty array.', 'jetpack' ),
							'minLength'   => 1,
						),
						'status' => array(
							'type'        => 'string',
							'description' => __( 'Filter by status.', 'jetpack' ),
							'enum'        => array( 'active', 'inactive' ),
						),
						'search' => array(
							'type'        => 'string',
							'description' => __( 'Case-insensitive substring match against name.', 'jetpack' ),
							'minLength'   => 1,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $object_schema,
				),
				'execute_callback'    => array( __CLASS__, 'get_<objects>' ),
				'permission_callback' => array( __CLASS__, 'can_view_<objects>' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),

			// Declarative write: `set-<object>-<attribute>`, required state param, idempotent.
			// Do NOT ship a symmetric verb pair (activate/deactivate, enable/disable) — merge here.
			'jetpack-<name>/set-<object>-status' => array(
				'label'               => __( 'Set <object> status', 'jetpack' ),
				'description'         => __( 'Set the status of a single <object>. Idempotent: setting a <object> to its current status returns changed=false.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id', 'status' ),
					'properties'           => array(
						'id'     => array(
							'type'        => 'string',
							'description' => __( 'Identifier of the <object>.', 'jetpack' ),
							'minLength'   => 1,
						),
						'status' => array(
							'type'        => 'string',
							'description' => __( 'Desired status.', 'jetpack' ),
							'enum'        => array( 'active', 'inactive' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'id'      => array( 'type' => 'string' ),
						'status'  => array( 'type' => 'string' ),
						'changed' => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'set_<object>_status' ),
				'permission_callback' => array( __CLASS__, 'can_manage_<objects>' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for read abilities.
	 */
	public static function can_view_<objects>(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/**
	 * Permission check for write abilities.
	 */
	public static function can_manage_<objects>(): bool {
		return current_user_can( 'jetpack_manage_modules' )
			&& current_user_can( 'jetpack_activate_modules' );
	}

	/**
	 * Execute: unified read. Returns a 0- or 1-element array when `id` is provided,
	 * or the full filtered list otherwise. Shape is the same either way.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array
	 */
	public static function get_<objects>( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Single-id short-circuit.
		if ( isset( $input['id'] ) && is_string( $input['id'] ) && '' !== $input['id'] ) {
			$one = self::fetch_one_<object>( $input['id'] );
			return null === $one ? array() : array( $one );
		}

		// Full filtered list.
		$status_filter = isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status']
			? $input['status']
			: null;
		$search_filter = isset( $input['search'] ) && is_string( $input['search'] ) && '' !== $input['search']
			? mb_strtolower( $input['search'] )
			: null;

		$out = array();
		foreach ( self::fetch_all_<object>_ids() as $id ) {
			$one = self::fetch_one_<object>( $id );
			if ( null === $one ) {
				continue;
			}
			if ( null !== $status_filter && $one['status'] !== $status_filter ) {
				continue;
			}
			if ( null !== $search_filter
				&& false === mb_strpos( mb_strtolower( $one['name'] ), $search_filter )
			) {
				continue;
			}
			$out[] = $one;
		}
		return $out;
	}

	/**
	 * Execute: declarative state-setter. Idempotent — compares desired vs current.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function set_<object>_status( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Required-id validation: not empty(), so "0" remains a legal id.
		if ( ! isset( $input['id'] ) || ! is_string( $input['id'] ) || '' === $input['id'] ) {
			return new \WP_Error(
				'jetpack_<name>_missing_id',
				__( 'A <object> id is required.', 'jetpack' )
			);
		}
		if ( ! isset( $input['status'] ) || ! is_string( $input['status'] ) ) {
			return new \WP_Error(
				'jetpack_<name>_missing_status',
				__( 'A desired status is required.', 'jetpack' )
			);
		}

		$id      = $input['id'];
		$desired = $input['status'];
		$current = self::fetch_current_status( $id ); // string|null

		if ( null === $current ) {
			return new \WP_Error(
				'jetpack_<name>_invalid_id',
				__( 'Unknown <object>.', 'jetpack' )
			);
		}

		if ( $desired === $current ) {
			return array(
				'id'      => $id,
				'status'  => $current,
				'changed' => false,
			);
		}

		// ... domain logic to transition from $current to $desired ...

		return array(
			'id'      => $id,
			'status'  => $desired,
			'changed' => true,
		);
	}
}
```

## Package-context template

Path: `projects/packages/<pkg>/src/abilities/class-<name>-abilities.php`

Only two things change from the plugin template:

1. **Namespace** — `Automattic\Jetpack\<Pkg>\Abilities` instead of `Automattic\Jetpack\Plugin\Abilities`.
2. **Text domain** — the package's text domain (`jetpack-forms`, `jetpack-boost`, ...) instead of `jetpack`.

```php
<?php
/**
 * Jetpack <Pkg> <Domain> Abilities Registration
 *
 * @package automattic/jetpack-<pkg>
 */

namespace Automattic\Jetpack\<Pkg>\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;

class <Name>_Abilities extends Registrar {

	public static function get_category_slug(): string {
		return 'jetpack-<pkg>';
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'Jetpack <Pkg-Label>',
			'description' => __( 'Abilities for <one-line purpose>.', 'jetpack-<pkg>' ),
		);
	}

	public static function get_abilities(): array {
		return array(
			// ... same spec shape as plugin template ...
		);
	}

	// ... same permission + execute methods as plugin template ...
}
```

## Wiring template

Add one line to the host project's bootstrap (`class.jetpack.php` for the plugin, `Jetpack_<Pkg>::init_boot()` or equivalent for packages):

```php
\Automattic\Jetpack\Plugin\Abilities\<Name>_Abilities::init();
```

**Do not add a `require_once`.** The Jetpack plugin's `composer.json` uses `"autoload": { "classmap": ["src"] }`, which means Composer's classmap autoloader picks up every class under `projects/plugins/jetpack/src/` once `composer dump-autoload` has been run. Packages use PSR-4 autoload and behave the same way — the namespace-to-path mapping is enough.

If you see an older `require_once JETPACK__PLUGIN_DIR . 'src/abilities/class-<x>-abilities.php';` line next to an existing `::init()` call (e.g. `class.jetpack.php:758` for `Modules_Abilities`), it's redundant with the classmap and exists only to survive a stale autoloader. The correct fix for "class not found" after adding a new file is `composer dump-autoload`, not a `require_once` line.

## Anti-patterns to avoid

- **Don't write your own `init()` method.** `Registrar::init()` owns the lifecycle. Overriding it loses the filter gate, the `did_action()` late-load path, and the per-ability allow-list filter.
- **Don't add a `CATEGORY_SLUG` class constant just to reuse it in each spec.** `get_category_slug()` is the single source; base class auto-injects.
- **Don't set `'category' => self::CATEGORY_SLUG` on each ability spec.** Redundant with auto-injection.
- **Don't copy `projects/plugins/jetpack/src/abilities/class-modules-abilities.php` or `projects/packages/forms/src/abilities/class-forms-abilities.php` as a starting point.** Both predate `Registrar` and use the manual `add_action`/`did_action` pattern. Extend `Registrar` instead.
- **Don't rely on `input_schema` `default` values being present in `$input`.** The Abilities API does not inject them. Normalize at the top of each execute callback.
- **Don't use `empty()` to validate required string IDs.** `empty('0')` is true; the literal `'0'` is a legal ID string. Use `isset() && is_string() && '' !== $value`.
- **Don't ship `list-<objects>` + `get-<object>` as separate abilities.** Merge into one filtered `get-<objects>` with optional id. See `references/consolidation-heuristic.md`.
- **Don't ship verb pairs** (`activate-*` + `deactivate-*`, `enable-*` + `disable-*`, `publish-*` + `unpublish-*`). Merge into one `set-*-status` with a required state parameter. Always idempotent (no-op when desired == current).
- **Don't switch output shapes based on input** — an ability that returns a summary when called one way and a detail object when called another way is a trap. Pick one shape and stick with it; use an `expand`/`include` filter if you genuinely need two depths.
