<?php
/**
 * hCaptcha support for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Adds hCaptcha rendering, settings, and verification to Jetpack Forms.
 */
class HCaptcha {

	const OPTION_NAME   = 'jetpack_forms_hcaptcha';
	const OPTION_GROUP  = 'jetpack_forms_hcaptcha';
	const SETTINGS_PAGE = 'jetpack-forms-hcaptcha';
	const SCRIPT_HANDLE = 'jetpack-forms-hcaptcha';
	const VERIFY_URL    = 'https://api.hcaptcha.com/siteverify';
	const API_SCRIPT    = 'https://js.hcaptcha.com/1/api.js';
	const SHORTCODE     = 'hcaptcha';

	/**
	 * hCaptcha error messages.
	 *
	 * These strings intentionally match the hCaptcha plugin's verification
	 * messages so Jetpack Forms shows the same submission errors.
	 *
	 * @return array
	 */
	private static function get_error_messages() {
		return array(
			'missing-input-secret'     => __( 'Your secret key is missing.', 'jetpack-forms' ),
			'invalid-input-secret'     => __( 'Your secret key is invalid or malformed.', 'jetpack-forms' ),
			'missing-input-response'   => __( 'The response parameter (verification token) is missing.', 'jetpack-forms' ),
			'invalid-input-response'   => __( 'The response parameter (verification token) is invalid or malformed.', 'jetpack-forms' ),
			'expired-input-response'   => __( 'The response parameter (verification token) is expired. (120s default)', 'jetpack-forms' ),
			'already-seen-response'    => __( 'The response parameter (verification token) was already verified once.', 'jetpack-forms' ),
			'bad-request'              => __( 'The request is invalid or malformed.', 'jetpack-forms' ),
			'missing-remoteip'         => __( 'The remoteip parameter is missing.', 'jetpack-forms' ),
			'invalid-remoteip'         => __( 'The remoteip parameter is not a valid IP address or blinded value.', 'jetpack-forms' ),
			'not-using-dummy-passcode' => __( 'You have used a testing sitekey but have not used its matching secret.', 'jetpack-forms' ),
			'sitekey-secret-mismatch'  => __( 'The sitekey is not registered with the provided secret.', 'jetpack-forms' ),
			'empty'                    => __( 'Please complete the hCaptcha.', 'jetpack-forms' ),
			'fail'                     => __( 'The hCaptcha is invalid.', 'jetpack-forms' ),
		);
	}

	/**
	 * Singleton instance.
	 *
	 * @var HCaptcha|null
	 */
	private static $instance = null;

	/**
	 * Whether the frontend hCaptcha styles have been queued.
	 *
	 * @var bool
	 */
	private static $styles_queued = false;

	/**
	 * Initialize hCaptcha integration hooks.
	 *
	 * @return HCaptcha
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_menu', array( $this, 'add_settings_menu' ), 11 );
		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'verify' ), 5, 2 );
		add_filter( 'script_loader_tag', array( $this, 'add_script_attributes' ), 10, 3 );
	}

	/**
	 * Register settings for hCaptcha.
	 */
	public function register_settings() {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
				'default'           => self::get_default_settings(),
			)
		);

		add_settings_section(
			'jetpack_forms_hcaptcha_settings',
			__( 'hCaptcha', 'jetpack-forms' ),
			array( $this, 'render_settings_section' ),
			self::SETTINGS_PAGE
		);

		add_settings_field(
			'enabled',
			__( 'Enable hCaptcha', 'jetpack-forms' ),
			array( $this, 'render_enabled_field' ),
			self::SETTINGS_PAGE,
			'jetpack_forms_hcaptcha_settings'
		);

		add_settings_field(
			'site_key',
			__( 'Site key', 'jetpack-forms' ),
			array( $this, 'render_site_key_field' ),
			self::SETTINGS_PAGE,
			'jetpack_forms_hcaptcha_settings'
		);

		add_settings_field(
			'secret_key',
			__( 'Secret key', 'jetpack-forms' ),
			array( $this, 'render_secret_key_field' ),
			self::SETTINGS_PAGE,
			'jetpack_forms_hcaptcha_settings'
		);
	}

	/**
	 * Add the hCaptcha settings page to the Jetpack admin menu.
	 */
	public function add_settings_menu() {
		Admin_Menu::add_menu(
			__( 'Jetpack Forms hCaptcha', 'jetpack-forms' ),
			__( 'Forms hCaptcha', 'jetpack-forms' ),
			'manage_options',
			self::SETTINGS_PAGE,
			array( $this, 'render_settings_page' ),
			11
		);
	}

	/**
	 * Render the settings page.
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to manage hCaptcha settings.', 'jetpack-forms' ) );
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Jetpack Forms hCaptcha', 'jetpack-forms' ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::SETTINGS_PAGE );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render the settings section description.
	 */
	public function render_settings_section() {
		$description = __(
			'Add an hCaptcha challenge to Jetpack Forms and verify submissions before responses are saved.',
			'jetpack-forms'
		);

		echo '<p>';
		echo esc_html( $description );
		echo '</p>';
	}

	/**
	 * Render the enabled checkbox.
	 */
	public function render_enabled_field() {
		$settings = self::get_settings();
		?>
		<label>
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_NAME ); ?>[enabled]"
				value="1"
				<?php checked( $settings['enabled'] ); ?>
			/>
			<?php esc_html_e( 'Require hCaptcha on Jetpack Forms.', 'jetpack-forms' ); ?>
		</label>
		<?php
	}

	/**
	 * Render the site key input.
	 */
	public function render_site_key_field() {
		$settings = self::get_settings();
		?>
		<input
			type="text"
			class="regular-text"
			name="<?php echo esc_attr( self::OPTION_NAME ); ?>[site_key]"
			value="<?php echo esc_attr( $settings['site_key'] ); ?>"
			autocomplete="off"
		/>
		<?php
	}

	/**
	 * Render the secret key input.
	 */
	public function render_secret_key_field() {
		$settings = self::get_settings();
		?>
		<input
			type="password"
			class="regular-text"
			name="<?php echo esc_attr( self::OPTION_NAME ); ?>[secret_key]"
			value="<?php echo esc_attr( $settings['secret_key'] ); ?>"
			autocomplete="off"
		/>
		<?php
	}

	/**
	 * Sanitize hCaptcha settings.
	 *
	 * @param array|mixed $settings Raw settings.
	 * @return array
	 */
	public function sanitize_settings( $settings ) {
		$settings = is_array( $settings ) ? $settings : array();

		$sanitized = array(
			'enabled'    => ! empty( $settings['enabled'] ),
			'site_key'   => self::sanitize_setting_value( $settings, 'site_key' ),
			'secret_key' => self::sanitize_setting_value( $settings, 'secret_key' ),
		);

		if ( $sanitized['enabled'] && ( '' === $sanitized['site_key'] || '' === $sanitized['secret_key'] ) ) {
			add_settings_error(
				self::OPTION_NAME,
				'jetpack_forms_hcaptcha_missing_keys',
				__( 'Enter both the hCaptcha site key and secret key before enabling hCaptcha for Jetpack Forms.', 'jetpack-forms' )
			);
			$sanitized['enabled'] = false;
		}

		return $sanitized;
	}

	/**
	 * Get default hCaptcha settings.
	 *
	 * @return array
	 */
	private static function get_default_settings() {
		return array(
			'enabled'    => false,
			'site_key'   => '',
			'secret_key' => '',
		);
	}

	/**
	 * Get hCaptcha settings.
	 *
	 * @return array
	 */
	public static function get_settings() {
		$settings = get_option( self::OPTION_NAME, array() );
		$settings = is_array( $settings ) ? $settings : array();
		$settings = wp_parse_args( $settings, self::get_default_settings() );

		/**
		 * Filters Jetpack Forms hCaptcha settings.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $settings hCaptcha settings.
		 */
		return apply_filters( 'jetpack_forms_hcaptcha_settings', $settings );
	}

	/**
	 * Whether hCaptcha is fully configured and enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$settings = self::get_settings();
		$enabled  = ! empty( $settings['enabled'] ) && ! empty( $settings['site_key'] ) && ! empty( $settings['secret_key'] );

		/**
		 * Filters whether hCaptcha protection is enabled for Jetpack Forms.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $enabled  Whether hCaptcha protection is enabled.
		 * @param array $settings hCaptcha settings.
		 */
		return (bool) apply_filters( 'jetpack_forms_hcaptcha_enabled', $enabled, $settings );
	}

	/**
	 * Render the hCaptcha widget for a form.
	 *
	 * @param string $form_hash  Form hash.
	 * @param array  $attributes Optional hCaptcha widget attributes.
	 * @return string
	 */
	public static function render_widget( $form_hash = '', $attributes = array() ) {
		if ( ! self::is_enabled() ) {
			return '';
		}

		$settings = self::get_settings();

		self::enqueue_scripts();
		self::enqueue_styles();

		$widget_attributes = array_merge(
			array(
				'class'        => 'h-captcha',
				'data-sitekey' => $settings['site_key'],
			),
			self::get_widget_data_attributes( $attributes )
		);

		return sprintf(
			'<div class="grunion-field-hcaptcha-wrap grunion-field-wrap" data-jetpack-forms-hcaptcha="%1$s">' .
				'<div%2$s></div>' .
			'</div>',
			esc_attr( $form_hash ),
			self::build_html_attributes( $widget_attributes )
		);
	}

	/**
	 * Replace a manually inserted hCaptcha shortcode or widget with native Jetpack markup.
	 *
	 * @param string $html      Form markup.
	 * @param string $form_hash Form hash.
	 * @return string
	 */
	public static function replace_manual_widget( $html, $form_hash = '' ) {
		if ( ! is_string( $html ) || '' === $html ) {
			return $html;
		}

		$updated_html = self::replace_hcaptcha_shortcode( $html, $form_hash );
		if ( $updated_html !== $html ) {
			return $updated_html;
		}

		return self::replace_hcaptcha_markup( $html, $form_hash );
	}

	/**
	 * Replace a manually inserted hCaptcha shortcode with native Jetpack markup.
	 *
	 * @param string $html      Form markup.
	 * @param string $form_hash Form hash.
	 * @return string
	 */
	private static function replace_hcaptcha_shortcode( $html, $form_hash ) {
		if ( ! str_contains( $html, '[' . self::SHORTCODE ) ) {
			return $html;
		}

		$shortcode_regex = get_shortcode_regex( array( self::SHORTCODE ) );

		$updated_html = preg_replace_callback(
			'~<p>\s*(' . $shortcode_regex . ')\s*</p>~s',
			function ( $matches ) use ( $form_hash ) {
				return self::render_widget( $form_hash, self::parse_shortcode_attributes( $matches[1] ) );
			},
			$html,
			1
		);

		if ( null !== $updated_html && $updated_html !== $html ) {
			return $updated_html;
		}

		$updated_html = preg_replace_callback(
			'~' . $shortcode_regex . '~s',
			function ( $matches ) use ( $form_hash ) {
				return self::render_widget( $form_hash, self::parse_shortcode_attributes( $matches[0] ) );
			},
			$html,
			1
		);

		return null === $updated_html ? $html : $updated_html;
	}

	/**
	 * Replace a manually inserted hCaptcha custom element or div with native Jetpack markup.
	 *
	 * @param string $html      Form markup.
	 * @param string $form_hash Form hash.
	 * @return string
	 */
	private static function replace_hcaptcha_markup( $html, $form_hash ) {
		if ( ! str_contains( $html, 'h-captcha' ) && ! str_contains( $html, 'hcaptcha-widget-id' ) ) {
			return $html;
		}

		$hcaptcha      = self::render_widget( $form_hash, self::get_hcaptcha_markup_attributes( $html ) );
		$error_message = '(?:\s*<div\b(?=[^>]*\bclass=["\'][^"\']*\bcontact-form__input-error\b)[^>]*>[\s\S]*?</div>\s*)?';
		$patterns      = array(
			'~<div\b(?=[^>]*\bclass=(["\'])[^"\']*\bgrunion-field-hcaptcha-wrap\b[^"\']*\1)[^>]*>\s*<(?:div|h-captcha)\b[\s\S]*?</(?:div|h-captcha)>\s*</div>' . $error_message . '~',
			'~(?:\s*<input\b(?=[^>]*\bname=(["\'])hcaptcha-widget-id\1)[^>]*>\s*)?<h-captcha\b[\s\S]*?</h-captcha>(?:\s*<input\b(?=[^>]*\bname=(["\'])(?:hcaptcha(?:_[^"\']+)?_nonce|_wp_http_referer|hcap_hp_[^"\']+|hcap_hp_sig)\2)[^>]*>)*' . $error_message . '~',
			'~<div\b(?=[^>]*\bclass=(["\'])[^"\']*\bh-captcha\b[^"\']*\1)[^>]*>\s*</div>' . $error_message . '~',
		);

		foreach ( $patterns as $pattern ) {
			$updated_html = preg_replace( $pattern, $hcaptcha, $html, 1 );
			if ( null !== $updated_html && $updated_html !== $html ) {
				return $updated_html;
			}
		}

		return $html;
	}

	/**
	 * Parse hCaptcha shortcode attributes.
	 *
	 * @param string $shortcode Shortcode markup.
	 * @return array
	 */
	private static function parse_shortcode_attributes( $shortcode ) {
		if ( ! preg_match( '/^\[' . preg_quote( self::SHORTCODE, '/' ) . '\b([^\]]*)\]/i', $shortcode, $matches ) ) {
			return array();
		}

		$attributes = shortcode_parse_atts( $matches[1] );
		return is_array( $attributes ) ? self::sanitize_attribute_array( $attributes ) : array();
	}

	/**
	 * Extract hCaptcha widget attributes from existing markup.
	 *
	 * @param string $html Form markup.
	 * @return array
	 */
	private static function get_hcaptcha_markup_attributes( $html ) {
		$tag_attributes = '';

		if ( preg_match( '~<h-captcha\b([^>]*)>~', $html, $matches ) ) {
			$tag_attributes = $matches[1];
		} elseif ( preg_match( '~<div\b(?=[^>]*\bclass=(["\'])[^"\']*\bh-captcha\b[^"\']*\1)([^>]*)>~', $html, $matches ) ) {
			$tag_attributes = $matches[2];
		}

		if ( '' === $tag_attributes ) {
			return array();
		}

		$attributes = array();
		foreach ( array( 'theme', 'size', 'tabindex' ) as $attribute ) {
			$data_attribute = 'data-' . $attribute;
			if ( preg_match( '/\s' . preg_quote( $data_attribute, '/' ) . '=(["\'])(.*?)\1/', $tag_attributes, $matches ) ) {
				$attributes[ $attribute ] = html_entity_decode( $matches[2], ENT_QUOTES | ENT_HTML5, get_bloginfo( 'charset' ) );
			}
		}

		return self::sanitize_attribute_array( $attributes );
	}

	/**
	 * Convert supported hCaptcha attributes into data attributes.
	 *
	 * @param array $attributes hCaptcha attributes.
	 * @return array
	 */
	private static function get_widget_data_attributes( $attributes ) {
		if ( ! is_array( $attributes ) ) {
			return array();
		}

		$attribute_map = array(
			'theme'    => 'data-theme',
			'size'     => 'data-size',
			'tabindex' => 'data-tabindex',
		);
		$data_attributes = array();

		foreach ( $attribute_map as $source => $target ) {
			if ( ! isset( $attributes[ $source ] ) || ! is_scalar( $attributes[ $source ] ) ) {
				continue;
			}

			$value = sanitize_text_field( wp_unslash( (string) $attributes[ $source ] ) );
			if ( '' !== $value ) {
				$data_attributes[ $target ] = $value;
			}
		}

		return $data_attributes;
	}

	/**
	 * Build an HTML attribute string.
	 *
	 * @param array $attributes HTML attributes.
	 * @return string
	 */
	private static function build_html_attributes( $attributes ) {
		$html = '';

		foreach ( $attributes as $name => $value ) {
			$html .= sprintf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
		}

		return $html;
	}

	/**
	 * Sanitize a shortcode or markup attribute array.
	 *
	 * @param array $attributes Raw attributes.
	 * @return array
	 */
	private static function sanitize_attribute_array( $attributes ) {
		$sanitized = array();

		foreach ( $attributes as $name => $value ) {
			if ( ! is_string( $name ) || ! is_scalar( $value ) ) {
				continue;
			}

			$sanitized[ sanitize_key( $name ) ] = sanitize_text_field( wp_unslash( (string) $value ) );
		}

		return $sanitized;
	}

	/**
	 * Get hCaptcha error message by code.
	 *
	 * @param string $code Error code.
	 * @return string
	 */
	private static function get_error_message_by_code( $code ) {
		$messages = self::get_error_messages();

		return $messages[ $code ] ?? '';
	}

	/**
	 * Get hCaptcha API error message by response codes.
	 *
	 * @param array $error_codes Error codes returned by hCaptcha.
	 * @return string
	 */
	private static function get_api_error_message( $error_codes ) {
		$messages      = self::get_error_messages();
		$error_codes   = (array) $error_codes;
		$message_parts = array();

		foreach ( $error_codes as $error_code ) {
			if ( isset( $messages[ $error_code ] ) ) {
				$message_parts[] = $messages[ $error_code ];
			}
		}

		if ( ! $message_parts ) {
			return '';
		}

		$header = _n( 'hCaptcha error:', 'hCaptcha errors:', count( $message_parts ), 'jetpack-forms' );

		return $header . ' ' . implode( '; ', $message_parts );
	}

	/**
	 * Create a hCaptcha submission error.
	 *
	 * @param string $message Error message.
	 * @return WP_Error
	 */
	private static function create_submission_error( $message ) {
		return new WP_Error( 'invalid_hcaptcha', esc_html( $message ) );
	}

	/**
	 * Verify the hCaptcha token for a submitted form.
	 *
	 * @param bool|WP_Error $is_spam Current spam status.
	 * @param array         $form    Submitted form values prepared for spam checks.
	 * @return bool|WP_Error
	 */
	public function verify( $is_spam = false, $form = array() ) {
		unset( $form );

		if ( $is_spam || ! self::is_enabled() ) {
			return $is_spam;
		}

		$token = self::get_post_value( 'h-captcha-response' );

		if ( '' === $token ) {
			return self::create_submission_error( self::get_error_message_by_code( 'empty' ) );
		}

		$settings = self::get_settings();
		$body     = array(
			'secret'   => $settings['secret_key'],
			'response' => $token,
			'sitekey'  => $settings['site_key'],
		);
		$remoteip = Contact_Form_Plugin::get_ip_address();

		if ( $remoteip ) {
			$body['remoteip'] = $remoteip;
		}

		/**
		 * Filters the hCaptcha verification URL used by Jetpack Forms.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $url hCaptcha siteverify endpoint.
		 */
		$verify_url = apply_filters( 'jetpack_forms_hcaptcha_verify_url', self::VERIFY_URL );

		$response = wp_remote_post(
			$verify_url,
			array(
				'timeout' => 10,
				'body'    => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			return self::create_submission_error( implode( "\n", $response->get_error_messages() ) );
		}

		$response_body_raw = wp_remote_retrieve_body( $response );

		if ( '' === $response_body_raw ) {
			return self::create_submission_error( self::get_error_message_by_code( 'fail' ) );
		}

		$response_body = json_decode( $response_body_raw, true );

		if ( is_array( $response_body ) && ! empty( $response_body['success'] ) ) {
			return false;
		}

		$error_codes = is_array( $response_body ) ? ( $response_body['error-codes'] ?? array() ) : array();
		$message     = self::get_api_error_message( $error_codes );

		return self::create_submission_error( $message ? $message : self::get_error_message_by_code( 'fail' ) );
	}

	/**
	 * Add async and defer attributes to the hCaptcha API script.
	 *
	 * @param string $tag    Script tag.
	 * @param string $handle Script handle.
	 * @param string $src    Script source.
	 * @return string
	 */
	public function add_script_attributes( $tag, $handle, $src ) {
		unset( $src );

		if ( self::SCRIPT_HANDLE !== $handle ) {
			return $tag;
		}

		return str_replace( ' src', ' async defer src', $tag );
	}

	/**
	 * Enqueue the hCaptcha API script.
	 */
	private static function enqueue_scripts() {
		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			self::API_SCRIPT,
			array(),
			null,
			true
		);
	}

	/**
	 * Enqueue hCaptcha alignment styles.
	 */
	private static function enqueue_styles() {
		if ( self::$styles_queued ) {
			return;
		}

		wp_add_inline_style(
			'grunion.css',
			'
form.contact-form .grunion-field-hcaptcha-wrap.grunion-field-wrap {
	flex-direction: row;
}

form.contact-form .grunion-field-hcaptcha-wrap .h-captcha {
	margin-block-end: 0;
}
'
		);

		self::$styles_queued = true;
	}

	/**
	 * Get a sanitized POST value.
	 *
	 * @param string $key POST key.
	 * @return string
	 */
	private static function get_post_value( $key ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		return isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : '';
	}

	/**
	 * Sanitize a scalar settings value.
	 *
	 * @param array  $settings Settings array.
	 * @param string $key      Setting key.
	 * @return string
	 */
	private static function sanitize_setting_value( array $settings, $key ) {
		if ( ! isset( $settings[ $key ] ) || ! is_scalar( $settings[ $key ] ) ) {
			return '';
		}

		return sanitize_text_field( wp_unslash( (string) $settings[ $key ] ) );
	}
}
