<?php
/**
 * Adds support for Jetpack Subscribe Modal feature
 *
 * @package automattic/jetpack-mu-wpcom
 * @since $$next-version$$
 */

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

	/**
	 * Jetpack_Subscribe_Modal class constructor.
	 */
	public function __construct() {
		add_action( 'wp_loaded', array( $this, 'wpcom_create_subscribe_template' ) );
		add_action( 'wp_footer', array( $this, 'wpcom_add_subscribe_modal_to_frontend' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'wpcom_enqueue_subscribe_modal_assets' ) );
	}

	/**
	 * Adds a Subscribe Modal template part that can be edited in the editor.
	 * This is later loaded in a pop up modal for Newsletter sites.
	 *
	 * @return void
	 */
	public function wpcom_create_subscribe_template() {
		if ( $this->should_enable_subscriber_modal() ) {
			$post = get_page_by_path( $this->get_subscribe_template_slug(), OBJECT, 'wp_template_part' );

			if ( ! $post ) {
				$template = array(
					'slug'         => $this->get_subscribe_template_slug(),
					'post_name'    => $this->get_subscribe_template_slug(),
					'post_title'   => $this->get_subscribe_template_title(),
					'post_content' => $this->get_subscribe_template_content(),
					'post_status'  => 'publish',
					'post_author'  => 1,
					'post_type'    => 'wp_template_part',
					'scope'        => array(),
					'tax_input'    => array(
						'wp_theme' => get_option( 'stylesheet' ),
					),
				);
				wp_insert_post( $template );
			}
		}
	}

	/**
	 * Adds modal with Subscribe Modal content.
	 *
	 * @return void
	 */
	public function wpcom_add_subscribe_modal_to_frontend() {
		if ( $this->should_enable_subscriber_modal() && ! is_admin() ) {
			$posts = get_posts(
				array(
					'post_type'   => 'wp_template_part',
					'post_status' => 'publish',
					'numberposts' => -1,
				)
			);

			$subscribe_template = reset(
				array_filter(
					$posts,
					function ( $post ) {
						return $post->post_name === $this->get_subscribe_template_slug();
					}
				)
			);

			$blocks = parse_blocks( $subscribe_template->post_content );

			/*
			 * Jetpack requires escaping html for the render_block() call below.
			 * I'm using wp_kses() and specifying the allowed tags.
			 * But this is fragile: users can edit the Subscribe Modal
			 * template and add tags that are not allowed here.
			 */
			$allowed_html = array(
				'div'    => array(
					'class' => array(),
					'style' => array(),
				),
				'h2'     => array(
					'class' => array(),
					'style' => array(),
				),
				'p'      => array(
					'type'  => array(),
					'class' => array(),
					'style' => array(),
					'id'    => array(),
				),
				'form'   => array(
					'action'                 => array(),
					'method'                 => array(),
					'accept-charset'         => array(),
					'data-blog'              => array(),
					'data-post_access_level' => array(),
					'id'                     => array(),
				),
				'label'  => array(
					'id'    => array(),
					'for'   => array(),
					'class' => array(),
				),
				'input'  => array(
					'id'          => array(),
					'type'        => array(),
					'name'        => array(),
					'value'       => array(),
					'class'       => array(),
					'style'       => array(),
					'placeholder' => array(),
					'required'    => array(),
				),
				'button' => array(
					'type'  => array(),
					'class' => array(),
					'style' => array(),
				),
			);

			?>
				<div class="jetpack-subscribe-modal">
					<div class="jetpack-subscribe-modal__modal-content">
						<?php
						foreach ( $blocks as $block ) {
							echo wp_kses( render_block( $block ), $allowed_html );
						}
						?>
						<div class="jetpack-subscribe-modal__close"><a href="#">Close</a></div>
					</div>
				</div>
			<?php
		}
	}

	/**
	 * Enqueues JS to load modal.
	 *
	 * @return void
	 */
	public function wpcom_enqueue_subscribe_modal_assets() {
		if ( $this->should_enable_subscriber_modal() && ! is_admin() ) {
			wp_enqueue_style( 'subscribe-modal-css', plugins_url( 'subscribe-modal.css', __FILE__ ), array(), JETPACK__VERSION );
			wp_enqueue_script( 'subscribe-modal-js', plugins_url( 'subscribe-modal.js', __FILE__ ), array(), JETPACK__VERSION, true );
		}
	}

	/**
	 * Returns true if we should enable Newsletter content.
	 * This is currently limited to lettre theme or newsletter sites.
	 * We could open it to all themes or site intents.
	 *
	 * @return bool
	 */
	public function should_enable_subscriber_modal() {
		$is_lettre          = get_option( 'stylesheet' ) === 'lettre';
		$is_newsletter_site = get_option( 'site_intent' ) === 'newsletter';
		$is_modal_enabled   = get_option( 'sm_enabled' ) || false;

		return ( $is_lettre || $is_newsletter_site ) && $is_modal_enabled;
	}

	/**
	 * Returns the slug for the Subcribe template.
	 *
	 * @return string
	 */
	public function get_subscribe_template_slug() {
		return 'subscribe-modal';
	}

	/**
	 * Returns the title for the Subcribe template.
	 *
	 * @return string
	 */
	public function get_subscribe_template_title() {
		return 'Subscribe Modal';
	}

	/**
	 * Returns the initial content of the Subscribe Modal template.
	 * This can then be edited by the user.
	 *
	 * @return string
	 */
	public function get_subscribe_template_content() {
		return '<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:heading {"textAlign":"center"} -->
		<h2 class="wp-block-heading has-text-align-center">This post is for subscribers</h2>
		<!-- /wp:heading -->
		
		<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|60"}}}} -->
		<p class="has-text-align-center" style="margin-bottom:var(--wp--preset--spacing--60)">Subscribe to to keep reading and get access to the full archive.</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:jetpack/subscriptions {"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} /--></div>
		<!-- /wp:group -->';
	}
}

Jetpack_Subscribe_Modal::init();
