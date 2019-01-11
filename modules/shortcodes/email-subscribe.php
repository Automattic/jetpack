<?php
/**
 * Class Jetpack_Email_Subscribe
 * This class encapsulates:
 * - a shortcode for subscribing to a MailChimp list.
 * - a Gutenberg block for subscribing to a MailChimp list
 * Both the shortcode and a block display a simple signup form with an "email" field.
 * Submitting it subscribes the user to a MailChimp list selected in the "Sharing" section of Calypso.
 * Other Email services and blocks can be implemented as well in the future.
 */
class Jetpack_Email_Subscribe {

	private static $shortcode = 'jetpack-email-subscribe';

	private static $css_classname_prefix = 'jetpack-email-subscribe';

	private static $option_name = 'jetpack_mailchimp';

	private static $block_name = 'mailchimp';

	private static $instance;

	private static $version = '1.0';

	private function __construct() {
	}

	/**
	 * This follows a classic singleton pattern.
	 *
	 * @return Jetpack_Email_Subscribe|null
	 */
	public static function get_instance() {
		// Do not load this at all if it's neither a WPCOM or a connected JP site.
		if ( ! ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_active() ) ) {
			return null;
		}

		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
		}

		return self::$instance;
	}

	private function register_scripts_and_styles() {
		wp_register_script( 'jetpack-email-subscribe', Jetpack::get_file_url_for_environment( '_inc/build/shortcodes/js/jetpack-email-subscribe.min.js', 'modules/shortcodes/js/jetpack-email-subscribe.js' ), array( 'jquery' ), self::$version );
		wp_register_style( 'jetpack-email-subscribe', plugins_url( '/css/jetpack-email-subscribe.css', __FILE__ ), array(), self::$version );
	}

	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
		add_action( 'jetpack_options_whitelist', array( $this, 'filter_whitelisted_options' ), 10, 1 );
	}

	public function filter_whitelisted_options( $options ) {
		$options[] = self::$option_name;
		return $options;
	}

	private function register_shortcode() {
		add_shortcode( self::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	/**
	 * Register our Mailchimp subscription block for the block editor.
	 *
	 * @since 6.9.0
	 */
	private function register_gutenberg_block() {
		jetpack_register_block(
			self::$block_name,
			array(
				'attributes' => array(
					'title'             => array(
						'type' => 'string',
					),
					'email_placeholder' => array(
						'type' => 'string',
					),
					'submit_label'      => array(
						'type' => 'string',
					),
					'consent_text'      => array(
						'type' => 'string',
					),
					'processing_label'  => array(
						'type' => 'string',
					),
					'success_label'     => array(
						'type' => 'string',
					),
					'error_label'       => array(
						'type' => 'string',
					),
					'className'         => array(
						'type' => 'string',
					),
				),
				'render_callback' => array( $this, 'parse_shortcode' ),
			)
		);
	}

	public function init_hook_action() {
		$this->register_scripts_and_styles();
		$this->register_shortcode();
		$this->register_gutenberg_block();
	}

	private function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}

	private function is_set_up() {
		$option = get_option( self::$option_name );
		if ( ! $option ) {
			return false;
		}
		$data = json_decode( $option, true );
		if ( isset( $data['follower_list_id'], $data['follower_list_id'] ) ) {
			return true;
		}
		return false;
	}

	private function get_site_slug() {
		if ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'build_raw_urls' ) ) {
			return Jetpack::build_raw_urls( home_url() );
		} elseif ( class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
			return WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
		}
		return '';
	}

	public function parse_shortcode( $attrs ) {
		// Lets check if everything is set up.
		if (
			! $this->is_set_up() &&
			current_user_can( 'edit_posts' )
		) {
			return sprintf(
				'<div class="components-placeholder">
					<div class="components-placeholder__label">%s</div>
					<div class="components-placeholder__instructions">%s</div>
					<a class="components-button is-button" href="https://wordpress.com/sharing/%s" target="_blank">%s</a>
				</div>',
				__( 'MailChimp form', 'jetpack' ),
				__( 'You need to connect your MailChimp account and choose a list in order to start collecting Email subscribers.', 'jetpack' ),
				$this->get_site_slug(),
				__( 'Set up MailChimp form', 'jetpack' )
			);
		}

		// We allow for overriding the presentation labels.
		$data = shortcode_atts(
			array(
				'title'             => '',
				'email_placeholder' => __( 'Enter your email', 'jetpack' ),
				'submit_label'      => __( 'Join My Email List', 'jetpack' ),
				'consent_text'      => __( 'By clicking submit, you agree to share your email address with the site owner and MailChimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
				'processing_label'  => __( 'Processing...', 'jetpack' ),
				'success_label'     => __( 'Success! You\'ve been added to the list.', 'jetpack' ),
				'error_label'       => __( "Oh no! Unfortunately there was an error.\nPlease try reloading this page and adding your email once more.", 'jetpack' ),
			),
			is_array( $attrs ) ? array_filter( $attrs ) : array()
		);

		// We don't allow users to change these parameters:
		$data = array_merge( $data, array(
			'blog_id'           => $this->get_blog_id(),
			'classname'         => self::$css_classname_prefix,
			'dom_id'            => uniqid( self::$css_classname_prefix . '_', false ),
		) );

		if ( ! wp_script_is( 'jetpack-email-subscribe', 'enqueued' ) ) {
			wp_enqueue_script( 'jetpack-email-subscribe' );
		}

		if ( ! wp_style_is( 'jetpack-email-subscribe', 'enqueued' ) ) {
			wp_enqueue_style( 'jetpack-email-subscribe' );
		}

		wp_add_inline_script(
			'jetpack-email-subscribe',
			sprintf(
				"try{JetpackEmailSubscribe.activate( '%s', '%s', '%s' );}catch(e){}",
				esc_js( $data['blog_id'] ),
				esc_js( $data['dom_id'] ),
				esc_js( $data['classname'] )
			)
		);

		return sprintf(
			'<div class="%1$s" id="%2$s">
				%3$s
				<form>
					<input type="email" class="%1$s-email" required placeholder="%4$s">
					<button type="submit" class="%1$s-submit">%6$s</button>
					<label class="%1$s-consent-label">
					    <small>%5$s</small>
					</label>
				</form>
				<div class="%1$s-processing">%7$s</div>
				<div class="%1$s-success">%8$s</div>
				<div class="%1$s-error">%9$s</div>
			</div>',
			esc_attr( $data['classname'] ),
			esc_attr( $data['dom_id'] ),
			$data['title'] ? '<h3>' . esc_html( $data['title'] ) . '</h3>' : '',
			esc_html( $data['email_placeholder'] ),
			esc_html( $data['consent_text'] ),
			esc_html( $data['submit_label'] ),
			nl2br( esc_html( $data['processing_label'] ) ),
			nl2br( esc_html( $data['success_label'] ) ),
			nl2br( esc_html( $data['error_label'] ) )
		);
	}

}

Jetpack_Email_Subscribe::get_instance();
