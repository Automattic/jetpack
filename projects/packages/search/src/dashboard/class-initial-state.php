<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Jetpack_Options;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * Connection Manager
	 *
	 * @var Connection_Manager
	 */
	protected $connection_manager;

	/**
	 * Search Module Control
	 *
	 * @var Module_Control
	 */
	protected $module_control;

	/**
	 * Constructor
	 *
	 * @param Connection_Manager $connection_manager - Connection mananger instance.
	 * @param Module_Control     $module_control - Module control instance.
	 */
	public function __construct( $connection_manager = null, $module_control = null ) {
		$this->connection_manager = $connection_manager ? $connection_manager : new Connection_Manager( Package::SLUG );
		$this->module_control     = $module_control ? $module_control : new Module_Control();
	}

	/**
	 * Render JS for the initial state
	 *
	 * @return string - JS string.
	 */
	public function render() {
		return 'var JETPACK_SEARCH_DASHBOARD_INITIAL_STATE=' . wp_json_encode( $this->get_initial_state(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	public function get_initial_state() {
		return array(
			'siteData'        => array(
				'WP_API_root'                => esc_url_raw( rest_url() ),
				'wpcomOriginApiUrl'          => $this->get_wp_api_root(),
				'WP_API_nonce'               => wp_create_nonce( 'wp_rest' ),
				'registrationNonce'          => wp_create_nonce( 'jetpack-registration-nonce' ),
				'purchaseToken'              => $this->get_purchase_token(),
				/**
				 * Whether promotions are visible or not.
				 *
				 * @param bool $are_promotions_active Status of promotions visibility. True by default.
				 */
				'showPromotions'             => apply_filters( 'jetpack_show_promotions', true ),
				'adminUrl'                   => esc_url( admin_url() ),
				'readerChatGuidelinesUrl'    => $this->get_reader_chat_guidelines_url(),
				'aiAgentAccessAvailable'     => $this->is_ai_agent_access_available(),
				'aiAgentAccessGuidelinesUrl' => $this->get_ai_agent_access_guidelines_url(),
				'blogId'                     => Jetpack_Options::get_option( 'id', 0 ),
				'version'                    => Package::VERSION,
				'calypsoSlug'                => ( new Status() )->get_site_suffix(),
				'title'                      => get_bloginfo( 'name' ),
				'postTypes'                  => $this->get_post_types_with_labels(),
				'isWpcom'                    => Helper::is_wpcom(),
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				'isPlanJustUpgraded'         => isset( $_GET['just_upgraded'] ) && wp_unslash( $_GET['just_upgraded'] ),
				/**
				 * Whether the Jetpack Search 3.0 Interactivity API blocks are enabled.
				 * Mirrors the `jetpack_search_blocks_enabled` server-side filter so the
				 * dashboard React app can gate the new feature-selection UI on the
				 * same flag the back end uses to register the blocks themselves.
				 */
				'searchBlocksEnabled'        => (bool) apply_filters( 'jetpack_search_blocks_enabled', true ),
				/**
				 * Whether the experimental blocks-powered Overlay search experience
				 * is available in the Experience Selector. Mirrors the
				 * `jetpack_search_overlay_block_template_enabled` server-side filter
				 * so the dashboard React app can gate the new card on the same flag
				 * the back end uses to enable the runtime swap. Defaults to true so
				 * the Beta card ships to every site; operators that pin the filter
				 * to false fall back to the original four-card selector.
				 */
				'blockOverlayEnabled'        => (bool) apply_filters( 'jetpack_search_overlay_block_template_enabled', true ),
				/**
				 * Editor affordances for the experimental blocks-powered overlay.
				 * Surfaces in the new Overlay search card so admins can edit the
				 * rendered template via the standard block editor on `post.php` —
				 * works on both block and classic themes. URLs are null for any
				 * visitor without `manage_options`; the action handlers also
				 * enforce that capability server-side.
				 */
				'blockTemplateOverlay'       => $this->get_block_template_overlay_config(),
				/**
				 * Same as `blockTemplateOverlay` but for the WooCommerce product
				 * variant of the overlay — the Overlay card surfaces a second
				 * "Edit the product Search overlay" entry on Woo stores so the
				 * product-search overlay template is customizable too.
				 */
				'productOverlayTemplate'     => $this->get_product_overlay_template_config(),
				/**
				 * Editor affordances for the classic-theme search-template
				 * singleton CPT. The Embedded card surfaces these on
				 * classic themes (which can't reach the Site Editor) so
				 * admins still get an "Edit search template" entry — same
				 * shape and same React link as `blockTemplateOverlay`.
				 */
				'searchTemplate'             => $this->get_search_template_config(),
				/**
				 * Same as `searchTemplate` but for the WooCommerce product
				 * search shim — the `WooCommerceProductSearchControl`
				 * surfaces this on classic themes so the "Edit the product
				 * search template" link routes to `post.php` on the hidden
				 * CPT instead of a useless Site Editor URL.
				 */
				'productSearchTemplate'      => $this->get_product_search_template_config(),
				// Gates the WooCommerce Product Search control to stores.
				'isWooCommerceActive'        => Search_Blocks::woocommerce_blocks_enabled(),
				/**
				 * Active theme stylesheet — used by the experience-selector to deep-link
				 * the "Edit search template" action to the right Site Editor entry
				 * (`?p=/wp_template/<stylesheet>//jetpack-search`).
				 */
				'activeThemeStylesheet'      => get_stylesheet(),
				/**
				 * Whether the active theme is a block theme. Embedded itself
				 * works on every theme — block themes through the FSE
				 * `search_template_hierarchy` route, classic themes through
				 * the singleton-CPT shim — but the Embedded card's
				 * customization affordances diverge: block themes get the
				 * Site-Editor entry points ("Edit search template" / "Insert
				 * pattern"), classic themes get the block-editor-on-a-hidden-
				 * CPT path via `searchTemplate`. This flag is the dashboard's
				 * branch selector for which to render.
				 */
				'themeSupportsBlocks'        => wp_is_block_theme(),
			),
			'userData'        => array(
				'currentUser' => $this->current_user_data(),
			),
			'jetpackSettings' => array(
				'search'                 => $this->module_control->is_active(),
				'instant_search_enabled' => $this->module_control->is_instant_search_enabled(),
				'experience'             => $this->module_control->get_experience(),
			),
			'features'        => array_map(
				'sanitize_text_field',
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				isset( $_GET['features'] ) ? explode( ',', wp_unslash( $_GET['features'] ) ) : array()
			),
		);
	}

	/**
	 * Get API root.
	 *
	 * It return first party API root for WPCOM simple sites.
	 */
	protected function get_wp_api_root() {
		if ( ! Helper::is_wpcom() ) {
			return esc_url_raw( rest_url() );
		}
		// First party API prefix for WPCOM.
		return esc_url_raw( site_url( '/wp-json/wpcom-origin/' ) );
	}

	/**
	 * Get the Reader Chat guidelines admin page URL when it is registered.
	 *
	 * The guidelines page is controlled outside Jetpack. Returning an empty
	 * URL lets the dashboard hide the link when that experiment is unavailable.
	 *
	 * @return string Guidelines admin URL, or an empty string when unavailable.
	 */
	protected function get_reader_chat_guidelines_url() {
		return $this->get_guidelines_url();
	}

	/**
	 * Get the AI Agent Access guidelines admin page URL when it is registered.
	 *
	 * The guidelines page is controlled outside Jetpack. Returning an empty
	 * URL lets the dashboard hide the link when that page is unavailable.
	 *
	 * @return string Guidelines admin URL, or an empty string when unavailable.
	 */
	protected function get_ai_agent_access_guidelines_url() {
		return $this->get_guidelines_url();
	}

	/**
	 * Get the Guidelines admin page URL when it is registered.
	 *
	 * @return string Guidelines admin URL, or an empty string when unavailable.
	 */
	protected function get_guidelines_url() {
		if ( ! function_exists( 'menu_page_url' ) ) {
			return '';
		}

		return esc_url_raw( menu_page_url( 'guidelines-wp-admin', false ) );
	}

	/**
	 * Check whether the AI Agent Access toggle should be available.
	 *
	 * Private sites are not eligible because external AI agents cannot read
	 * their public content.
	 *
	 * @return bool
	 */
	protected function is_ai_agent_access_available() {
		return ! $this->is_private_site();
	}

	/**
	 * Build the block-template overlay editor config exposed to the dashboard.
	 *
	 * `enabled` mirrors `Search_Blocks::is_block_template_overlay_enabled()`
	 * — true only when the user is currently *on* the blocks Overlay arm.
	 * The editor URLs, by contrast, are gated on the operator filter alone
	 * so admins can edit the template from the Beta card even before
	 * activating it (otherwise the React store, computed at page load
	 * before any switch, would carry a null `editorUrl` and the link would
	 * become a no-op once the card flipped to Active without a refresh).
	 *
	 * @return array{enabled: bool, editorUrl: string|null, postType: string|null, isCustomized: bool}
	 */
	protected function get_block_template_overlay_config(): array {
		return $this->build_singleton_template_config(
			Search_Blocks::is_block_template_overlay_enabled(),
			Search_Blocks::is_block_template_overlay_filter_on() && current_user_can( 'manage_options' ),
			Overlay_Template::class
		);
	}

	/**
	 * Build the product-overlay editor config exposed to the dashboard.
	 * Counterpart of `get_block_template_overlay_config()` for the WooCommerce
	 * product variant. `enabled` adds the override-on + WC check on top of the
	 * overlay-arm gate — it signals the product overlay's front-end render path
	 * is actually wired. `$can_edit` mirrors the init gate: the editable CPT
	 * only registers on Woo stores with the overlay filter on (see
	 * `Search_Blocks::init()`), so exposing the editor URL off Woo would produce
	 * a link that silently does nothing.
	 *
	 * @return array{enabled: bool, editorUrl: string|null, postType: string|null, isCustomized: bool}
	 */
	protected function get_product_overlay_template_config(): array {
		$wc_enabled = Search_Blocks::woocommerce_blocks_enabled();
		return $this->build_singleton_template_config(
			Search_Blocks::is_block_template_overlay_enabled()
				&& $wc_enabled
				&& Search_Blocks::woocommerce_search_template_override_enabled(),
			Search_Blocks::is_block_template_overlay_filter_on()
				&& $wc_enabled
				&& current_user_can( 'manage_options' ),
			Product_Overlay_Template::class
		);
	}

	/**
	 * Build the classic-theme search-template editor config exposed to the
	 * dashboard. Counterpart of `get_block_template_overlay_config()` —
	 * same `{enabled, editorUrl, postType, isCustomized}` shape and the
	 * same "expose URLs before activation" rule: admins can edit the
	 * template from the Embedded card on any classic theme, even before
	 * actually switching to Embedded.
	 *
	 * @return array{enabled: bool, editorUrl: string|null, postType: string|null, isCustomized: bool}
	 */
	protected function get_search_template_config(): array {
		$is_classic = ! wp_is_block_theme();
		return $this->build_singleton_template_config(
			$is_classic && Module_Control::EXPERIENCE_EMBEDDED === $this->module_control->get_experience(),
			$is_classic && current_user_can( 'manage_options' ),
			Search_Template::class
		);
	}

	/**
	 * Build the classic-theme product-search-template editor config exposed
	 * to the dashboard. Counterpart of `get_search_template_config()` for the
	 * WooCommerce product shim — same `{enabled, editorUrl, postType, isCustomized}`
	 * shape. `enabled` adds the override-on check on top of the classic +
	 * server-rendered-experience gate — it signals "the front-end render path
	 * is actually wired", distinct from "the override toggle is on" in
	 * `jetpackSettings.override_woocommerce_search_template`. `$can_edit`
	 * mirrors the init gate: `Product_Search_Template::init()` (in
	 * `Search_Blocks::init()`) registers `maybe_handle_editor_request` on
	 * classic Embedded **and** classic Inline (both route the product shim),
	 * so the editor URL surfaces for both — but not on a block theme, where
	 * the Site Editor link is used instead.
	 *
	 * @return array{enabled: bool, editorUrl: string|null, postType: string|null, isCustomized: bool}
	 */
	protected function get_product_search_template_config(): array {
		$experience = $this->module_control->get_experience();
		$is_classic = ! wp_is_block_theme();
		// Embedded and Inline both route the classic product shim, so both
		// expose the CPT editor.
		$is_classic_product_override = $is_classic
			&& in_array(
				$experience,
				array( Module_Control::EXPERIENCE_EMBEDDED, Module_Control::EXPERIENCE_INLINE ),
				true
			);
		return $this->build_singleton_template_config(
			$is_classic_product_override && Search_Blocks::woocommerce_search_template_override_enabled(),
			$is_classic_product_override && current_user_can( 'manage_options' ),
			Product_Search_Template::class
		);
	}

	/**
	 * Shared assembly for a {@see Singleton_Template_Cpt}-backed editor
	 * config block. Both `blockTemplateOverlay` and `searchTemplate` ship
	 * the same `{enabled, editorUrl, postType, isCustomized}` shape to
	 * the React dashboard. The `$enabled` and `$can_edit` flags are
	 * intentionally separate: the card lights up as "active" on
	 * `$enabled`, but the URLs / `postType` surface as soon as `$can_edit`
	 * is true so admins can pre-customize the template before activating
	 * the experience — without forcing a page reload after the switch.
	 *
	 * `postType` (rather than a pre-built REST path) is what the dashboard
	 * needs: the React "Restore default" handler builds the
	 * `${wpcomOriginApiUrl}jetpack/v4/search/templates/<post_type>` URL
	 * itself, which is how the request reaches the right route on wpcom
	 * Simple sites (the local /wp-json/ surface there doesn't expose
	 * Jetpack routes). The handler re-checks `manage_options` server-side,
	 * so omitting the URLs / postType here just keeps the wire payload
	 * tight for non-admins.
	 *
	 * @param bool   $enabled   Whether the CPT-backed route is currently live on the site.
	 * @param bool   $can_edit  Whether to expose the editor URL + postType (operator-level gate + capability).
	 * @param string $cpt_class Concrete `Singleton_Template_Cpt` subclass to query.
	 * @return array{enabled: bool, editorUrl: string|null, postType: string|null, isCustomized: bool}
	 */
	protected function build_singleton_template_config( bool $enabled, bool $can_edit, string $cpt_class ): array {
		return array(
			'enabled'      => $enabled,
			'editorUrl'    => $can_edit ? $cpt_class::get_editor_url() : null,
			'postType'     => $can_edit ? $cpt_class::POST_TYPE : null,
			'isCustomized' => $can_edit && $cpt_class::is_customized(),
		);
	}

	/**
	 * Check whether the current site is private.
	 *
	 * @return bool
	 */
	protected function is_private_site() {
		if ( function_exists( 'is_private_blog' ) ) {
			return (bool) \is_private_blog();
		}

		return -1 === (int) get_option( 'blog_public', 1 );
	}

	/**
	 * Gather data about the current user.
	 *
	 * @return array
	 */
	protected function current_user_data() {
		$current_user      = wp_get_current_user();
		$is_user_connected = $this->connection_manager->is_user_connected( $current_user->ID );
		$is_master_user    = $is_user_connected && (int) $current_user->ID && (int) Jetpack_Options::get_option( 'master_user' ) === (int) $current_user->ID;
		$dotcom_data       = $this->connection_manager->get_connected_user_data();

		$current_user_data = array(
			'isConnected' => $is_user_connected,
			'isMaster'    => $is_master_user,
			'username'    => $current_user->user_login,
			'id'          => $current_user->ID,
			'wpcomUser'   => $dotcom_data,
			'permissions' => array(
				'manage_options' => current_user_can( 'manage_options' ),
			),
		);

		return $current_user_data;
	}

	/**
	 * Gets the post type labels for all of the site's post types (including custom post types)
	 *
	 * @return array
	 */
	protected function get_post_types_with_labels() {

		$args = array(
			'public' => true,
		);

		$post_types_with_labels = array();

		$post_types = get_post_types( $args, 'objects' );

		// We don't need all the additional post_type data, just the slug & label
		foreach ( $post_types as $post_type ) {
			$post_type_with_label = array(
				'slug'  => $post_type->name,
				'label' => $post_type->label,
			);

			$post_types_with_labels[ $post_type->name ] = $post_type_with_label;
		}
		return $post_types_with_labels;
	}

	/**
	 * Gets a purchase token that is used for Jetpack logged out visitor checkout.
	 * The purchase token should be appended to all CTA url's that lead to checkout.
	 *
	 * @return string|boolean
	 */
	protected function get_purchase_token() {
		if ( ! $this->current_user_can_purchase() ) {
			return false;
		}

		$purchase_token = Jetpack_Options::get_option( 'purchase_token', false );

		if ( $purchase_token ) {
			return $purchase_token;
		}
		// If the purchase token is not saved in the options table yet, then add it.
		Jetpack_Options::update_option( 'purchase_token', $this->generate_purchase_token(), true );
		return Jetpack_Options::get_option( 'purchase_token', false );
	}

	/**
	 * Generates a purchase token that is used for Jetpack logged out visitor checkout.
	 *
	 * @return string
	 */
	protected function generate_purchase_token() {
		return wp_generate_password( 12, false );
	}

	/**
	 * Determine if the current user is allowed to make Jetpack purchases without
	 * a WordPress.com account
	 *
	 * @return boolean True if the user can make purchases, false if not
	 */
	public function current_user_can_purchase() {
		// The site must be site-connected to Jetpack (no users connected).
		if ( ! $this->connection_manager->is_site_connection() ) {
			return false;
		}

		// Make sure only administrators can make purchases.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return true;
	}
}
