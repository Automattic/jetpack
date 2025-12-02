<?php
/**
 * Management of external connections.
 *
 * @package automattic/jetpack-external-connections
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;

/**
 * Main class.
 */
class External_Connections {

	const PACKAGE_VERSION = '0.1.7';
	const BASE_FILE       = __FILE__;

	/**
	 * List of services whose connections are managed in settings pages.
	 *
	 * Each item has a key with the slug of the settings page, and a value with an array of services.
	 *
	 * Each service has the following keys:
	 * - service: The service identifier.
	 * - title: The title of the service.
	 * - signup_link: The URL to the service's signup page.
	 * - description: The description of the service.
	 * - support_link: An array with the following keys:
	 *     - jetpack: The URL handler registered in jetpack.com/redirect/.
	 *     - wpcom: The URL of the support page for the service on WordPress.com.
	 * - script: An optional script handle to enqueue.
	 *
	 * @example
	 * ```php
	 * self::$services = array(
	 *     'media' => array(
	 *         array(
	 *             'service'      => 'facebook',
	 *             'title'        => 'Facebook',
	 *             'signup_link'  => 'https://facebook.com/signup?ref=jetpack',
	 *             'description'  => 'Connect your site to your Facebook account',
	 *             'support_link' => array(
	 *                 'jetpack' => 'facebook-connection',
	 *                 'wpcom'   => 'https://wordpress.com/support/facebook/',
	 *             ),
	 *         ),
	 *     ),
	 * );
	 * ```
	 * @var array
	 */
	private static $services = array();

	/**
	 * Gets the connect URL for a given service.
	 *
	 * @param string $service The service identifier.
	 * @return string|null The connect URL, or `null` if the service is not supported.
	 */
	public static function get_connect_url( $service ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			require_lib( 'external-connections' );
			$connections = \WPCOM_External_Connections::init();
			$service     = $connections->get_external_service_item( $service );
			return $service ? $service['connect_URL'] : null;
		}

		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return null;
		}

		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		return $body->services->$service->connect_URL ?? null;
	}

	/**
	 * Retrieves a connection of the provided service.
	 *
	 * @param string $service The service identifier.
	 * @return array|null The connection details, or `null` if no matching connection is found.
	 */
	public static function get_connection( $service ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			require_lib( 'external-media-service/external-media-list' );
			require_lib( 'external-connections' );

			$connections = \WPCOM_External_Connections::init();
			$token       = \ExternalMediaService::get_service_token( $service, get_current_user_id() );

			if ( ! empty( $token->unique_id ) ) {
				return $connections->get_keyring_connection_item( $token->unique_id );
			}
		} else {
			$response = Client::wpcom_json_api_request_as_user( '/me/connections' );
			if ( is_wp_error( $response ) ) {
				return null;
			}
			$body = json_decode( wp_remote_retrieve_body( $response ) );
			if ( isset( $body->connections ) && is_array( $body->connections ) ) {
				foreach ( $body->connections as $connection ) {
					if ( $service === $connection->service ) {
						return (array) $connection;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Deletes a connection for the provided service.
	 *
	 * @param string $service The service identifier.
	 * @return boolean Whether the connection was deleted.
	 */
	public static function delete_connection( $service ) {
		$connection = self::get_connection( $service );
		if ( empty( $connection ) ) {
			return false;
		}

		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( get_current_user_id() === $connection['user_ID'] ) {
				require_lib( 'external-connections' );
				$connections = \WPCOM_External_Connections::init();
				return $connections->delete_keyring_connection( $connection['ID'] );
			}
			return false;
		}

		$response = Client::wpcom_json_api_request_as_user(
			'/me/connections/' . $connection['ID'],
			'2',
			array( 'method' => 'DELETE' )
		);
		if ( is_wp_error( $response ) ) {
			return false;
		}
		$body = json_decode( wp_remote_retrieve_body( $response ) );
		return $body->deleted ?? false;
	}

	/**
	 * Gets the connection data for the provided service.
	 *
	 * @param string $service The service identifier.
	 * @return array The connection data.
	 */
	public static function get_connection_data( $service ) {
		$connection = self::get_connection( $service );
		if ( empty( $connection ) ) {
			return array(
				'is_connected'  => false,
				'account_name'  => '',
				'profile_image' => '',
			);
		}

		$is_connected  = isset( $connection['status'] ) && $connection['status'] === 'ok';
		$account_name  = $is_connected ? ( $connection['external_display'] ?? $connection['external_name'] ) : '';
		$profile_image = $is_connected ? $connection['external_profile_picture'] : '';

		return array(
			'is_connected'  => $is_connected,
			'account_name'  => $account_name,
			'profile_image' => $profile_image,
		);
	}

	/**
	 * Registers connection settings.
	 */
	public static function register_settings() {
		global $pagenow;
		$host = new Host();

		if ( ! $host->is_wpcom_simple() ) {
			$connection = new Connection_Manager( 'jetpack' );
			$status     = new Status();

			if ( $status->is_offline_mode() || ! $connection->has_connected_owner() || ! $connection->is_user_connected() ) {
				return;
			}
		}

		foreach ( self::$services as $page => $services ) {
			if ( $pagenow !== "options-$page.php" ) {
				continue;
			}

			add_settings_section(
				'jetpack_external_connections_section',
				__( 'Integrations', 'jetpack-external-connections' ),
				'__return_false',
				$page
			);

			$asset_name = 'jetpack-external-connections-settings';
			Assets::register_script(
				$asset_name,
				"build/$asset_name/$asset_name.js",
				self::BASE_FILE,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-external-connections',
				)
			);
			Assets::enqueue_script( $asset_name );

			$script_data = array();

			foreach ( $services as $service ) {
				if ( $host->is_wpcom_platform() ) {
					$support_link = $service['support_link']['wpcom'];
					if ( function_exists( 'localized_wpcom_url' ) ) {
						$support_link = localized_wpcom_url( $support_link );
					}
				} else {
					$support_link = Redirect::get_url( $service['support_link']['jetpack'] );
				}

				$connect_url     = self::get_connect_url( $service['service'] );
				$connection_data = self::get_connection_data( $service['service'] );

				if ( ( empty( $connect_url ) && ! $connection_data['is_connected'] ) ) {
					continue;
				}

				add_settings_field(
					'jetpack_external_connections_field_' . $service['service'],
					$service['title'],
					function () use ( $service, $support_link ) {
						?>
						<div class="jetpack-external-connection" data-service="<?php echo esc_attr( $service['service'] ); ?>"><em><?php esc_html_e( 'Loading…', 'jetpack-external-connections' ); ?></em></div>
						<p class="description">
							<?php echo esc_html( $service['description'] ); ?>
							<a href="<?php echo esc_url( $support_link ); ?>" target="_blank" data-target="wpcom-help-center"><?php esc_html_e( 'Learn more', 'jetpack-external-connections' ); ?></a>
						</p>
						<?php
					},
					$page,
					'jetpack_external_connections_section'
				);

				$script_data[ $service['service'] ] = array(
					'accountName'  => $connection_data['account_name'],
					'connectUrl'   => $connect_url,
					'deleteNonce'  => wp_create_nonce( 'jetpack_delete_external_connection_' . $service['service'] ),
					'getNonce'     => wp_create_nonce( 'jetpack_get_external_connection_' . $service['service'] ),
					'isConnected'  => $connection_data['is_connected'],
					'profileImage' => $connection_data['profile_image'],
					'supportLink'  => $support_link,
					'signupLink'   => $service['signup_link'] ?? '',
				);

				if ( isset( $service['script'] ) ) {
					Assets::enqueue_script( $service['script'] );
				}
			}

			wp_add_inline_script(
				$asset_name,
				'const jetpackExternalConnectionsData = ' . wp_json_encode( $script_data ) . ';',
				'before'
			);
		}
	}

	/**
	 * Handles the AJAX request to delete an external connection.
	 */
	public static function ajax_delete_connection() {
		if ( ! isset( $_REQUEST['service'] ) ) {
			wp_send_json( array( 'deleted' => 'false' ) );
		}

		$service = sanitize_text_field( wp_unslash( $_REQUEST['service'] ) );
		check_ajax_referer( 'jetpack_delete_external_connection_' . $service );

		$is_deleted = self::delete_connection( $service );
		wp_send_json( array( 'deleted' => $is_deleted ) );
	}

	/**
	 * Handles the AJAX request to delete an external connection.
	 */
	public static function ajax_get_connection() {
		if ( ! isset( $_REQUEST['service'] ) ) {
			wp_send_json( array( 'isConnected' => 'false' ) );
		}

		$service = sanitize_text_field( wp_unslash( $_REQUEST['service'] ) );
		check_ajax_referer( 'jetpack_get_external_connection_' . $service );

		$connection_data = self::get_connection_data( $service );
		wp_send_json(
			array(
				'accountName'  => $connection_data['account_name'],
				'isConnected'  => $connection_data['is_connected'],
				'profileImage' => $connection_data['profile_image'],
			)
		);
	}

	/**
	 * Registers settings and hooks for a specified service on a given admin page.
	 *
	 * @param string $page The identifier of the admin page where the service settings are added.
	 * @param array  $service The service to be associated with the specified admin page.
	 */
	public static function add_settings_for_service( $page, $service ) {
		self::$services[ $page ][] = $service;

		if ( ! has_action( 'admin_init', array( __CLASS__, 'register_settings' ) ) ) {
			add_action( 'admin_init', array( __CLASS__, 'register_settings' ), 15 );
		}

		if ( ! has_action( 'wp_ajax_jetpack_delete_external_connection', array( __CLASS__, 'ajax_delete_connection' ) ) ) {
			add_action( 'wp_ajax_jetpack_delete_external_connection', array( __CLASS__, 'ajax_delete_connection' ) );
		}

		if ( ! has_action( 'wp_ajax_jetpack_get_external_connection', array( __CLASS__, 'ajax_get_connection' ) ) ) {
			add_action( 'wp_ajax_jetpack_get_external_connection', array( __CLASS__, 'ajax_get_connection' ) );
		}
	}
}
