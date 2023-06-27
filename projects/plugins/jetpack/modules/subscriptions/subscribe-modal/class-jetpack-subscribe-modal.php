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
					'post_title'   => __( 'Subscribe Modal', 'jetpack' ),
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
		if (
			$this->should_enable_subscriber_modal() &&
			! is_admin() &&
			is_single() &&
			'post' === get_post_type()
		) {
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
						<Dashicon icon="minus" className="jp-idc__idc-screen__card-action-separator" />
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
		$is_fse_theme       = wp_is_block_theme();

		return ( $is_lettre || $is_newsletter_site ) && $is_fse_theme && $is_modal_enabled;
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
	 * Returns the initial content of the Subscribe Modal template.
	 * This can then be edited by the user.
	 *
	 * @return string
	 */
	public function get_subscribe_template_content() {
		return '<!-- wp:group {"style":{"spacing":{"padding":{"top":"50px","bottom":"50px","left":"20px","right":"20px"}}},"layout":{"type":"constrained"}} -->
		<div class="wp-block-group" style="padding-top:50px;padding-right:20px;padding-bottom:50px;padding-left:20px"><!-- wp:group {"style":{"dimensions":{"minHeight":"0px"},"spacing":{"blockGap":"8px"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"center"}} -->
		<div class="wp-block-group" style="min-height:0px"><!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600","fontSize":"26px"},"layout":{"selfStretch":"fit","flexSize":null}}} -->
		<h2 class="wp-block-heading" style="font-size:26px;font-style:normal;font-weight:600">Discover more from</h2>
		<!-- /wp:heading -->
		
		<!-- wp:site-title {"level":2,"textAlign":"center","style":{"typography":{"fontStyle":"normal","fontWeight":"600","lineHeight":"1.2","fontSize":"26px"}}} /--></div>
		<!-- /wp:group -->
		
		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"top":"4px","bottom":"0px"}}}} -->
		<p class="has-text-align-center" style="margin-top:4px;margin-bottom:0px;font-size:15px">Subscribe to the newsletter to keep reading</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"15px"},"spacing":{"margin":{"bottom":"20px","top":"0px"}}}} -->
		<p class="has-text-align-center" style="margin-top:0px;margin-bottom:20px;font-size:15px">and get access to the full archive.</p>
		<!-- /wp:paragraph -->
		
		<!-- wp:jetpack/subscriptions {"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} /-->
		
		<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#666666"},"typography":{"fontSize":"14px","textDecoration":"underline"}},"className":"jetpack-subscribe-modal__close"} -->
		<p class="has-text-align-center jetpack-subscribe-modal__close has-text-color" style="color:#666666;font-size:14px;text-decoration:underline"><a href="#">Continue Reading</a></p>
		<!-- /wp:paragraph --></div>
		<!-- /wp:group -->';
	}
}

Jetpack_Subscribe_Modal::init();
