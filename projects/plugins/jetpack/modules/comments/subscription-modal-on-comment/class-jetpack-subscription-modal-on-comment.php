<?php
/**
 * Adds support for Jetpack Subscription Modal On Comment feature
 * Limited to Atomic sites.
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 12.4
 */

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Status\Host;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS;

/**
 * Jetpack_Subscription_Modal_On_Comment class.
 */
class Jetpack_Subscription_Modal_On_Comment {
	/**
	 * Jetpack_Subscription_Modal_On_Comment singleton instance.
	 *
	 * @var Jetpack_Subscription_Modal_On_Comment|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscription_Modal_On_Comment instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscription_Modal_On_Comment();
		}

		return self::$instance;
	}

	const BLOCK_TEMPLATE_PART_SLUG = 'jetpack-subscription-modal';

	/**
	 * Returns the block template part ID.
	 *
	 * @return string
	 */
	public static function get_block_template_part_id() {
		return get_stylesheet() . '//' . self::BLOCK_TEMPLATE_PART_SLUG;
	}

	/**
	 * Jetpack_Subscription_Modal_On_Comment class constructor.
	 * Limited to Atomic sites.
	 */
	public function __construct() {
		if ( ( new Host() )->is_woa_site() && get_option( 'jetpack_verbum_subscription_modal', true ) ) {
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
			add_action( 'wp_footer', array( $this, 'add_subscription_modal_to_frontend' ) );
			add_filter( 'get_block_template', array( $this, 'get_block_template_filter' ), 10, 3 );
		}
	}

	/**
	 * Enqueues JS to load modal.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if ( ! $this->should_user_see_modal() ) {
			return;
		}

		wp_enqueue_style( 'subscription-modal-css', plugins_url( 'subscription-modal.css', __FILE__ ), array(), JETPACK__VERSION );
		wp_enqueue_script( 'subscription-modal-js', plugins_url( 'subscription-modal.js', __FILE__ ), array( 'wp-dom-ready' ), JETPACK__VERSION, true );
		wp_localize_script(
			'subscription-modal-js',
			'subscriptionData',
			array(
				'homeUrl' => wp_parse_url( home_url(), PHP_URL_HOST ),
			)
		);
	}

	/**
	 * Adds modal with Subscribe Modal content.
	 *
	 * @return void
	 */
	public function add_subscription_modal_to_frontend() {
		if ( $this->should_user_see_modal() ) { ?>
					<div class="jetpack-subscription-modal">
						<div class="jetpack-subscription-modal__modal-content">
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
		$template->title          = __( 'Jetpack Subscription modal', 'jetpack' );
		$template->status         = 'publish';
		$template->has_theme_file = false;
		$template->is_custom      = true;
		$template->description    = __( 'A subscribe form that submit a comment.', 'jetpack' );

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
		$subscribe_text     = __( 'Subscribe now to keep reading and get access to the full archive.', 'jetpack' );
		$continue_reading   = __( 'Continue reading', 'jetpack' );

		return <<<HTML
	<!-- wp:group {"style":{"spacing":{"top":"32px","bottom":"32px","left":"32px","right":"32px"},"margin":{"top":"0","bottom":"0"}},"border":{"color":"#dddddd","width":"1px"}},"layout":{"type":"constrained","contentSize":"450px"}} -->
	<div class="wp-block-group has-border-color jetpack-subscription-modal__modal-content-form" style="border-color:#dddddd;border-width:1px;margin-top:0;margin-bottom:0;padding:32px">

		<!-- wp:heading {"textAlign":"center","style":{"typography":{"fontStyle":"normal","fontWeight":"600","fontSize":"26px"},"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"4px","bottom":"10px"}}}} -->
		<h2 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:10px;font-size:26px;font-style:normal;font-weight:600">$discover_more_from</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"4px","bottom":"0px"}}}} -->
		<p class='has-text-align-center' style='margin-top:4px;margin-bottom:0px;font-size:15px'>$subscribe_text</p>
		<!-- /wp:paragraph -->

		<!-- wp:jetpack/subscriptions {"borderRadius":50,"className":"is-style-compact","appSource":"atomic-subscription-modal-lo"} /-->

		<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"top":"20px"}},"typography":{"fontSize":"14px"}},"className":"jetpack-subscription-modal__close"} -->
		<p class="has-text-align-center jetpack-subscription-modal__close" style="margin-top:20px;font-size:14px"><a href="#">$continue_reading</a></p>
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

		// Don't show if post is for subscribers only or has paywall block
		global $post;

		if ( ! $post instanceof WP_Post ) {
			return false;
		}

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

		return true;
	}
}

Jetpack_Subscription_Modal_On_Comment::init();

add_action(
	'rest_api_switched_to_blog',
	function () {
		Jetpack_Subscription_Modal_On_Comment::init();
	}
);
