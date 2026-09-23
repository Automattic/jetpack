<?php
/**
 * Publicize class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Jetpack_IXR_Client;
use Jetpack_Options;
use WP_Error;
use WP_Post;

/**
 * Extend the base class with Jetpack-specific functionality.
 */
class Publicize extends Publicize_Base {

	const JETPACK_SOCIAL_CONNECTIONS_TRANSIENT = 'jetpack_social_connections';

	/**
	 * Transitory storage of connection testing results.
	 *
	 * @var array
	 */
	private $test_connection_results = array();

	/**
	 * Property to store the results of fetching the connections.
	 *
	 * @var null|array
	 */
	private $current_connections = null;

	/**
	 * Add hooks.
	 */
	public function __construct() {
		parent::__construct();

		add_filter( 'jetpack_xmlrpc_unauthenticated_methods', array( $this, 'register_update_publicize_connections_xmlrpc_method' ) );

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags' ), 10, 2 );

		add_action( 'wp_insert_post', array( $this, 'save_publicized' ), 11, 2 );

		add_action( 'connection_disconnected', array( $this, 'add_disconnect_notice' ) );
	}

	/**
	 * Add a notice when a connection has been disconnected.
	 */
	public function add_disconnect_notice() {
		add_action( 'admin_notices', array( $this, 'display_disconnected' ) );
	}

	/**
	 * Force user connection before showing the Publicize UI.
	 *
	 * @deprecated $$next-version$$ Settings > Sharing no longer hosts the Publicize UI.
	 *
	 * @return void
	 */
	public function force_user_connection() {
		_deprecated_function( __METHOD__, 'publicize-$$next-version$$' );
	}

	/**
	 * Show a warning when Publicize does not have a connection.
	 *
	 * @deprecated $$next-version$$ Settings > Sharing no longer hosts the Publicize UI.
	 *
	 * @return void
	 */
	public function admin_page_warning() {
		_deprecated_function( __METHOD__, 'publicize-$$next-version$$' );
	}

	/**
	 * Show error on settings page if applicable.
	 *
	 * @deprecated $$next-version$$ Settings > Sharing no longer hosts connection errors.
	 *
	 * @return void
	 */
	public function admin_page_load() {
		_deprecated_function( __METHOD__, 'publicize-$$next-version$$' );
	}

	/**
	 * Display an error message.
	 *
	 * @deprecated $$next-version$$ Settings > Sharing no longer hosts connection errors.
	 *
	 * @return void
	 */
	public function display_connection_error() {
		_deprecated_function( __METHOD__, 'publicize-$$next-version$$' );
	}

	/**
	 * Remove a Publicize Connection.
	 *
	 * @param string    $service_name 'facebook', 'twitter', etc.
	 * @param string    $connection_id Connection ID.
	 * @param false|int $_blog_id The blog ID. Use false (default) for the current blog.
	 * @param false|int $_user_id The user ID. Use false (default) for the current user.
	 * @param bool      $force_delete Whether to skip permissions checks.
	 * @return false|void False on failure. Void on success.
	 */
	public function disconnect( $service_name, $connection_id, $_blog_id = false, $_user_id = false, $force_delete = false ) {
		return Keyring_Helper::disconnect( $service_name, $connection_id, $_blog_id, $_user_id, $force_delete );
	}

	/**
	 * Set updated Publicize connections in a transient.
	 *
	 * @param mixed $publicize_connections Updated connections.
	 * @return true
	 */
	public function receive_updated_publicize_connections( $publicize_connections ) {

		$publicize_connections = self::filter_usable_connections( $publicize_connections );

		// Populate the cache with the new data.
		Connections::get_all( array( 'ignore_cache' => true ) );

		$expiry = 3600 * 4;
		if ( ! set_transient( self::JETPACK_SOCIAL_CONNECTIONS_TRANSIENT, $publicize_connections, $expiry ) ) {
			// If the transient has beeen set in another request, the call to set_transient can fail. If so,
			// we can delete the transient and try again.
			$this->clear_connections_transient();
			set_transient( self::JETPACK_SOCIAL_CONNECTIONS_TRANSIENT, $publicize_connections, $expiry );
		}
		// Regardless of whether the transient is set ok, let's set and use the local property for this request.
		$this->current_connections = $publicize_connections;
		return true;
	}

	/**
	 * Drop connections we cannot attribute to a user.
	 *
	 * A missing user ID reads as "shared with everyone" in is_global_connection(), so such a
	 * connection would be exposed to every user on the site. User ID 0 is a genuine shared
	 * connection and is kept; unknown fields pass through, as WPCOM adds to this payload.
	 *
	 * @param mixed $publicize_connections Connections, keyed by service name.
	 * @return array
	 */
	private static function filter_usable_connections( $publicize_connections ) {
		// An empty payload is valid - it means the site has no connections left.
		if ( ! is_array( $publicize_connections ) ) {
			return array();
		}

		$usable_connections = array();

		foreach ( $publicize_connections as $service_name => $connections_for_service ) {
			if ( ! is_array( $connections_for_service ) ) {
				continue;
			}

			foreach ( $connections_for_service as $id => $connection ) {
				if ( ! isset( $connection['connection_data']['user_id'] ) || ! is_numeric( $connection['connection_data']['user_id'] ) ) {
					continue;
				}

				$usable_connections[ $service_name ][ $id ] = $connection;
			}
		}

		return $usable_connections;
	}

	/**
	 * Add method to update Publicize connections.
	 *
	 * @todo Kept as a fallback for the jetpack/v4/publicize/connections/sync REST endpoint that replaced it; remove after a few releases (CONNECT-446).
	 *
	 * @param array $methods Array of registered methods.
	 * @return array
	 */
	public function register_update_publicize_connections_xmlrpc_method( $methods ) {
		return array_merge(
			$methods,
			array(
				'jetpack.updatePublicizeConnections' => array( $this, 'receive_updated_publicize_connections' ),
			)
		);
	}

	/**
	 * Get a list of all connections.
	 *
	 * Google Plus is no longer a functional service, so we remove it from the list.
	 *
	 * @return array
	 */
	public function get_all_connections() {
		$this->refresh_connections();

		$connections = $this->current_connections;

		if ( empty( $connections ) ) {
			$connections = array();
		}

		if ( isset( $connections['google_plus'] ) ) {
			unset( $connections['google_plus'] );
		}
		return $connections;
	}

	/**
	 * Get connections for a specific service.
	 *
	 * @param string    $service_name 'facebook', 'twitter', etc.
	 * @param false|int $_blog_id The blog ID. Use false (default) for the current blog.
	 * @param false|int $_user_id The user ID. Use false (default) for the current user.
	 * @return false|object[]|array[]
	 */
	public function get_connections( $service_name, $_blog_id = false, $_user_id = false ) {
		if ( false === $_user_id ) {
			$_user_id = $this->user_id();
		}

		$connections           = $this->get_all_connections();
		$connections_to_return = array();

		if ( ! empty( $connections ) && is_array( $connections ) ) {
			if ( ! empty( $connections[ $service_name ] ) ) {
				foreach ( $connections[ $service_name ] as $id => $connection ) {
					if ( $this->is_global_connection( $connection ) || $_user_id === (int) $connection['connection_data']['user_id'] ) {
						$connections_to_return[ $id ] = $connection;
					}
				}
			}

			return $connections_to_return;
		}

		return false;
	}

	/**
	 * Get all connections for a specific user.
	 *
	 * @param array $args Arguments to run operations such as force refresh and connection test results.
	 * @return array
	 */
	public function get_all_connections_for_user( $args = array() ) {
		if ( ( isset( $args['clear_cache'] ) && $args['clear_cache'] )
		|| ( isset( $args['test_connections'] ) && $args['test_connections'] ) ) {
			$this->clear_connections_transient();
		}
		$connections = $this->get_all_connections();

		$connections_to_return = array();
		if ( ! empty( $connections ) ) {
			foreach ( (array) $connections as $service_name => $connections_for_service ) {
				foreach ( $connections_for_service as $id => $connection ) {
					$user_id = (int) $connection['connection_data']['user_id'];
					if ( $user_id === 0 || $this->user_id() === $user_id ) {
						$connections_to_return[ $service_name ][ $id ] = $connection;
					}
				}
			}
		}

		return $connections_to_return;
	}

	/**
	 * To add the connection test results to the connections.
	 *
	 * @param array $connections The Jetpack Social connections.

	 * @return array
	 */
	public function add_connection_test_results( $connections ) {
		$path                   = sprintf( '/sites/%d/publicize/connection-test-results', absint( Jetpack_Options::get_option( 'id' ) ) );
		$response               = Client::wpcom_json_api_request_as_user( $path, '2', array(), null, 'wpcom' );
		$connection_results     = json_decode( wp_remote_retrieve_body( $response ), true );
		$connection_results_map = array();

		foreach ( $connection_results as $connection_result ) {
			$connection_results_map[ $connection_result['connection_id'] ] = $connection_result['test_success'] ? 'ok' : 'broken';
		}
		foreach ( $connections as $key => $connection ) {
			if ( isset( $connection_results_map[ $connection['connection_id'] ] ) ) {
				$connections[ $key ]['status'] = $connection_results_map[ $connection['connection_id'] ];
			}
		}

		return $connections;
	}

	/**
	 * Get a connections for a user.
	 *
	 * @param int $connection_id The connection_id.

	 * @return array
	 */
	public function get_connection_for_user( $connection_id ) {
		foreach ( $this->get_all_connections_for_user() as $connection ) {
			if ( (int) $connection['connection_id'] === (int) $connection_id ) {
				return $connection;
			}
		}
		return array();
	}

	/**
	 * Get the ID of a connection.
	 *
	 * @param array $connection The connection.
	 * @return string
	 */
	public function get_connection_id( $connection ) {
		return $connection['connection_data']['id'];
	}

	/**
	 * Get the unique ID of a connection.
	 *
	 * @param array $connection The connection.
	 * @return string
	 */
	public function get_connection_unique_id( $connection ) {
		return $connection['connection_data']['token_id'];
	}

	/**
	 * Get the meta of a connection.
	 *
	 * @param array $connection The connection.
	 * @return array
	 */
	public function get_connection_meta( $connection ) {
		$connection['user_id'] = $connection['connection_data']['user_id']; // Allows for shared connections.
		return $connection;
	}

	/**
	 * Show a message that the connection has been removed.
	 */
	public function display_disconnected() {
		echo "<div class='updated'>\n";
		echo '<p>' . esc_html( __( 'That connection has been removed.', 'jetpack-publicize-pkg' ) ) . "</p>\n";
		echo "</div>\n\n";
	}

	/**
	 * If applicable, globalize a connection.
	 *
	 * @param string $connection_id Connection ID.
	 */
	public function globalization( $connection_id ) {
		if ( isset( $_REQUEST['global'] ) && 'on' === $_REQUEST['global'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce check happens earlier in the process before we get here
			if ( ! current_user_can( $this->GLOBAL_CAP ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				return;
			}

			$this->globalize_connection( $connection_id );
		}
	}

	/**
	 * Globalize a connection.
	 *
	 * @param string $connection_id Connection ID.
	 */
	public function globalize_connection( $connection_id ) {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.globalizePublicizeConnection', $connection_id, 'globalize' );

		if ( ! $xml->isError() ) {
			$response = $xml->getResponse();
			$this->receive_updated_publicize_connections( $response );
		}
	}

	/**
	 * Unglobalize a connection.
	 *
	 * @param string $connection_id Connection ID.
	 */
	public function unglobalize_connection( $connection_id ) {
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.globalizePublicizeConnection', $connection_id, 'unglobalize' );

		if ( ! $xml->isError() ) {
			$response = $xml->getResponse();
			$this->receive_updated_publicize_connections( $response );
		}
	}

	/**
	 * Grabs a fresh copy of the publicize connections data, if the cache is busted.
	 */
	public function refresh_connections() {
		if ( null !== $this->current_connections ) {
			return;
		}

		$connections = get_transient( self::JETPACK_SOCIAL_CONNECTIONS_TRANSIENT );
		if ( false === $connections ) {
			$xml = new Jetpack_IXR_Client();
			$xml->query( 'jetpack.fetchPublicizeConnections' );
			if ( ! $xml->isError() ) {
				$response = $xml->getResponse();
				$this->receive_updated_publicize_connections( $response );
			}
			return;
		}
		$this->current_connections = $connections;
	}

	/**
	 * Delete the transient.
	 */
	public function clear_connections_transient() {
		delete_transient( self::JETPACK_SOCIAL_CONNECTIONS_TRANSIENT );
	}

	/**
	 * Get the Publicize connect URL from Keyring.
	 *
	 * @param string $service_name Name of the service to get connect URL for.
	 * @param string $for What the URL is for. Default 'publicize'.
	 * @return string
	 */
	public function connect_url( $service_name, $for = 'publicize' ) {
		return Keyring_Helper::connect_url( $service_name, $for );
	}

	/**
	 * Get the Publicize refresh URL from Keyring.
	 *
	 * @param string $service_name Name of the service to get refresh URL for.
	 * @param string $for What the URL is for. Default 'publicize'.
	 * @return string
	 */
	public function refresh_url( $service_name, $for = 'publicize' ) {
		return Keyring_Helper::refresh_url( $service_name, $for );
	}

	/**
	 * Get the Publicize disconnect URL from Keyring.
	 *
	 * @param string $service_name Name of the service to get disconnect URL for.
	 * @param mixed  $id ID of the conenction to disconnect.
	 * @return string
	 */
	public function disconnect_url( $service_name, $id ) {
		return Keyring_Helper::disconnect_url( $service_name, $id );
	}

	/**
	 * Get social networks, either all available or only those that the site is connected to.
	 *
	 * @since 0.1.0
	 * @since-jetpack 2.0.0
	 *
	 * @since-jetpack 6.6.0 Removed Path. Service closed October 2018.
	 *
	 * @param string    $filter Select the list of services that will be returned. Defaults to 'all', accepts 'connected'.
	 * @param false|int $_blog_id Get services for a specific blog by ID, or set to false for current blog. Default false.
	 * @param false|int $_user_id Get services for a specific user by ID, or set to false for current user. Default false.
	 * @return array List of social networks.
	 */
	public function get_services( $filter = 'all', $_blog_id = false, $_user_id = false ) {
		$services = array(
			'facebook'           => array(),
			'twitter'            => array(),
			'linkedin'           => array(),
			'tumblr'             => array(),
			'mastodon'           => array(),
			'instagram-business' => array(),
			'nextdoor'           => array(),
			'threads'            => array(),
			'bluesky'            => array(),
		);

		if ( 'all' === $filter ) {
			return $services;
		}

		$connected_services = array();
		foreach ( $services as $service_name => $empty ) {
			$connections = $this->get_connections( $service_name, $_blog_id, $_user_id );
			if ( $connections ) {
				$connected_services[ $service_name ] = $connections;
			}
		}
		return $connected_services;
	}

	/**
	 * Get a specific connection. Stub.
	 *
	 * @param string    $service_name 'facebook', 'twitter', etc.
	 * @param string    $connection_id Connection ID.
	 * @param false|int $_blog_id The blog ID. Use false (default) for the current blog.
	 * @param false|int $_user_id The user ID. Use false (default) for the current user.
	 * @return void
	 */
	public function get_connection( $service_name, $connection_id, $_blog_id = false, $_user_id = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Stub.
	}

	/**
	 * Flag a post for Publicize after publishing.
	 *
	 * @param string  $new_status New status of the post.
	 * @param string  $old_status Old status of the post.
	 * @param WP_Post $post Post object.
	 */
	public function flag_post_for_publicize( $new_status, $old_status, $post ) {
		if ( ! $post instanceof \WP_Post || ! $this->post_type_is_publicizeable( $post->post_type ) ) {
			return;
		}

		$should_publicize = $this->should_submit_post_pre_checks( $post );

		if ( 'publish' === $new_status && 'publish' !== $old_status ) {
			/**
			 * Determines whether a post being published gets publicized.
			 *
			 * Side-note: Possibly our most alliterative filter name.
			 *
			 * @since 0.1.0 No longer defaults to true. Adds checks to not publicize based on different contexts.
			 * @since-jetpack 4.1.0
			 *
			 * @param bool $should_publicize Should the post be publicized? Default to true.
			 * @param WP_POST $post Current Post object.
			 */
			$should_publicize = apply_filters( 'publicize_should_publicize_published_post', $should_publicize, $post );

			if ( $should_publicize ) {
				update_post_meta( $post->ID, $this->PENDING, true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			}
		}
	}

	/**
	 * Test a connection.
	 *
	 * @param string $service_name Name of the service.
	 * @param array  $connection Connection to be tested.
	 */
	public function test_connection( $service_name, $connection ) {
		$id = $this->get_connection_id( $connection );

		if ( array_key_exists( $id, $this->test_connection_results ) ) {
			return $this->test_connection_results[ $id ];
		}

		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.testPublicizeConnection', $id );

		// Bail if all is well.
		if ( ! $xml->isError() ) {
			$this->test_connection_results[ $id ] = true;
			return true;
		}

		$xml_response            = $xml->getResponse();
		$connection_test_message = $xml_response['faultString'];
		$connection_error_code   = ( empty( $xml_response['faultCode'] ) || ! is_int( $xml_response['faultCode'] ) )
			? -1
			: $xml_response['faultCode'];

		// Set up refresh if the user can.
		$user_can_refresh = current_user_can( $this->GLOBAL_CAP ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( $user_can_refresh ) {
			/* translators: %s is the name of a social media service */
			$refresh_text = sprintf( _x( 'Refresh connection with %s', 'Refresh connection with {social media service}', 'jetpack-publicize-pkg' ), $this->get_service_label( $service_name ) );
			$refresh_url  = $this->refresh_url( $service_name );
		}

		$error_data = array(
			'user_can_refresh' => $user_can_refresh,
			'refresh_text'     => $refresh_text ?? null,
			'refresh_url'      => $refresh_url ?? null,
		);

		$this->test_connection_results[ $id ] = new WP_Error( $connection_error_code, $connection_test_message, $error_data );

		return $this->test_connection_results[ $id ];
	}

	/**
	 * Checks if post has already been shared by Publicize in the past.
	 *
	 * Jetpack uses two methods:
	 * 1. A POST_DONE . 'all' postmeta flag, or
	 * 2. if the post has already been published.
	 *
	 * @since 0.1.0
	 * @since-jetpack 6.7.0
	 *
	 * @param integer $post_id Optional. Post ID to query connection status for: will use current post if missing.
	 *
	 * @return bool True if post has already been shared by Publicize, false otherwise.
	 */
	public function post_is_done_sharing( $post_id = null ) {
		// Defaults to current post if $post_id is null.
		$post = get_post( $post_id );
		if ( null === $post ) {
			return false;
		}

		return 'publish' === $post->post_status || get_post_meta( $post->ID, $this->POST_DONE . 'all', true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Save a flag locally to indicate that this post has already been Publicized via the selected
	 * connections.
	 *
	 * @param int     $post_ID Post ID.
	 * @param WP_Post $post Post object.
	 */
	public function save_publicized( $post_ID, $post = null ) {
		if ( null === $post ) {
			return;
		}
		// Only do this when a post transitions to being published.
		// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( get_post_meta( $post->ID, $this->PENDING, false ) && $this->post_type_is_publicizeable( $post->post_type ) ) {
			delete_post_meta( $post->ID, $this->PENDING );
			update_post_meta( $post->ID, $this->POST_DONE . 'all', true );
		}
		// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Set post flags for Publicize.
	 *
	 * @param array   $flags List of flags.
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	public function set_post_flags( $flags, $post ) {
		$flags['publicize_post'] = false;
		if ( ! $this->post_type_is_publicizeable( $post->post_type ) ) {
			return $flags;
		}

		$should_publicize = $this->should_submit_post_pre_checks( $post );

		/** This filter is already documented in modules/publicize/publicize-jetpack.php */
		if ( ! apply_filters( 'publicize_should_publicize_published_post', $should_publicize, $post ) ) {
			return $flags;
		}

		$connected_services = $this->get_all_connections();

		if ( empty( $connected_services ) ) {
			return $flags;
		}

		$flags['publicize_post'] = true;

		return $flags;
	}
}
