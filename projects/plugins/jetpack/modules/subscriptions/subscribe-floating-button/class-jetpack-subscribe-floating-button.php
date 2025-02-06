<?php
/**
 * Adds support for Jetpack floating Subscribe button feature
 *
 * @package automattic/jetpack-subscriptions
 * @since 14.0
 */

/**
 * Jetpack_Subscribe_Floating_Button class.
 */
class Jetpack_Subscribe_Floating_Button {
	/**
	 * Jetpack_Subscribe_Floating_Button singleton instance.
	 *
	 * @var Jetpack_Subscribe_Floating_Button|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscribe_Floating_Button instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscribe_Floating_Button();
		}

		return self::$instance;
	}

	const BLOCK_TEMPLATE_PART_SLUG = 'jetpack-subscribe-floating-button';

	/**
	 * Jetpack_Subscribe_Floating_Button class constructor.
	 */
	public function __construct() {
		if ( get_option( 'jetpack_subscribe_floating_button_enabled', false ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
			add_action( 'wp_footer', array( $this, 'add_subscribe_floating_button_to_frontend' ) );
		}

		add_filter( 'get_block_template', array( $this, 'get_block_template_filter' ), 10, 3 );

		add_filter(
			'jetpack_options_whitelist',
			function ( $options ) {
				$options[] = 'jetpack_subscribe_floating_button_enabled';

				return $options;
			}
		);
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
	 * Makes get_block_template return the WP_Block_Template for the floating Subscribe button.
	 *
	 * @param WP_Block_Template $block_template The block template to be returned.
	 * @param string            $id Template unique identifier (example: theme_slug//template_slug).
	 * @param string            $template_type Template type: `'wp_template'` or '`wp_template_part'`.
	 *
	 * @return WP_Block_Template|null
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
	 * Returns a custom template for the floating Subscribe button.
	 *
	 * @return WP_Block_Template
	 */
	public function get_template() {
		$template                 = new WP_Block_Template();
		$template->theme          = get_stylesheet();
		$template->slug           = self::BLOCK_TEMPLATE_PART_SLUG;
		$template->id             = self::get_block_template_part_id();
		$template->area           = 'uncategorized';
		$template->content        = $this->get_floating_subscribe_button_template_content();
		$template->source         = 'plugin';
		$template->type           = 'wp_template_part';
		$template->title          = __( 'Jetpack Subscribe floating button', 'jetpack' );
		$template->status         = 'publish';
		$template->has_theme_file = false;
		$template->is_custom      = true;
		$template->description    = __( 'A floating subscribe button that shows up when someone visits your site.', 'jetpack' );

		return $template;
	}

	/**
	 * Returns the initial content of the floating Subscribe button template.
	 * This can then be edited by the user.
	 *
	 * @return string
	 */
	public function get_floating_subscribe_button_template_content() {
		$block_name = esc_attr__( 'Floating subscribe button', 'jetpack' );

		return '<!-- wp:jetpack/subscriptions {"className":"is-style-button","appSource":"subscribe-floating-button","lock":{"move":false,"remove":true},"style":{"spacing":{"margin":{"right":"20px","left":"20px","top":"20px","bottom":"20px"}}},"metadata":{"name":"' . $block_name . '"}} /-->';
	}

	/**
	 * Enqueues styles.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if ( $this->should_user_see_floating_button() ) {
			wp_enqueue_style( 'subscribe-floating-button-css', plugins_url( 'subscribe-floating-button.css', __FILE__ ), array(), JETPACK__VERSION );

			// Disables WP.com action bar as the features collide/overlap
			add_filter( 'wpcom_disable_logged_out_follow', '__return_true', 10, 1 );
		}
	}

	/**
	 * Adds floating Subscribe button HTML wrapper
	 *
	 * @return void
	 */
	public function add_subscribe_floating_button_to_frontend() {
		if ( $this->should_user_see_floating_button() ) { ?>
				<div class="jetpack-subscribe-floating-button">
					<?php block_template_part( self::BLOCK_TEMPLATE_PART_SLUG ); ?>
				</div>
			<?php
		}
	}

	/**
	 * Returns true if a site visitor should see
	 * the floating Subscribe button.
	 *
	 * @return bool
	 */
	public function should_user_see_floating_button() {
		// Only show when viewing frontend.
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

		// Don't show if user is subscribed to blog.
		require_once __DIR__ . '/../views.php';
		if ( ! class_exists( 'Jetpack_Memberships' ) || Jetpack_Memberships::is_current_user_subscribed() ) {
			return false;
		}

		return true;
	}
}

Jetpack_Subscribe_Floating_Button::init();

add_action(
	'rest_api_switched_to_blog',
	function () {
		Jetpack_Subscribe_Floating_Button::init();
	}
);
