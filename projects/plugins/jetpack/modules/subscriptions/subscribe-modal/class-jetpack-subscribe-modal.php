<?php
/**
 * Adds support for Jetpack Subscribe Modal feature
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 12.4
 */

use Automattic\Jetpack\Status\Host;

/**
 * Jetpack_Subscribe_Modal class.
 */
class Jetpack_Subscribe_Modal {
	/**
	 * Jetpack_Subscribe_Modal singleton instance.
	 *
	 * @var Jetpack_Subscribe_Modal|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscribe_Modal instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscribe_Modal();
		}

		return self::$instance;
	}

	const BLOCK_TEMPLATE_PART_SLUG = 'jetpack-subscribe-modal';

	/**
	 * Returns the block template part ID.
	 *
	 * @return string
	 */
	public static function get_block_template_part_id() {
		return get_stylesheet() . '//' . self::BLOCK_TEMPLATE_PART_SLUG;
	}

	/**
	 * Jetpack_Subscribe_Modal class constructor.
	 */
	public function __construct() {
		if ( get_option( 'sm_enabled', false ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
			add_action( 'wp_footer', array( $this, 'add_subscribe_modal_to_frontend' ) );
		}
		add_filter( 'get_block_template', array( $this, 'get_block_template_filter' ), 10, 3 );
	}

	/**
	 * Enqueues JS to load modal.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if ( $this->should_user_see_modal() ) {
			wp_enqueue_style( 'subscribe-modal-css', plugins_url( 'subscribe-modal.css', __FILE__ ), array(), JETPACK__VERSION );
			wp_enqueue_script( 'subscribe-modal-js', plugins_url( 'subscribe-modal.js', __FILE__ ), array( 'wp-dom-ready' ), JETPACK__VERSION, true );
		}
	}

	/**
	 * Adds modal with Subscribe Modal content.
	 *
	 * @return void
	 */
	public function add_subscribe_modal_to_frontend() {
		if ( $this->should_user_see_modal() ) { ?>
					<div class="jetpack-subscribe-modal">
						<div class="jetpack-subscribe-modal__modal-content">
							<?php block_template_part( self::BLOCK_TEMPLATE_PART_SLUG ); ?>
						</div>
					</div>
			<?php
		}
	}

	/**
	 * Makes get_block_template return the WP_Block_Template for the Subscribe Modal.
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
	 * Returns a custom template for the Subscribe Modal.
	 *
	 * @return WP_Block_Template
	 */
	public function get_template() {
		$template                 = new WP_Block_Template();
		$template->theme          = get_stylesheet();
		$template->slug           = self::BLOCK_TEMPLATE_PART_SLUG;
		$template->id             = self::get_block_template_part_id();
		$template->area           = 'uncategorized';
		$template->content        = $this->get_subscribe_template_content();
		$template->source         = 'plugin';
		$template->type           = 'wp_template_part';
		$template->title          = __( 'Jetpack Subscribe modal', 'jetpack' );
		$template->status         = 'publish';
		$template->has_theme_file = false;
		$template->is_custom      = true;
		$template->description    = __( 'A subscribe form that pops up when someone visits your site', 'jetpack' );

		return $template;
	}

	/**
	 * Returns the initial content of the Subscribe Modal template.
	 * This can then be edited by the user.
	 *
	 * @return string
	 */
	public function get_subscribe_template_content() {
		// translators: %s is the name of the site.
		$discover_more_from = sprintf( __( 'Discover more from %s', 'jetpack' ), get_bloginfo( 'name' ) );
		$continue_reading   = __( 'Continue Reading', 'jetpack' );
		$subscribe_text     = __( 'Subscribe to the newsletter to keep reading and get access to the full archive.', 'jetpack' );

		return <<<HTML
	<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|70","right":"var:preset|spacing|70"},"margin":{"top":"0","bottom":"0"}},"border":{"color":"#dddddd","width":"1px"}},"layout":{"type":"constrained","contentSize":"450px"}} -->
	<div class="wp-block-group has-border-color" style="border-color:#dddddd;border-width:1px;margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--70)">

	<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontStyle":"normal","fontWeight":"600","fontSize":"26px"},"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"4px","bottom":"4px"}}}} -->
		<h2 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:4px;font-size:26px;font-style:normal;font-weight:600">$discover_more_from</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"4px","bottom":"0px"}}}} -->
		<p class='has-text-align-center' style='margin-top:4px;margin-bottom:0px;font-size:15px'>$subscribe_text</p>
		<!-- /wp:paragraph -->

		<!-- wp:jetpack/subscriptions {"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} /-->

		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"14px"}},"className":"jetpack-subscribe-modal__close"} -->
		<p class="has-text-align-center jetpack-subscribe-modal__close" style="font-size:14px"><a href="#">$continue_reading</a></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
HTML;
	}

	/**
	 * Returns true if we should load Newsletter content.
	 * This is currently limited to lettre theme or newsletter sites.
	 * We could open it to all themes or site intents.
	 *
	 * @return bool
	 */
	public static function should_load_subscriber_modal() {
		// Adding extra check/flag to load only on WP.com
		// When ready for Jetpack release, remove this.
		$is_wpcom = ( new Host() )->is_wpcom_platform();
		if ( ! $is_wpcom ) {
			return false;
		}
		if ( 'lettre' !== get_option( 'stylesheet' ) && 'newsletter' !== get_option( 'site_intent' ) ) {
			return false;
		}
		if ( ! wp_is_block_theme() ) {
			return false;
		}
		return true;
	}

	/**
	 * Returns true if a site visitor should see
	 * the Subscribe Modal.
	 *
	 * @return bool
	 */
	public function should_user_see_modal() {
		// Only show when viewing frontend single post.
		if ( is_admin() || ! is_singular( 'post' ) ) {
			return false;
		}

		// Don't show if one of subscribe query params is set.
		// They are set when user submits the subscribe form.
		// The nonce is checked elsewhere before redirect back to this page with query params.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['subscribe'] ) || isset( $_GET['blogsub'] ) ) {
			return false;
		}

		// Dont show if user is member of site.
		if ( is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			return false;
		}

		// Don't show if user is subscribed to blog.
		require_once __DIR__ . '/../views.php';
		if ( $this->has_subscription_cookie() || Jetpack_Subscriptions_Widget::is_current_user_subscribed() ) {
			return false;
		}
		return true;
	}

	/**
	 * Returns true if site visitor has subscribed
	 * to the blog and has a subscription cookie.
	 *
	 * @return bool
	 */
	public function has_subscription_cookie() {
		$cookies = $_COOKIE;
		foreach ( $cookies as $name => $value ) {
			if ( strpos( $name, 'jetpack_blog_subscribe_' ) !== false ) {
				return true;
			}
		}
		return false;
	}
}

add_filter(
	'jetpack_subscriptions_modal_enabled',
	array(
		'Jetpack_Subscribe_Modal',
		'should_load_subscriber_modal',
	)
);

/**
 * Filter for enabling or disabling the Jetpack Subscribe Modal
 * feature. We use this filter here and in several other places
 * to conditionally load options and functionality related to
 * this feature.
 *
 * @since 12.4
 *
 * @param bool Defaults to false.
 */
if ( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) ) {
	Jetpack_Subscribe_Modal::init();
}

add_action(
	'rest_api_switched_to_blog',
	function () {
		/**
		 * Filter for enabling or disabling the Jetpack Subscribe Modal
		 * feature. We use this filter here and in several other places
		 * to conditionally load options and functionality related to
		 * this feature.
		 *
		 * @since 12.4
		 *
		 * @param bool Defaults to false.
		 */
		if ( apply_filters( 'jetpack_subscriptions_modal_enabled', false ) ) {
			Jetpack_Subscribe_Modal::init();
		}
	}
);
