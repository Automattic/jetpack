<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */
class Jetpack_Email_Subscribe {

	static $shortcode = 'jetpack-email-subscribe';

	static $css_classname_prefix = 'jetpack-email-subscribe';

	// Classic singleton pattern:
	private static $instance;
	private function __construct() {}
	static function getInstance() {
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
		wp_register_script( 'jetpack-email-subscribe', plugins_url( '/js/jetpack-email-subscribe.js', __FILE__ ), array( 'jquery' ) );
		wp_register_style( 'jetpack-email-subscribe', plugins_url( '/js/jetpack-email-subscribe.css', __FILE__ ) );
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

	function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}


	function parse_shortcode( $attrs, $content = false ) {
		// We allow for overriding the presentation labels
		$data = shortcode_atts( array(
			'blog_id'     => $this->get_blog_id(),
			'title'       => __( 'Join my email list', 'jetpack' ),
			'email_placeholder' => __( 'Enter your email', 'jetpack' ),
			'submit_label' => __( 'Join My Email List', 'jetpack' ),
			'consent_text' => __( 'By clicking submit, you agree to share your email address with the site owner and MailChimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.', 'jetpack' ),
			'processing_label' => __( 'Processing...', 'jetpack' ),
			'success_label' => __( 'Success! You\'ve been added to the list.', 'jetpack' ),
			'error_label' => __( "Oh no! Unfortunately there was an error.\nPlease try reloading this page and adding your email once more.", 'jetpack' ),
			'classname' => self::$css_classname_prefix,
			'dom_id' => uniqid( self::$css_classname_prefix . '_', false ),
		), $attrs );


		if ( ! wp_script_is( 'jetpack-email-subscribe', 'enqueued' ) ) {
			wp_enqueue_script( 'jetpack-email-subscribe' );
		}

		if( ! wp_style_is( 'jetpack-email-subscribe', 'enqueue' ) ) {
			wp_enqueue_style( 'jetpack-email-subscribe' );
		}

		wp_add_inline_script( 'jetpack-email-subscribe', sprintf(
			"try{JetpackEmailSubscribe.activate( '%s', '%s', '%s' );}catch(e){}",
			esc_js( $data['blog_id'] ),
			esc_js( $data['dom_id'] ),
			esc_js( $data['classname'] )
		) );

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
Jetpack_Email_Subscribe::getInstance();
