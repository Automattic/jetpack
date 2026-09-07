<?php
/**
 * REST API endpoint for admin menus.
 *
 * @package automattic/jetpack
 * @since 9.1.0
 */

use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Menu
 */
class WPCOM_REST_API_V2_Endpoint_Admin_Menu extends WP_REST_Controller {

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'admin-menu';

	/**
	 *
	 * Set of core dashicons.
	 *
	 * @var array
	 */
	private $dashicon_list;

	/**
	 * Lazily-built map of `menu_slug => nav-model entry`, populated from the
	 * `Sidebar_Classifier` nav model when the public `wp-admin-sidebar` plugin
	 * is loaded on the host. `null` means we have not yet attempted to build
	 * the index for this request; an empty array means the classifier ran but
	 * produced no items (e.g., gating denied).
	 *
	 * @var array<string, array>|null
	 */
	private $sidebar_nav_index = null;

	/**
	 * Group rows from the classifier nav model. Sibling to
	 * `$sidebar_nav_index`; `null` when not built, empty array when no groups.
	 *
	 * @var array<string, array>|null
	 */
	private $sidebar_nav_groups = null;

	/**
	 * WPCOM_REST_API_V2_Endpoint_Admin_Menu constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to admin menus.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'read' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view menus on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the admin menu.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		/*
		 * Load the `Jetpack_Admin` class, since it's only loaded on admin requests (not on API requests), and this is where
		 * many Jetpack menus are registered. We don't need to run this on WPCOM because we replicate an admin request there.
		 *
		 * @see https://github.com/Automattic/jetpack/blob/dcdeb8fe772215b514bbbd6c4ddb38f6446e7ea1/projects/plugins/jetpack/load-jetpack.php#L61-L64
		 * @see https://github.com/Automattic/jetpack/blob/dcdeb8fe772215b514bbbd6c4ddb38f6446e7ea1/projects/plugins/wpcomsh/feature-plugins/masterbar.php#L29
		 */
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		}

		// All globals need to be declared for menu items to properly register.
		global $admin_page_hooks, $menu, $menu_order, $submenu, $_wp_menu_nopriv, $_wp_submenu_nopriv; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		require_once ABSPATH . 'wp-admin/includes/admin.php';
		require_once ABSPATH . 'wp-admin/menu.php';

		return rest_ensure_response( $this->prepare_menu_for_response( $menu ) );
	}

	/**
	 * Prepares the admin menu for the REST response.
	 *
	 * @param array $menu Admin menu.
	 * @return array Admin menu
	 */
	public function prepare_menu_for_response( array $menu ) {
		global $submenu;

		// Best-effort hydration of the classifier nav model. Safe no-op when the
		// public `wp-admin-sidebar` plugin is not installed (non-WPCOM Jetpack).
		$this->maybe_build_sidebar_nav_index();

		$data = array();

		/**
		 * Note: if the shape of the API endpoint data changes it is important to also update
		 * the corresponding schema.js file.
		 * See: https://github.com/Automattic/wp-calypso/blob/ebde236ec9b21ea9621c0b0523bd5ea185523731/client/state/admin-menu/schema.js
		 */
		foreach ( $menu as $menu_item ) {
			$item = $this->prepare_menu_item( $menu_item );

			// Are there submenu items to process?
			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				$submenu_items = array_values( $submenu[ $menu_item[2] ] );

				// Add submenu items.
				foreach ( $submenu_items as $submenu_item ) {
					// As $submenu_item can be null or false due to combination of plugins/themes, its value
					// must be checked before passing it to the prepare_submenu_item method. It may be related
					// to the common usage of null as a "hidden" submenu item like was fixed in CRM in #29945.
					if ( ! is_array( $submenu_item ) ) {
						continue;
					}
					$submenu_item = $this->prepare_submenu_item( $submenu_item, $menu_item );
					if ( ! empty( $submenu_item ) ) {
						$item['children'][] = $submenu_item;
					}
				}
			}

			if ( ! empty( $item ) ) {
				$data[] = $item;
			}
		}

		$data = array_values( array_filter( $data ) );

		// When the public `wp-admin-sidebar` plugin is loaded (WPCOM and any
		// host that opts in), the response carries a sibling `groups[]` array
		// describing the synthetic group rows the classifier emitted. Wrapping
		// only happens when classifier data is available so non-WPCOM Jetpack
		// installs continue to receive the legacy flat-array shape.
		if ( null !== $this->sidebar_nav_groups ) {
			$data     = $this->order_sidebar_grouped_items( $data );
			$response = array(
				'menu'   => $data,
				'groups' => $this->prepare_groups_for_response(),
			);

			$layout_delta = $this->get_sidebar_layout_delta();
			if ( null !== $layout_delta ) {
				$response['layoutDelta'] = $layout_delta;
			}

			return $response;
		}

		return $data;
	}

	/**
	 * Hydrate the classifier-driven nav index from the public
	 * `wp-admin-sidebar` plugin. No-op when the plugin is not installed or
	 * gating denied building a model on this request.
	 */
	private function maybe_build_sidebar_nav_index() {
		if ( null !== $this->sidebar_nav_index ) {
			return;
		}

		if ( ! class_exists( 'Sidebar_Classifier' ) || ! class_exists( 'Sidebar_Signals' ) ) {
			return;
		}

		// Trigger a build if the classifier hasn't run yet on this request.
		// The classifier short-circuits when `wp_admin_sidebar_enabled` is
		// false, which is the default for any host that hasn't opted in.
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is provided by WPCOM's wp-admin-sidebar mu-plugin; guarded by class_exists() above.
		if ( null === Sidebar_Classifier::get_nav_model() ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is provided by WPCOM's wp-admin-sidebar mu-plugin.
			Sidebar_Classifier::build_nav_model();
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Sidebar_Classifier is provided by WPCOM's wp-admin-sidebar mu-plugin.
		$nav_model = Sidebar_Classifier::get_nav_model();
		if ( ! is_array( $nav_model ) ) {
			return;
		}

		$index   = array();
		$collect = function ( array $items ) use ( &$index, &$collect ) {
			foreach ( $items as $position => $item ) {
				if ( isset( $item['menuSlug'] ) && '' !== $item['menuSlug'] ) {
					if ( ! isset( $item['default_weight'] ) && ! isset( $item['_weight'] ) ) {
						$item['default_weight'] = (int) $position;
					}
					$parent_slug = array_key_exists( 'parent', $item ) && null !== $item['parent'] ? (string) $item['parent'] : null;
					$index[ $this->get_sidebar_nav_index_key( $item['menuSlug'], $parent_slug ) ] = $item;
					if ( ! isset( $index[ $item['menuSlug'] ] ) ) {
						$index[ $item['menuSlug'] ] = $item;
					}
				}
				if ( ! empty( $item['children'] ) && is_array( $item['children'] ) ) {
					$collect( $item['children'] );
				}
			}
		};

		if ( ! empty( $nav_model['top_level'] ) && is_array( $nav_model['top_level'] ) ) {
			$collect( $nav_model['top_level'] );
		}
		if ( ! empty( $nav_model['groups'] ) && is_array( $nav_model['groups'] ) ) {
			foreach ( $nav_model['groups'] as $group ) {
				if ( ! empty( $group['children'] ) && is_array( $group['children'] ) ) {
					$collect( $group['children'] );
				}
			}
		}

		$this->sidebar_nav_index  = $index;
		$this->sidebar_nav_groups = ! empty( $nav_model['groups'] ) && is_array( $nav_model['groups'] )
			? $nav_model['groups']
			: array();
	}

	/**
	 * Keep grouped items in the classifier's child order while preserving the
	 * relative position of ungrouped top-level rows. The public classifier
	 * sorts each group before exposing the nav model, but Calypso receives a
	 * flat `menu` array and buckets grouped items in response order.
	 *
	 * @param array $items Prepared top-level menu items.
	 * @return array Prepared items with grouped rows sorted per group.
	 */
	private function order_sidebar_grouped_items( array $items ) {
		$grouped_items = array();
		foreach ( $items as $item ) {
			if ( isset( $item['group_id'] ) && is_string( $item['group_id'] ) && '' !== $item['group_id'] ) {
				$grouped_items[ $item['group_id'] ][] = $item;
			}
		}

		if ( empty( $grouped_items ) ) {
			return $items;
		}

		foreach ( $grouped_items as &$group_items ) {
			usort(
				$group_items,
				static function ( $a, $b ) {
					$wa = (int) ( $a['default_weight'] ?? PHP_INT_MAX );
					$wb = (int) ( $b['default_weight'] ?? PHP_INT_MAX );
					if ( $wa === $wb ) {
						return strcmp( (string) ( $a['itemId'] ?? $a['slug'] ?? '' ), (string) ( $b['itemId'] ?? $b['slug'] ?? '' ) );
					}
					return $wa <=> $wb;
				}
			);
		}
		unset( $group_items );

		$group_offsets = array();
		foreach ( $items as $index => $item ) {
			if ( ! isset( $item['group_id'] ) || ! is_string( $item['group_id'] ) || '' === $item['group_id'] ) {
				continue;
			}

			$group_id = $item['group_id'];
			$offset   = $group_offsets[ $group_id ] ?? 0;
			if ( isset( $grouped_items[ $group_id ][ $offset ] ) ) {
				$items[ $index ] = $grouped_items[ $group_id ][ $offset ];
			}
			$group_offsets[ $group_id ] = $offset + 1;
		}

		return $items;
	}

	/**
	 * Look up the classifier nav-model entry for a given menu slug.
	 *
	 * @param string      $menu_slug   Menu slug as registered in `$menu` / `$submenu`.
	 * @param string|null $parent_slug Parent menu slug, or null for top-level items.
	 * @return array|null Nav-model entry or null if the slug is not in the index.
	 */
	private function get_sidebar_nav_entry( $menu_slug, $parent_slug = null ) {
		if ( null === $this->sidebar_nav_index || '' === $menu_slug ) {
			return null;
		}
		$key = $this->get_sidebar_nav_index_key( $menu_slug, $parent_slug );
		if ( isset( $this->sidebar_nav_index[ $key ] ) ) {
			return $this->sidebar_nav_index[ $key ];
		}
		return $this->sidebar_nav_index[ $menu_slug ] ?? null;
	}

	/**
	 * Compose an index key that distinguishes top-level rows from submenu rows
	 * sharing the same raw menu slug.
	 *
	 * @param string      $menu_slug   Menu slug as registered in `$menu` / `$submenu`.
	 * @param string|null $parent_slug Parent menu slug, or null for top-level items.
	 * @return string Index key.
	 */
	private function get_sidebar_nav_index_key( $menu_slug, $parent_slug = null ) {
		return ( null === $parent_slug ? '' : (string) $parent_slug ) . "\0" . (string) $menu_slug;
	}

	/**
	 * Build the schema-shaped `signal` subobject for an item from a classifier
	 * nav-model entry. Returns null when the entry has no signal data.
	 *
	 * The returned shape is fixed (all keys present, missing fields null) so
	 * Calypso can read it without optional-chaining gymnastics.
	 *
	 * @param array $nav_entry Classifier nav-model entry.
	 * @return array|null
	 */
	private function map_signal_from_nav_entry( array $nav_entry ) {
		if ( empty( $nav_entry['signal'] ) || ! is_array( $nav_entry['signal'] ) ) {
			return null;
		}
		$signal = $nav_entry['signal'];
		return array(
			'count'         => $signal['count'] ?? null,
			'numeric_badge' => $signal['numeric_badge'] ?? null,
			'badge'         => $signal['badge'] ?? null,
			'inline_text'   => $signal['inline_text'] ?? null,
			'inline_icon'   => $signal['inline_icon'] ?? null,
			'attention'     => ! empty( $signal['attention'] ),
		);
	}

	/**
	 * Attach classifier-derived `group_id` + `signal` fields to a prepared item.
	 * No-op when the classifier index is not available or the slug isn't found.
	 *
	 * @param array       $item        Prepared item (top-level or submenu).
	 * @param string      $menu_slug   Raw menu slug used to look up the nav entry.
	 * @param string|null $parent_slug Parent menu slug, or null for top-level items.
	 * @return array Item with fields possibly added.
	 */
	private function attach_sidebar_fields( array $item, $menu_slug, $parent_slug = null ) {
		$nav_entry = $this->get_sidebar_nav_entry( $menu_slug, $parent_slug );
		if ( null === $nav_entry ) {
			return $item;
		}

		// `default_group` in the classifier maps to `group_id` on the wire.
		$default_group    = $nav_entry['default_group'] ?? null;
		$item['group_id'] = is_string( $default_group ) && '' !== $default_group ? $default_group : null;
		$item['signal']   = $this->map_signal_from_nav_entry( $nav_entry );

		if ( isset( $nav_entry['itemId'] ) && '' !== $nav_entry['itemId'] ) {
			$item['itemId'] = (string) $nav_entry['itemId'];
		}
		if ( isset( $nav_entry['source'] ) && '' !== $nav_entry['source'] ) {
			$item['source'] = (string) $nav_entry['source'];
		}
		if ( isset( $nav_entry['reassignable'] ) ) {
			$item['reassignable'] = (bool) $nav_entry['reassignable'];
		}
		if ( isset( $nav_entry['default_weight'] ) ) {
			$item['default_weight'] = (int) $nav_entry['default_weight'];
		} elseif ( isset( $nav_entry['_weight'] ) ) {
			$item['default_weight'] = (int) $nav_entry['_weight'];
		}

		return $item;
	}

	/**
	 * Build the response-shape `groups[]` array from the cached classifier rows.
	 *
	 * Each element carries the group's stable id, label, default collapsed
	 * state and the aggregated signal that the classifier already computed.
	 *
	 * @return array
	 */
	private function prepare_groups_for_response() {
		if ( empty( $this->sidebar_nav_groups ) ) {
			return array();
		}

		$groups = array();
		foreach ( $this->sidebar_nav_groups as $group ) {
			if ( empty( $group['id'] ) ) {
				continue;
			}
			$signal   = isset( $group['signal'] ) && is_array( $group['signal'] ) ? $group['signal'] : array();
			$groups[] = array(
				'id'               => (string) $group['id'],
				'label'            => isset( $group['title'] ) ? (string) $group['title'] : '',
				'default_expanded' => false,
				'signal'           => array(
					'attention' => ! empty( $signal['attention'] ),
					'count'     => isset( $signal['count'] ) ? (int) $signal['count'] : 0,
				),
			);
		}
		return $groups;
	}

	/**
	 * Read the saved Calypso-compatible layout delta from the public plugin's
	 * storage adapter. Returns null when the public plugin storage API is not
	 * loaded, which keeps non-redesigned hosts on the legacy contract.
	 *
	 * @return array|null
	 */
	private function get_sidebar_layout_delta() {
		if ( ! interface_exists( 'Sidebar_Layout_Storage' ) || ! class_exists( 'WP_User_Meta_Storage' ) ) {
			return null;
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$site_id = (int) get_current_blog_id();
		$storage = $this->get_sidebar_layout_storage();
		$layouts = $storage->get_layouts( $user_id );

		if ( isset( $layouts[ $site_id ] ) && is_array( $layouts[ $site_id ] ) ) {
			return $this->normalize_sidebar_layout_delta( $layouts[ $site_id ] );
		}

		return $this->empty_sidebar_layout_delta();
	}

	/**
	 * Resolve the public plugin storage adapter. Mirrors Sidebar_Data_Planner.
	 *
	 * @return object
	 */
	private function get_sidebar_layout_storage() {
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- WP_User_Meta_Storage is provided by WPCOM's wp-admin-sidebar mu-plugin; guarded by class_exists() above.
		$default = new WP_User_Meta_Storage();
		$bound   = apply_filters( 'wp_admin_sidebar_storage', $default );
		$bound   = apply_filters_deprecated(
			'wpcom_admin_sidebar_storage',
			array( $bound ),
			'0.1.0',
			'wp_admin_sidebar_storage'
		);
		// @phan-suppress-next-line PhanUndeclaredClassInstanceof -- Sidebar_Layout_Storage is provided by WPCOM's wp-admin-sidebar mu-plugin; guarded by interface_exists() above.
		return $bound instanceof Sidebar_Layout_Storage ? $bound : $default;
	}

	/**
	 * Normalize a stored LayoutDelta into the response shape Calypso expects.
	 *
	 * @param array $delta Stored layout delta.
	 * @return array
	 */
	private function normalize_sidebar_layout_delta( array $delta ) {
		if ( ! isset( $delta['overrides'] ) || ! is_array( $delta['overrides'] ) ) {
			return $this->empty_sidebar_layout_delta();
		}

		return array(
			'version'    => isset( $delta['version'] ) ? (int) $delta['version'] : 1,
			'updated_at' => isset( $delta['updated_at'] ) ? (int) $delta['updated_at'] : 0,
			'overrides'  => array_values( $delta['overrides'] ),
		);
	}

	/**
	 * Empty-delta shape used when a redesigned host has no saved layout yet.
	 *
	 * @return array
	 */
	private function empty_sidebar_layout_delta() {
		return array(
			'version'    => 1,
			'updated_at' => 0,
			'overrides'  => array(),
		);
	}

	/**
	 * Retrieves the admin menu's schema, conforming to JSON Schema.
	 *
	 * Note: if the shape of the API endpoint data changes it is important to also update
	 * the corresponding schema.js file.
	 *
	 * @see https://github.com/Automattic/wp-calypso/blob/ebde236ec9b21ea9621c0b0523bd5ea185523731/client/state/admin-menu/schema.js
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		// Shape of the optional `signal` subobject attached to each item by the
		// public `wp-admin-sidebar` classifier (when loaded). Mirrors the snake
		// case shape produced by `Sidebar_Signals::map_to_nav` so Calypso can
		// consume one canonical field set end-to-end. All keys are present and
		// nullable; consumers don't need optional-chaining.
		$signal_schema = array(
			'description' => 'Per-item attention/count/badge data emitted by the wp-admin-sidebar classifier. Null when no signal data was extracted.',
			'type'        => array( 'object', 'null' ),
			'properties'  => array(
				'count'         => array( 'type' => array( 'integer', 'null' ) ),
				'numeric_badge' => array( 'type' => array( 'integer', 'null' ) ),
				'badge'         => array( 'type' => array( 'string', 'null' ) ),
				'inline_text'   => array( 'type' => array( 'string', 'null' ) ),
				'inline_icon'   => array( 'type' => array( 'string', 'null' ) ),
				'attention'     => array( 'type' => 'boolean' ),
			),
		);

		$submenu_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'count'          => array(
					'description' => 'Core/Plugin/Theme update count or unread comments count.',
					'type'        => 'integer',
				),
				'parent'         => array(
					'type' => 'string',
				),
				'slug'           => array(
					'type' => 'string',
				),
				'title'          => array(
					'type' => 'string',
				),
				'type'           => array(
					'enum' => array( 'submenu-item' ),
					'type' => 'string',
				),
				'url'            => array(
					'format' => 'uri',
					'type'   => 'string',
				),
				'itemId'         => array(
					'description' => 'Compound sidebar item id emitted by the wp-admin-sidebar classifier. Only present when the classifier is loaded.',
					'type'        => 'string',
				),
				'source'         => array(
					'description' => 'Classifier source kind, e.g. core, plugin, or wpcom. Only present when the classifier is loaded.',
					'type'        => 'string',
				),
				'default_weight' => array(
					'description' => 'Default ordering hint from the classifier. Only present when the classifier exposes it.',
					'type'        => 'integer',
				),
				'reassignable'   => array(
					'description' => 'Whether the sidebar customizer may move this item. Only present when the classifier is loaded.',
					'type'        => 'boolean',
				),
				'group_id'       => array(
					'description' => 'Group this submenu belongs to (e.g., "plugins"). Null for non-grouped items. Only present when the wp-admin-sidebar classifier is loaded.',
					'type'        => array( 'string', 'null' ),
				),
				'signal'         => $signal_schema,
			),
		);

		$menu_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'count'          => array(
					'description' => 'Core/Plugin/Theme update count or unread comments count.',
					'type'        => 'integer',
				),
				'icon'           => array(
					'description' => 'Menu item icon. Dashicon slug or base64-encoded SVG.',
					'type'        => 'string',
				),
				'inlineText'     => array(
					'description' => 'Additional text to be added inline with the menu title.',
					'type'        => 'string',
				),
				'inlineIcon'     => array(
					'description' => 'Dashicon slug to be displayed inline with the menu title.',
					'type'        => 'string',
				),
				'badge'          => array(
					'description' => 'Badge to be added inline with the menu title.',
					'type'        => 'string',
				),
				'slug'           => array(
					'type' => 'string',
				),
				'children'       => array(
					'type'  => 'array',
					'items' => $submenu_item_schema,
				),
				'title'          => array(
					'type' => 'string',
				),
				'type'           => array(
					'enum' => array( 'separator', 'menu-item' ),
					'type' => 'string',
				),
				'url'            => array(
					'format' => 'uri',
					'type'   => 'string',
				),
				'itemId'         => array(
					'description' => 'Compound sidebar item id emitted by the wp-admin-sidebar classifier. Only present when the classifier is loaded.',
					'type'        => 'string',
				),
				'source'         => array(
					'description' => 'Classifier source kind, e.g. core, plugin, or wpcom. Only present when the classifier is loaded.',
					'type'        => 'string',
				),
				'default_weight' => array(
					'description' => 'Default ordering hint from the classifier. Only present when the classifier exposes it.',
					'type'        => 'integer',
				),
				'reassignable'   => array(
					'description' => 'Whether the sidebar customizer may move this item. Only present when the classifier is loaded.',
					'type'        => 'boolean',
				),
				'group_id'       => array(
					'description' => 'Group this top-level item belongs to (e.g., "plugins"). Null for non-grouped items. Only present when the wp-admin-sidebar classifier is loaded.',
					'type'        => array( 'string', 'null' ),
				),
				'signal'         => $signal_schema,
			),
		);

		$group_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'               => array( 'type' => 'string' ),
				'label'            => array( 'type' => 'string' ),
				'default_expanded' => array( 'type' => 'boolean' ),
				'signal'           => array(
					'type'       => 'object',
					'properties' => array(
						'attention' => array( 'type' => 'boolean' ),
						'count'     => array( 'type' => 'integer' ),
					),
				),
			),
		);

		$layout_delta_schema = array(
			'description' => 'Saved per-user sidebar layout delta. Only present when the wp-admin-sidebar storage API is loaded.',
			'type'        => array( 'object', 'null' ),
			'properties'  => array(
				'version'    => array( 'type' => 'integer' ),
				'updated_at' => array( 'type' => 'integer' ),
				'overrides'  => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'itemId'   => array( 'type' => 'string' ),
							'position' => array(
								'type'       => 'object',
								'properties' => array(
									'kind'     => array(
										'type' => 'string',
										'enum' => array( 'top_level', 'in_group' ),
									),
									'group_id' => array( 'type' => 'string' ),
									'index'    => array( 'type' => 'integer' ),
								),
							),
						),
					),
				),
			),
		);

		$legacy_response_schema = array(
			'description' => 'Legacy flat admin menu response used when the wp-admin-sidebar classifier is not loaded or not enabled.',
			'type'        => 'array',
			'items'       => $menu_item_schema,
		);

		$redesigned_response_schema = array(
			'description' => 'Wrapped admin menu response used when the wp-admin-sidebar classifier is loaded and enabled.',
			'type'        => 'object',
			'required'    => array( 'menu', 'groups' ),
			'properties'  => array(
				'menu'        => array(
					'description' => 'Top-level menu items.',
					'type'        => 'array',
					'items'       => $menu_item_schema,
				),
				'groups'      => array(
					'description' => 'Synthetic group rows describing the sidebar grouping shape. Empty array if no plugin items grouped.',
					'type'        => 'array',
					'items'       => $group_schema,
				),
				'layoutDelta' => $layout_delta_schema,
			),
		);

		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'Admin Menu',
			'type'    => array( 'array', 'object' ),
			'anyOf'   => array(
				$legacy_response_schema,
				$redesigned_response_schema,
			),
		);
	}

	/**
	 * Sets up a menu item for consumption by Calypso.
	 *
	 * @param array $menu_item Menu item.
	 * @return array Prepared menu item.
	 */
	private function prepare_menu_item( array $menu_item ) {
		global $submenu;

		$current_user_can_access_menu = current_user_can( $menu_item[1] );
		$submenu_items                = isset( $submenu[ $menu_item[2] ] ) ? array_values( $submenu[ $menu_item[2] ] ) : array();
		$has_first_menu_item          = isset( $submenu_items[0] );

		// Exclude unauthorized menu items when the user does not have access to the menu and the first submenu item.
		if ( ! $current_user_can_access_menu && $has_first_menu_item && ! current_user_can( $submenu_items[0][1] ) ) {
			return array();
		}

		// Exclude unauthorized menu items that don't have submenus.
		if ( ! $current_user_can_access_menu && ! $has_first_menu_item ) {
			return array();
		}

		// Exclude hidden menu items.
		if ( str_contains( $menu_item[4], 'hide-if-js' ) ) {
			// Exclude submenu items as well.
			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $menu_item[2] ] = array();
			}
			return array();
		}

		// Handle menu separators.
		if ( str_contains( $menu_item[4], 'wp-menu-separator' ) ) {
			return array(
				'type' => 'separator',
			);
		}

		$url         = $menu_item[2];
		$parent_slug = '';

		// If there are submenus, the parent menu should always link to the first submenu.
		// @see https://core.trac.wordpress.org/browser/trunk/src/wp-admin/menu-header.php?rev=49193#L152.
		if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
			$parent_slug        = $url;
			$first_submenu_item = reset( $submenu[ $menu_item[2] ] );
			$url                = $first_submenu_item[2];
		}

		$item = array(
			'icon'  => $this->prepare_menu_item_icon( $menu_item[6] ),
			'slug'  => sanitize_title_with_dashes( $menu_item[2] ),
			'title' => $menu_item[0],
			'type'  => 'menu-item',
			'url'   => $this->prepare_menu_item_url( $url, $parent_slug ),
		);

		$parsed_item = $this->parse_menu_item( $item['title'] );
		if ( ! empty( $parsed_item ) ) {
			$item = array_merge( $item, $parsed_item );
		}

		// Additive: authoritative top-level total from the central menu-badges
		// registry, when the package is loaded. Overlays any count parsed from
		// title markup above.
		if ( 'jetpack' === $menu_item[2] && class_exists( '\Automattic\Jetpack\Menu_Badges\Notification_Counts' ) ) {
			$registry_total = \Automattic\Jetpack\Menu_Badges\Notification_Counts::get_total();
			if ( $registry_total > 0 ) {
				$item['count'] = $registry_total;
			}
		}

		// Additive: classifier-derived `group_id` + `signal` for the redesigned
		// sidebar. Match key is the raw menu slug (`$menu_item[2]`), which is
		// what the public plugin's `Sidebar_Classifier` keys nav items by.
		$item = $this->attach_sidebar_fields( $item, $menu_item[2] );

		return $item;
	}

	/**
	 * Sets up a submenu item for consumption by Calypso.
	 *
	 * @param array $submenu_item Submenu item.
	 * @param array $menu_item    Menu item.
	 * @return array Prepared submenu item.
	 */
	private function prepare_submenu_item( array $submenu_item, array $menu_item ) {
		// Exclude unauthorized submenu items.
		if ( ! current_user_can( $submenu_item[1] ) ) {
			return array();
		}

		// Exclude hidden submenu items.
		if ( isset( $submenu_item[4] ) && str_contains( $submenu_item[4], 'hide-if-js' ) ) {
			return array();
		}

		$item = array(
			'parent' => sanitize_title_with_dashes( $menu_item[2] ),
			'slug'   => sanitize_title_with_dashes( $submenu_item[2] ),
			'title'  => $submenu_item[0],
			'type'   => 'submenu-item',
			'url'    => $this->prepare_menu_item_url( $submenu_item[2], $menu_item[2] ),
		);

		$parsed_item = $this->parse_menu_item( $item['title'] );
		if ( ! empty( $parsed_item ) ) {
			$item = array_merge( $item, $parsed_item );
		}

		// Additive: authoritative count from the central menu-badges registry,
		// when the package is loaded. Overlays any count parsed from title
		// markup above.
		if ( class_exists( '\Automattic\Jetpack\Menu_Badges\Notification_Counts' ) ) {
			$registry_count = \Automattic\Jetpack\Menu_Badges\Notification_Counts::get_for_menu( $submenu_item[2] );
			if ( $registry_count > 0 ) {
				$item['count'] = $registry_count;
			}
		}

		// Additive: classifier-derived fields. Same lookup contract as the
		// top-level branch above; submenu rows live under their own `menuSlug`
		// in the nav model.
		$item = $this->attach_sidebar_fields( $item, $submenu_item[2], $menu_item[2] );

		return $item;
	}

	/**
	 * Prepares a menu icon for consumption by Calypso.
	 *
	 * @param string $icon Menu icon.
	 * @return string
	 */
	private function prepare_menu_item_icon( $icon ) {
		$img = 'dashicons-admin-generic';

		if ( ! empty( $icon ) && 'none' !== $icon && 'div' !== $icon ) {
			$img = esc_url( $icon );

			if ( str_starts_with( $icon, 'data:image/svg+xml' ) ) {
				$img = $icon;
			} elseif ( str_starts_with( $icon, 'dashicons-' ) ) {
				$img = $this->prepare_dashicon( $icon );
			}
		}

		return $img;
	}

	/**
	 * Prepares the dashicon for consumption by Calypso. If the dashicon isn't found in a list of known icons
	 * we will return the default dashicon.
	 *
	 * @param string $icon The dashicon string to check.
	 *
	 * @return string If the dashicon exists in core we return the dashicon, otherwise we return the default dashicon.
	 */
	private function prepare_dashicon( $icon ) {
		if ( empty( $this->dashicon_set ) ) {
			$this->dashicon_list = include JETPACK__PLUGIN_DIR . 'jetpack_vendor/automattic/jetpack-masterbar/src/admin-menu/dashicon-set.php';
		}

		if ( isset( $this->dashicon_list[ $icon ] ) && $this->dashicon_list[ $icon ] ) {
			return $icon;
		}

		return 'dashicons-admin-generic';
	}

	/**
	 * Prepares a menu item url for consumption by Calypso.
	 *
	 * @param string $url         Menu slug.
	 * @param string $parent_slug Optional. Parent menu item slug. Default empty string.
	 * @return string
	 */
	private function prepare_menu_item_url( $url, $parent_slug = '' ) {
		// External URLS.
		if ( preg_match( '/^https?:\/\//', $url ) ) {
			// Allow URLs pointing to WordPress.com.
			if ( str_starts_with( $url, 'https://wordpress.com/' ) ) {
				// Calypso needs the domain removed so they're not interpreted as external links.
				$url = str_replace( 'https://wordpress.com', '', $url );
				// Replace special characters with their correct entities e.g. &amp; to &.
				return wp_specialchars_decode( esc_url_raw( $url ) );
			}

			// Allow URLs pointing to Jetpack.com.
			if ( str_starts_with( $url, 'https://jetpack.com/' ) ) {
				// Replace special characters with their correct entities e.g. &amp; to &.
				return wp_specialchars_decode( esc_url_raw( $url ) );
			}

			// Disallow other external URLs.
			if ( ! str_starts_with( $url, get_site_url() ) ) {
				return '';
			}
			// The URL matches that of the site, treat it as an internal URL.
		}

		// Internal URLs.
		$menu_hook   = get_plugin_page_hook( $url, $parent_slug );
		$menu_file   = wp_parse_url( $url, PHP_URL_PATH ); // Removes query args to get a file name.
		$parent_file = wp_parse_url( $parent_slug, PHP_URL_PATH );

		if (
			! empty( $menu_hook ) ||
			(
				'index.php' !== $url &&
				file_exists( WP_PLUGIN_DIR . "/$menu_file" ) &&
				! file_exists( ABSPATH . "/wp-admin/$menu_file" )
			)
		) {
			$admin_is_parent = false;
			if ( ! empty( $parent_slug ) ) {
				$menu_hook       = get_plugin_page_hook( $parent_slug, 'admin.php' );
				$admin_is_parent = ! empty( $menu_hook ) || ( ( 'index.php' !== $parent_slug ) && file_exists( WP_PLUGIN_DIR . "/$parent_file" ) && ! file_exists( ABSPATH . "/wp-admin/$parent_file" ) );
			}

			if (
				( ! $admin_is_parent && file_exists( WP_PLUGIN_DIR . "/$parent_file" ) && ! is_dir( WP_PLUGIN_DIR . "/$parent_file" ) ) ||
				( file_exists( ABSPATH . "/wp-admin/$parent_file" ) && ! is_dir( ABSPATH . "/wp-admin/$parent_file" ) )
			) {
				$url = add_query_arg( array( 'page' => $url ), admin_url( $parent_slug ) );
			} else {
				$url = add_query_arg( array( 'page' => $url ), admin_url( 'admin.php' ) );
			}
		} elseif ( file_exists( ABSPATH . "/wp-admin/$menu_file" ) ) {
			$url = admin_url( $url );
		}

		return wp_specialchars_decode( esc_url_raw( $url ) );
	}

	/**
	 * "Plugins", "Comments", "Updates" menu items have a count badge when there are updates available.
	 * This method parses that information, removes the associated markup and adds it to the response.
	 *
	 * Also sanitizes the titles from remaining unexpected markup.
	 *
	 * @param string $title Title to parse.
	 * @return array
	 */
	private function parse_menu_item( $title ) {
		// Handle non-string input
		if ( ! is_string( $title ) ) {
			return array();
		}

		$item = array();

		if (
			str_contains( $title, 'count-' )
			&& preg_match( '/<span class=".+\s?count-(\d*).+\s?<\/span><\/span>/', $title, $matches )
		) {

			$count = (int) ( $matches[1] );
			if ( $count > 0 ) {
				// Keep the counter in the item array.
				$item['count'] = $count;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'inline-text' )
			&& preg_match( '/<span class="inline-text".+\s?>(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['inlineText'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'inline-icon' )
			&& preg_match( '/<span class="inline-icon dashicons (dashicons-[^"]+)"[^>]*><\/span>/', $title, $matches )
		) {

			$icon = $matches[1];
			if ( $icon ) {
				// Keep the dashicon slug in the item array.
				$item['inlineIcon'] = $icon;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'awaiting-mod' )
			&& preg_match( '/<span class="awaiting-mod">(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['badge'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		// It's important we sanitize the title after parsing data to remove any unexpected markup but keep the content.
		// We are also capitalizing the first letter in case there was a counter (now parsed) in front of the title.
		$item['title'] = ucfirst( wp_strip_all_tags( $title ) );

		return $item;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );
