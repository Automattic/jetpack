<?php

/**
 * Disable direct access/execution to/of the widget code.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_EU_Cookie_Law_Widget' ) ) {
	/**
	 * EU Cookie Law Widget
	 *
	 * Display the EU Cookie Law banner in the bottom part of the screen.
	 */
	class Jetpack_EU_Cookie_Law_Widget extends WP_Widget {
		/**
		 * EU Cookie Law cookie name.
		 *
		 * @var string
		 */
		public static $cookie_name = 'eucookielaw';

		/**
		 * EU Cookie Law cookie validity (30 days).
		 *
		 * @var int
		 */
		public static $cookie_validity = 2592000;

		/**
		 * Default hide options.
		 *
		 * @var array
		 */
		private $hide_options = array(
			'button',
			'scroll',
			'time',
		);

		/**
		 * Default text options.
		 *
		 * @var array
		 */
		private $text_options = array(
			'default',
			'custom',
		);

		/**
		 * Default color scheme options.
		 *
		 * @var array
		 */
		private $color_scheme_options = array(
			'default',
			'negative',
		);

		/**
		 * Default policy URL options.
		 *
		 * @var array
		 */
		private $policy_url_options = array(
			'default',
			'custom',
		);

		/**
		 * Constructor.
		 */
		function __construct() {
			parent::__construct(
				'eu_cookie_law_widget',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', esc_html__( 'EU Cookie Law Banner', 'jetpack' ) ),
				array(
					'description' => esc_html__( 'Display a banner for compliance with the EU Cookie Law.', 'jetpack' ),
					'customize_selective_refresh' => true,
				),
				array()
			);

			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_scripts' ) );
			}
		}

		/**
		 * Enqueue scripts and styles.
		 */
		function enqueue_frontend_scripts() {
			wp_enqueue_style( 'eu-cookie-law-style', plugins_url( 'eu-cookie-law/style.css', __FILE__ ), array(), '20170403' );
			wp_enqueue_script( 'eu-cookie-law-script', plugins_url( 'eu-cookie-law/eu-cookie-law.js', __FILE__ ), array( 'jquery' ), '20170404', true );
		}

		/**
		 * Return an associative array of default values.
		 *
		 * These values are used in new widgets.
		 *
		 * @return array Default values for the widget options.
		 */
		public function defaults() {
			return array(
				'hide'               => $this->hide_options[0],
				'hide-timeout'       => 30,
				'text'               => $this->text_options[0],
				'customtext'         => '',
				'color-scheme'       => $this->color_scheme_options[0],
				'policy-url'         => $this->policy_url_options[0],
				'default-policy-url' => 'https://jetpack.com/support/cookies/',
				'custom-policy-url'  => '',
				'policy-link-text'   => esc_html__( 'Our Cookie Policy', 'jetpack' ),
				'button'             => esc_html__( 'Close and accept', 'jetpack' ),
				'default-text'       => esc_html__( 'Privacy & Cookies: This site uses cookies.', 'jetpack' ),
			);
		}

		/**
		 * Front-end display of the widget.
		 *
		 * @param array $args     Widget arguments.
		 * @param array $instance Saved values from database.
		 */
		public function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			echo $args['before_widget'];
			require( dirname( __FILE__ ) . '/eu-cookie-law/widget.php' );
			echo $args['after_widget'];
			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'eu_cookie_law' );
		}

		/**
		 * Back-end widget form.
		 *
		 * @param array $instance Previously saved values from database.
		 */
		public function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );
			require( dirname( __FILE__ ) . '/eu-cookie-law/form.php' );
		}

		/**
		 * Sanitize widget form values as they are saved.
		 *
		 * @param  array $new_instance Values just sent to be saved.
		 * @param  array $old_instance Previously saved values from database.
		 * @return array Updated safe values to be saved.
		 */
		public function update( $new_instance, $old_instance ) {
			$instance = array();
			$defaults = $this->defaults();

			$instance['hide']         = $this->filter_value( $new_instance['hide'], $this->hide_options );
			$instance['text']         = $this->filter_value( $new_instance['text'], $this->text_options );
			$instance['color-scheme'] = $this->filter_value( $new_instance['color-scheme'], $this->color_scheme_options );
			$instance['policy-url']   = $this->filter_value( $new_instance['policy-url'], $this->policy_url_options );

			if ( isset( $new_instance['hide-timeout'] ) ) {
				// Time can be a value between 3 and 1000 seconds.
				$instance['hide-timeout'] = min( 1000, max( 3, intval( $new_instance['hide-timeout'] ) ) );
			}

			if ( isset( $new_instance['customtext'] ) ) {
				$instance['customtext'] = mb_substr( wp_kses( $new_instance['customtext'], array() ), 0, 4096 );
			} else {
				$instance['text'] = $this->text_options[0];
			}

			if ( isset( $new_instance['custom-policy-url'] ) ) {
				$instance['custom-policy-url'] = esc_url( $new_instance['custom-policy-url'], array( 'http', 'https' ) );

				if ( strlen( $instance['custom-policy-url'] ) < 10 ) {
					unset( $instance['custom-policy-url'] );
					$instance['policy-url'] = $this->policy_url_options[0];
				}
			} else {
				$instance['policy-url'] = $this->policy_url_options[0];
			}

			if ( isset( $new_instance['policy-link-text'] ) ) {
				$instance['policy-link-text'] = trim( mb_substr( wp_kses( $new_instance['policy-link-text'], array() ), 0, 100 ) );
			}

			if ( empty( $instance['policy-link-text'] ) || $instance['policy-link-text'] == $defaults['policy-link-text'] ) {
				unset( $instance['policy-link-text'] );
			}

			if ( isset( $new_instance['button'] ) ) {
				$instance['button'] = trim( mb_substr( wp_kses( $new_instance['button'], array() ), 0, 100 ) );
			}

			if ( empty( $instance['button'] ) || $instance['button'] == $defaults['button'] ) {
				unset( $instance['button'] );
			}

			// Show the banner again if a setting has been changed.
			setcookie( self::$cookie_name, '', time() - 86400, '/' );

			return $instance;
		}

		/**
		 * Set the EU Cookie Law cookie.
		 */
		public static function add_consent_cookie() {
			if ( ! isset( $_POST['eucookielaw'] ) || 'accept' !== $_POST['eucookielaw'] ) {
				return;
			}

			if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'eucookielaw' ) ) {
				return;
			}

			// Cookie is valid for 30 days, so the user will be shown the banner again after 30 days.
			setcookie( self::$cookie_name, current_time( 'timestamp' ), time() + self::$cookie_validity, '/' );

			wp_safe_redirect( $_POST['redirect_url'] );
		}

		/**
		 * Check if the value is allowed and not empty.
		 *
		 * @param  string $value Value to check.
		 * @param  array  $allowed Array of allowed values.
		 *
		 * @return string $value if pass the check or first value from allowed values.
		 */
		function filter_value( $value, $allowed = array() ) {
			$allowed = (array) $allowed;
			if ( empty( $value ) || ( ! empty( $allowed ) && ! in_array( $value, $allowed ) ) ) {
				$value = $allowed[0];
			}
			return $value;
		}
	}

	// Register Jetpack_EU_Cookie_Law_Widget widget.
	function jetpack_register_eu_cookie_law_widget() {
		register_widget( 'Jetpack_EU_Cookie_Law_Widget' );
	};

  // Only load the widget if we're inside the admin or the user has not given their consent to accept cookies.
	if ( is_admin() || empty( $_COOKIE[ Jetpack_EU_Cookie_Law_Widget::$cookie_name ] ) ) {
		add_action( 'widgets_init', 'jetpack_register_eu_cookie_law_widget' );
		add_action( 'init', array( 'Jetpack_EU_Cookie_Law_Widget', 'add_consent_cookie' ) );
	}
}
