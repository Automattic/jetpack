<?php
/**
 * Adds support for Jetpack Subscribe Modal feature
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 12.4
 */

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Token_Subscription_Service;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS;

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
		$subscribe_text     = __( 'Subscribe now to keep reading and get access to the full archive.', 'jetpack' );

		return <<<HTML
	<!-- wp:group {"style":{"spacing":{"top":"32px","bottom":"32px","left":"32px","right":"32px"},"margin":{"top":"0","bottom":"0"}},"border":{"color":"#dddddd","width":"1px"}},"layout":{"type":"constrained","contentSize":"450px"}} -->
	<div class="wp-block-group has-border-color" style="border-color:#dddddd;border-width:1px;margin-top:0;margin-bottom:0;padding-top:32px;padding-right:32px;padding-bottom:32px;padding-left:32px">

	<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontStyle":"normal","fontWeight":"600","fontSize":"26px"},"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"4px","bottom":"10px"}}}} -->
		<h2 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:10px;font-size:26px;font-style:normal;font-weight:600">$discover_more_from</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"4px","bottom":"0px"}}}} -->
		<p class='has-text-align-center' style='margin-top:4px;margin-bottom:0px;font-size:15px'>$subscribe_text</p>
		<!-- /wp:paragraph -->

		<!-- wp:jetpack/subscriptions {"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} /-->

		<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"top":"20px"}},"typography":{"fontSize":"14px"}},"className":"jetpack-subscribe-modal__close"} -->
		<p class="has-text-align-center jetpack-subscribe-modal__close" style="margin-top:20px;font-size:14px"><a href="#">$continue_reading</a></p>
		<!-- /wp:paragraph -->
	</div>
	<!-- /wp:group -->
HTML;
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
		$is_accessible_by_everyone = Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY === $access_level || empty( $access_level );
		if ( ! $is_accessible_by_everyone ) {
			return false;
		}

		// Don't show if user is subscribed to blog.
		require_once __DIR__ . '/../views.php';
		if ( Jetpack_Memberships::is_current_user_subscribed() ) {
			return false;
		}
		return true;
	}
}

Jetpack_Subscribe_Modal::init();

add_action(
	'rest_api_switched_to_blog',
	function () {
		Jetpack_Subscribe_Modal::init();
	}
);
