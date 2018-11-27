<?php
/**
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 **/

/**
 * Class Jetpack_Email_Subscribe
 * This class encapsulates shortcode for subscribing to a MailChimp list.
 * It displays a simple signup form that gets an email address from the user and signs him for a list
 * selected in "Sharing" section in calypso.
 * Other Email services can be implemented as well in the future.
 */
class Jetpack_Email_Subscribe {

	private static $shortcode = 'jetpack-email-subscribe';

	private static $css_classname_prefix = 'jetpack-email-subscribe';

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
	}

	private function register_shortcode() {
		add_shortcode( self::$shortcode, array( $this, 'parse_shortcode' ) );
	}

	public function init_hook_action() {
		$this->register_scripts_and_styles();
		$this->register_shortcode();
	}

	private function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}


	public function parse_shortcode( $attrs ) {
		// We allow for overriding the presentation labels.
		$data = shortcode_atts(
			array(
				'title'             => __( 'Join my email list', 'jetpack' ),
				'email_placeholder' => __( 'Enter your email', 'jetpack' ),
				'submit_label'      => __( 'Join My Email List', 'jetpack' ),
				'consent_text'      => __( 'By clicking submit, you agree to share your email address with the site owner and MailChimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
				'processing_label'  => __( 'Processing...', 'jetpack' ),
				'success_label'     => __( 'Success! You\'ve been added to the list.', 'jetpack' ),
				'error_label'       => __( "Oh no! Unfortunately there was an error.\nPlease try reloading this page and adding your email once more.", 'jetpack' ),
			),
			$attrs
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

		if ( ! wp_style_is( 'jetpack-email-subscribe', 'enqueue' ) ) {
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
				<h2>%3$s</h2>
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
			esc_html( $data['title'] ),
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
