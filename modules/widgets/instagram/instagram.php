<?php /*

**************************************************************************

Plugin Name:  Instagram Widget
Description:  Display some Instagram photos via a widget.
Author:       Automattic Inc.
Author URI:   http://automattic.com/

**************************************************************************/

/**
 * This is the actual Instagram widget along with other code that only applies to the widget.
 */

use Automattic\Jetpack\Connection\Client;

class WPcom_Instagram_Widget extends WP_Widget {

	const ID_BASE = 'wpcom_instagram_widget';

	public $valid_options;
	public $defaults;

	/**
	 * Sets the widget properties in WordPress, hooks a few functions, and sets some widget options.
	 */
	function __construct() {
		parent::__construct(
			self::ID_BASE,
			__( 'Instagram', 'wpcom-instagram-widget' ),
			array(
				'description' => __( 'Display your latest Instagram photos.', 'wpcom-instagram-widget' ),
			)
		);

		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_css' ) );

		$this->valid_options = array(
			'max_columns' => 3,
			'max_count'   => 20,
		);

		$this->defaults = array(
			'token_id' => null,
			'title'    => __( 'Instagram', 'wpcom-instagram-widget' ),
			'columns'  => 2,
			'count'    => 6,
		);
	}

	/**
	 * Enqueues the widget's frontend CSS but only if the widget is currently in use.
	 */
	public function enqueue_css() {
		if ( ! is_active_widget( false, false, self::ID_BASE ) )
			return;

		wp_enqueue_style( self::ID_BASE, plugins_url( 'instagram.css', __FILE__ ) );
	}

	/**
	 * Updates the widget's option in the database to have the passed Keyring token ID.
	 * This is so the user doesn't have to click the "Save" button when we want to set it.
	 *
	 * @param int $token_id A Keyring token ID.
	 */
	public function update_widget_token_id( $token_id ) {
		$widget_options = $this->get_settings();

		if ( ! is_array( $widget_options[ $this->number ] ) )
			$widget_options[ $this->number ] = $this->defaults;

		$widget_options[ $this->number ]['token_id'] = (int) $token_id;

		$this->save_settings( $widget_options );
	}

	/**
	 * Validates the widget instance's token ID and then uses it to fetch images from Instagram.
	 * It then caches the result which it will use on subsequent pageviews.
	 * Keyring is not loaded nor is a remote request is not made in the event of a cache hit.
	 *
	 * @param array $instance A widget $instance, as passed to a widget's widget() method.
	 * @return string|array A string on error, an array of images on success.
	 */
	public function get_data( $instance ) {
		if ( empty( $instance['token_id'] ) ) {
			do_action( 'wpcomsh_log', 'Instagram widget: failed to get images: no token_id present' );
			return 'ERROR';
		}

		$cache_time = MINUTE_IN_SECONDS;
		$transient_key = implode( '|', array( 'wpcomsh', $instance['token_id'], $instance['count'] ) );
		$cached_images = get_transient( $transient_key );
		if ( $cached_images ) {
			return $cached_images;
		}

		$site = Jetpack_Options::get_option( 'id' );
		$path = sprintf( '/sites/%s/instagram/%s?count=%s', $site, $instance['token_id'], $instance['count'] );
		$result = $this->wpcom_json_api_request_as_blog( $path, 2, array( 'headers' => array( 'content-type' => 'application/json' ) ), null, 'wpcom' );

		$response_code = wp_remote_retrieve_response_code( $result );
		if ( 200 !== $response_code ) {
			do_action( 'wpcomsh_log', 'Instagram widget: failed to get images: API returned code ' . $response_code );
			set_transient( $transient_key, 'ERROR', $cache_time );
			return 'ERROR';
		}

		$data = json_decode( wp_remote_retrieve_body( $result ), true );
		if ( ! isset( $data['images'] ) || ! is_array( $data['images'] ) ) {
			do_action( 'wpcomsh_log', 'Instagram widget: failed to get images: API returned no images; got this instead: ' . json_encode( $data ) );
			set_transient( $transient_key, 'ERROR', $cache_time );
			return 'ERROR';
		}

		$cache_time = 20 * MINUTE_IN_SECONDS;
		set_transient( $transient_key, $data, $cache_time );
		return $data;
	}

	private function wpcom_json_api_request_as_blog( $path, $version = 1, $args = array(), $body = null, $base_api_path = 'rest' ) {
		if ( ! class_exists( 'Jetpack_Client' ) ) {
			return new WP_Error( 'missing_jetpack', 'The `Jetpack_Client` class is missing' );
		}
		$filtered_args = array_intersect_key( $args, array(
			'headers'     => 'array',
			'method'      => 'string',
			'timeout'     => 'int',
			'redirection' => 'int',
			'stream'      => 'boolean',
			'filename'    => 'string',
			'sslverify'   => 'boolean',
		) );
		/**
		 * Determines whether Jetpack can send outbound https requests to the WPCOM api.
		 *
		 * @since 3.6.0
		 *
		 * @param bool $proto Defaults to true.
		 */
		$proto = apply_filters( 'jetpack_can_make_outbound_https', true ) ? 'https' : 'http';
		// unprecedingslashit
		$_path = preg_replace( '/^\//', '', $path );
		// Use GET by default whereas `remote_request` uses POST
		$request_method = ( isset( $filtered_args['method'] ) ) ? $filtered_args['method'] : 'GET';
		$validated_args = array_merge( $filtered_args, array(
			'url'     => sprintf( '%s://%s/%s/v%s/%s', $proto, JETPACK__WPCOM_JSON_API_HOST, $base_api_path, $version, $_path ),
			'blog_id' => (int) Jetpack_Options::get_option( 'id' ),
			'method'  => $request_method,
		) );
		return Jetpack_Client::remote_request( $validated_args, $body );
	}

	/**
	 * Outputs the contents of the widget on the front end.
	 *
	 * If the widget is unconfigured, a configuration message is displayed to users with admin access
	 * and the entire widget is hidden from everyone else to avoid displaying an empty widget.
	 *
	 * @param array $args The sidebar arguments that control the wrapping HTML.
	 * @param array $instance The widget instance (configuration options).
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		// Don't display anything to non-blog admins if the widgets is unconfigured
		if ( ! $instance['token_id'] && ! current_user_can( 'edit_theme_options' ) )
			return;

		echo $args['before_widget'];

		// Always show a title on an unconfigured widget
		if ( ! $instance['token_id'] && empty( $instance['title'] ) )
			$instance['title'] = $this->defaults['title'];

		if ( ! empty( $instance['title'] ) )
			echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title'];

		if ( ! $instance['token_id'] ) {
			echo '<a class="button-primary" target="_top" href="' . $this->get_connect_url() . '">' . __( 'Connect Instagram Account', 'wpcom-instagram-widget' ) . '</a>';
		} else {
			$data   = $this->get_data( $instance );
			$images = $data['images'];

			if ( ! is_array( $images ) ) {
				echo '<p>' . __( 'There was an error retrieving images from Instagram. An attempt will be remade in a few minutes.', 'wpcom-instagram-widget' ) . '</p>';
			}
			elseif ( ! $images ) {
				echo '<p>' . __( 'No Instagram images were found.', 'wpcom-instagram-widget' ) . '</p>';
			} else {

				echo '<div class="' . esc_attr( 'wpcom-instagram-images wpcom-instagram-columns-' . (int) $instance['columns'] ) . '">' . "\n";
				foreach ( $images as $image ) {
					echo '<a href="' . esc_url( $image['link'] ) . '" target="' . esc_attr( apply_filters( 'wpcom_instagram_widget_target', '_self' ) ) . '"><div class="sq-bg-image" style="background-image: url(' . esc_url( set_url_scheme( $image['url'] ) ) . ')"><span class="screen-reader-text">' . esc_attr( $image['title'] ) . '</span></div></a>' . "\n";
				}
				echo "</div>\n";
			}
		}

		echo $args['after_widget'];
	}

	private function get_query_params() {
		$page = ( is_customize_preview() ) ? 'customize.php' : 'widgets.php';
		return array(
			'siteurl'             => site_url() . '/wp-admin/' . $page,
			'jetpack'             => true,
			'instagram_widget_id' => $this->number,
			'is_customizer'       => is_customize_preview(),
		);
	}

	private function get_connect_url() {
		$jetpack_blog_id = Jetpack::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/external-services', $jetpack_blog_id )
		);

		if ( is_wp_error( $response ) ) {
			do_action( 'wpcomsh_log', 'Instagram widget: failed to connect to API via wpcom api.' );

			echo '<p>' . __( 'Instagram is currently experiencing connectivity issues, please try again later to connect.', 'wpcom-instagram-widget' ) . '</p>';
			return;
		}

		$body = json_decode( $response['body'] );
		$connect_URL = $body->services->instagram->connect_URL;
		$query_params = $this->get_query_params();
		$query_params['hash'] = $this->get_paramater_hash( $query_params );
		$url = add_query_arg(
			$query_params,
			$connect_URL
		);
		return $url;
	}

	/**
	 * Outputs the widget configuration form for the widget administration page.
	 * Allows the user to add new Instagram Keyring tokens and more.
	 *
	 * @param array $instance The widget instance (configuration options).
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		// If coming back to the widgets page from an action, expand this widget
		if ( isset( $_GET['instagram_widget_id'] ) && $_GET['instagram_widget_id'] == $this->number ) {
			echo '<script type="text/javascript">jQuery(document).ready(function($){ $(\'.widget[id$="wpcom_instagram_widget-' . esc_js( $this->number ) . '"] .widget-inside\').slideDown(\'fast\'); });</script>';
		}

		// If coming back from an OAuth authentication, validate and use the one in the URL
		if ( isset( $_GET['instagram_widget_id'] ) && $_GET['instagram_widget_id'] == $this->number
			&& ! empty( $_GET['instagram_widget'] ) && 'connection_verified' == $_GET['instagram_widget']
			&& ! empty( $_GET['token_id'] ) && $instance['token_id'] !== (int) $_GET['token_id'] && $this->validate_parameters() ) {
				$instance['token_id'] = (int) $_GET['token_id'];

			$this->update_widget_token_id( $instance['token_id'] );
		}
		// If removing the widget's stored token ID
		elseif ( $instance['token_id'] && isset( $_GET['instagram_widget_id'] ) && $_GET['instagram_widget_id'] == $this->number && ! empty( $_GET['instagram_widget'] ) && 'remove_token' == $_GET['instagram_widget'] ) {
			if ( empty( $_GET['nonce'] ) || ! wp_verify_nonce( $_GET['nonce'], 'instagram-widget-remove-token-' . $this->number . '-' . $instance['token_id'] ) ) {
				wp_die( __( 'Missing or invalid security nonce.', 'wpcom-instagram-widget' ) );
			}
			$site = Jetpack_Options::get_option( 'id' );
			$path = sprintf( '/sites/%s/instagram/%s/remove', $site, $instance['token_id'] );
			$result = $this->wpcom_json_api_request_as_blog( $path, 2, array( 'headers' => array( 'content-type' => 'application/json' ) ), null, 'wpcom' );

			$response_code = wp_remote_retrieve_response_code( $result );

			if ( 200 !== $response_code ) {
				do_action( 'wpcomsh_log', 'Instagram widget: failed to remove keyring token: API returned code ' . $response_code );
				return 'ERROR';
			}
			$instance['token_id'] = $this->defaults['token_id'];

			$this->update_widget_token_id( $instance['token_id'] );
		}
		// If a token ID is stored, make sure it's still valid
		elseif ( $instance['token_id'] ) {
			$this->update_widget_token_id( $instance['token_id'] );
		}

		// No connection, or a legacy API token? Display a connection link.
		if ( ! $instance['token_id'] ) {
			echo '<p>' . __( '<strong>Important: You must first click Save to activate this widget <em>before</em> connecting your account.</strong> After saving the widget, click the button below to authorize your Instagram account.', 'wpcom-instagram-widget' ) . '</p>';
			echo '<p style="text-align:center"><a class="button-primary" target="_top" href="' . esc_url( $this->get_connect_url() ) . '">' . __( 'Connect Instagram Account', 'wpcom-instagram-widget' ) . '</a></p>';
			echo '<p><small>' . sprintf( __( 'Having trouble? Try <a href="%s" target="_blank">logging into the correct account</a> on Instagram.com first.', 'wpcom-instagram-widget' ), 'https://instagram.com/accounts/login/' ) . '</small></p>';
			return;
		}

		// Connected account
		$page = ( is_customize_preview() ) ? 'customize.php' : 'widgets.php';
		$query_args = array(
			'instagram_widget_id' => $this->number,
			'instagram_widget'    => 'remove_token',
			'nonce'               => wp_create_nonce( 'instagram-widget-remove-token-' . $this->number . '-' . $instance['token_id'] ),
		);

		if ( is_customize_preview() ) {
			$query_args['autofocus[panel]'] = 'widgets';
		}

		$remove_token_id_url = add_query_arg( $query_args, admin_url( $page ) );

		$data = $this->get_data( $instance );
		echo '<p>' . sprintf( __( '<strong>Connected Instagram Account</strong><br /> <a href="%1$s">%2$s</a> | <a href="%3$s">remove</a>', 'wpcom-instagram-widget' ), esc_url( 'http://instagram.com/' . $data['external_name'] ), esc_html( $data['external_name'] ), esc_url( $remove_token_id_url ) ) . '</p>';

		// Title
		echo '<p><label><strong>' . __( 'Widget Title', 'wpcom-instagram-widget' ) . '</strong> <input type="text" id="' . esc_attr( $this->get_field_id( 'title' ) ) . '" name="' . esc_attr( $this->get_field_name( 'title' ) ) . '" value="' . esc_attr( $instance['title'] ) . '" class="widefat" /></label></p>';

		// Number of images to show
		echo '<p><label>';
		echo '<strong>' . __( 'Images', 'wpcom-instagram-widget' ) . '</strong><br />';
		echo __( 'Number to display:', 'wpcom-instagram-widget' ) . ' ';
		echo '<select name="' . esc_attr( $this->get_field_name( 'count' ) ) . '">';
		for ( $i = 1; $i <= $this->valid_options['max_count']; $i++ ) {
			echo '<option value="' . esc_attr( $i ) . '"' . selected( $i, $instance['count'], false ) . '>' . $i . '</option>';
		}
		echo '</select>';
		echo '</label></p>';

		// Columns
		echo '<p><label>';
		echo '<strong>' . __( 'Layout', 'wpcom-instagram-widget' ) . '</strong><br />';
		echo __( 'Number of columns:', 'wpcom-instagram-widget' ) . ' ';
		echo '<select name="' . esc_attr( $this->get_field_name( 'columns' ) ) . '">';
		for ( $i = 1; $i <= $this->valid_options['max_columns']; $i++ ) {
			echo '<option value="' . esc_attr( $i ) . '"' . selected( $i, $instance['columns'], false ) . '>' . $i . '</option>';
		}
		echo '</select>';
		echo '</label></p>';

		echo '<p><small>' . sprintf( __( 'New images may take up to %d minutes to show up on your site.', 'wpcom-instagram-widget' ), 15 ) . '</small></p>';
	}

	/**
	 * Validates and sanitizes the user-supplied widget options.
	 *
	 * @param array $new_instance The user-supplied values.
	 * @param array $old_instance The existing widget options.
	 * @return array A validated and sanitized version of $new_instance.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $this->defaults;

		$instance['token_id'] = $old_instance['token_id'];

		$instance['title'] = strip_tags( $new_instance['title'] );

		$instance['columns'] = max( 1, min( $this->valid_options['max_columns'], (int) $new_instance['columns'] ) );

		$instance['count'] = max( 1, min( $this->valid_options['max_count'], (int) $new_instance['count'] ) );

		return $instance;
	}

	/**
	 * Get an sha256 hash of a seialized array of parameters
	 *
	 * @param string $serialized_parameters A serialized string of a parameter array.
	 * @return string An sha256 hash
	 */
	function get_paramater_hash( $parameters ) {
		return hash_hmac( 'sha256', serialize( $parameters ), NONCE_KEY );
	}

	/**
	 * Validates that a hash of the parameter array matches the included hash parameter
	 *
	 * @param array $parameters An array of query parameters.
	 * @return array An array of the parameters minus the hash
	 */
	function validate_parameters() {
		if ( empty( $_GET['hash'] ) ) {
			return false;
		}

		return $_GET['hash'] === $this->get_paramater_hash( $this->get_query_params() );

	}
}

add_action( 'widgets_init', function() {
	register_widget( 'WPcom_Instagram_Widget' );
} );
