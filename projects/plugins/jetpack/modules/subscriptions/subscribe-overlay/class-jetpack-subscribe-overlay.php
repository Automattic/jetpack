<?php
/**
 * Adds support for Jetpack Subscribe Overlay feature
 *
 * @package automattic/jetpack-subscriptions
 * @since $$next-version$$
 */

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS;

/**
 * Jetpack_Subscribe_Overlay class.
 */
class Jetpack_Subscribe_Overlay {
	/**
	 * Jetpack_Subscribe_Overlay singleton instance.
	 *
	 * @var Jetpack_Subscribe_Overlay|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscribe_Overlay instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscribe_Overlay();
		}

		return self::$instance;
	}

	const BLOCK_TEMPLATE_PART_SLUG = 'jetpack-subscribe-overlay';

	/**
	 * Jetpack_Subscribe_Overlay class constructor.
	 */
	public function __construct() {
		if ( apply_filters( 'jetpack_subscribe_overlay_enabled', false ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
			add_action( 'wp_footer', array( $this, 'add_subscribe_overlay_to_frontend' ) );
		}

		add_filter( 'get_block_template', array( $this, 'get_block_template_filter' ), 10, 3 );
	}

	/**
	 * Returns the block template part ID.
	 *
	 * @return string
	 */
	public static function get_block_template_part_id() {
		return get_stylesheet() . '//' . self::BLOCK_TEMPLATE_PART_SLUG;
	}

	/**
	 * Makes get_block_template return the WP_Block_Template for the Subscribe Overlay.
	 *
	 * @param WP_Block_Template $block_template The block template to be returned.
	 * @param string            $id Template unique identifier (example: theme_slug//template_slug).
	 * @param string            $template_type Template type: `'wp_template'` or '`wp_template_part'`.
	 *
	 * @return WP_Block_Template
	 */
	public function get_block_template_filter( $block_template, $id, $template_type ) {
		if ( empty( $block_template ) && $template_type === 'wp_template_part' ) {
			if ( $id === self::get_block_template_part_id() ) {
				return $this->get_template();
			}
		}

		return $block_template;
	}

	/**
	 * Returns a custom template for the Subscribe Overlay.
	 *
	 * @return WP_Block_Template
	 */
	public function get_template() {
		$template                 = new WP_Block_Template();
		$template->theme          = get_stylesheet();
		$template->slug           = self::BLOCK_TEMPLATE_PART_SLUG;
		$template->id             = self::get_block_template_part_id();
		$template->area           = 'uncategorized';
		$template->content        = $this->get_subscribe_overlay_template_content();
		$template->source         = 'plugin';
		$template->type           = 'wp_template_part';
		$template->title          = __( 'Jetpack Subscribe overlay', 'jetpack' );
		$template->status         = 'publish';
		$template->has_theme_file = false;
		$template->is_custom      = true;
		$template->description    = __( 'An overlay that shows up when someone visits your site', 'jetpack' );

		return $template;
	}

	/**
	 * Returns the initial content of the Subscribe Overlay template.
	 * This can then be edited by the user.
	 *
	 * @return string
	 */
	public function get_subscribe_overlay_template_content() {
		$site_name        = get_bloginfo( 'name' );
		$site_description = get_bloginfo( 'description' ); // TODO can be empty, how to handle?
		$skip_to_content  = __( 'Skip to content', 'jetpack' );

		return <<<HTML
	<!-- wp:group {"layout":{"type":"constrained","contentSize":"400px"}} -->
	<div class="wp-block-group">
		<!-- wp:site-logo {"width":90,"shouldSyncIcon":true,"align":"center","className":"is-style-rounded"} /-->
	
		<!-- wp:heading {"textAlign":"center","level":1} -->
		<h1 class="wp-block-heading has-text-align-center">$site_name</h1>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center"} -->
		<p class='has-text-align-center'>$site_description</p>
		<!-- /wp:paragraph -->

		<!-- wp:jetpack/subscriptions /-->

		<!-- wp:paragraph {"align":"center","className":"jetpack-subscribe-overlay__to-content"} -->
		<p class="has-text-align-center jetpack-subscribe-overlay__to-content"><a href="#">$skip_to_content</a> ↓</p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
HTML;
	}

	/**
	 * Enqueues JS to load overlay.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if ( $this->should_user_see_overlay() ) {
			wp_enqueue_style( 'subscribe-overlay-css', plugins_url( 'subscribe-overlay.css', __FILE__ ), array(), JETPACK__VERSION );
			wp_enqueue_script( 'subscribe-overlay-js', plugins_url( 'subscribe-overlay.js', __FILE__ ), array( 'wp-dom-ready' ), JETPACK__VERSION, true );
		}
	}

	/**
	 * Adds overlay with Subscribe Overlay content.
	 *
	 * @return void
	 */
	public function add_subscribe_overlay_to_frontend() {
		if ( $this->should_user_see_overlay() ) { ?>
					<div class="jetpack-subscribe-overlay">
						<div class="jetpack-subscribe-overlay__close">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
								<path d="M5.40456 5L19 19M5 19L18.5954 5" stroke="currentColor" stroke-width="1.5"/>
							</svg>
						</div>
						<div class="jetpack-subscribe-overlay__content">
							<?php block_template_part( self::BLOCK_TEMPLATE_PART_SLUG ); ?>
						</div>
					</div>
			<?php
		}
	}

	/**
	 * Returns true if a site visitor should see
	 * the Subscribe Overlay.
	 *
	 * @return bool
	 */
	public function should_user_see_overlay() {
		// Only show when viewing frontend single post.
		if ( is_admin() ) {
			return false;
		}

		// Needed because Elementor editor makes is_admin() return false
		// See https://coreysalzano.com/wordpress/why-elementor-disobeys-is_admin/
		// Ignore nonce warning as just checking if is set
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['elementor-preview'] ) ) {
			return false;
		}

		// Don't show when previewing blog posts or site's theme
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['preview'] ) || isset( $_GET['theme_preview'] ) || isset( $_GET['customize_preview'] ) || isset( $_GET['hide_banners'] ) ) {
			return false;
		}

		// Don't show if one of subscribe query params is set.
		// They are set when user submits the subscribe form.
		// The nonce is checked elsewhere before redirect back to this page with query params.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['subscribe'] ) || isset( $_GET['blogsub'] ) ) {
			return false;
		}

		// Don't show if post is for subscribers only or has paywall block
		global $post;
		if ( defined( 'Automattic\\Jetpack\\Extensions\\Subscriptions\\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS' ) ) {
			$access_level = get_post_meta( $post->ID, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, true );
		} else {
			$access_level = get_post_meta( $post->ID, '_jetpack_newsletter_access', true );
		}
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
		$is_accessible_by_everyone = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY === $access_level || empty( $access_level );
		if ( ! $is_accessible_by_everyone ) {
			return false;
		}

		// Don't show if user is subscribed to blog.
		require_once __DIR__ . '/../views.php';
		if ( ! class_exists( 'Jetpack_Memberships' ) || Jetpack_Memberships::is_current_user_subscribed() ) {
			return false;
		}
		return true;
	}
}

Jetpack_Subscribe_Overlay::init();

add_action(
	'rest_api_switched_to_blog',
	function () {
		Jetpack_Subscribe_Overlay::init();
	}
);
