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

	const PACKAGE_VERSION = '0.1.0-alpha';
	const BASE_FILE       = __FILE__;

	/**
	 * List of services whose connections are managed in settings pages.
	 *
	 * Each item has a key with the slug of the settings page, and a value with an array of services.
	 *
	 * Each service has the following keys:
	 * - service: The service identifier.
	 * - title: The title of the service.
	 * - description: The description of the service.
	 * - support_link: An array with the following keys:
	 *     - jetpack: The URL handler registered in jetpack.com/redirect/.
	 *     - wpcom: The URL of the support page for the service on WordPress.com.
	 *
	 * @example
	 * ```php
	 * $this->services = array(
	 *     'media' => array(
	 *         array(
	 *             'service'      => 'facebook',
	 *             'title'        => 'Facebook',
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
		$transient_name = "jetpack_external_connections_connect_url_$service";

		$connect_url = get_transient( $transient_name );
		if ( $connect_url !== false ) {
			return $connect_url;
		}

		if ( ( new Host() )->is_wpcom_simple() ) {
			require_lib( 'external-connections' );
			$connections = \WPCOM_External_Connections::init();
			$service     = $connections->get_external_service_item( $service );
			$connect_url = empty( $service ) ? null : $service['connect_URL'];
			set_transient( $transient_name, $connect_url, DAY_IN_SECONDS );
			return $connect_url;
		}

		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			set_transient( $transient_name, null, DAY_IN_SECONDS );
			return null;
		}

		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			set_transient( $transient_name, null, DAY_IN_SECONDS );
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$connect_url = $body->services->$service->connect_URL ?? null;
		set_transient( $transient_name, $connect_url, DAY_IN_SECONDS );
		return $connect_url;
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
	 * Checks if a connection to the specified service exists and is active.
	 *
	 * @param string $service The service identifier.
	 *
	 * @return bool True if an active connection exists, false otherwise.
	 */
	public static function has_connection( $service ) {
		$connection = self::get_connection( $service );

		if ( empty( $connection ) ) {
			return false;
		}

		$connection_status = $connection['status'] ?? 'not_connected';
		return $connection_status === 'ok';
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
	 * Registers connection settings.
	 */
	public static function register_settings() {
		foreach ( self::$services as $page => $services ) {
			global $pagenow;

			if ( $pagenow !== "options-$page.php" ) {
				continue;
			}

			$host = new Host();

			if ( ! $host->is_wpcom_simple() ) {
				$connection = new Connection_Manager( 'jetpack' );
				$status     = new Status();

				if ( $status->is_offline_mode() || ! $connection->has_connected_owner() || ! $connection->is_user_connected() ) {
					return;
				}
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
					'in_footer'    => true,
					'textdomain'   => 'jetpack-external-connections',
					'dependencies' => array( 'wp-util' ),
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

				$is_connected = self::has_connection( $service['service'] );
				$connect_url  = self::get_connect_url( $service['service'] );
				if ( empty( $connect_url ) && ! $is_connected ) {
					continue;
				}

				add_settings_field(
					'jetpack_external_connections_field_' . $service['service'],
					$service['title'],
					function () use ( $service, $is_connected, $support_link ) {
						?>
						<div>
							<button class="button-secondary jetpack-external-connection" type="button" data-service="<?php echo esc_attr( $service['service'] ); ?>">
								<?php $is_connected ? esc_html_e( 'Disconnect', 'jetpack-external-connections' ) : esc_html_e( 'Connect', 'jetpack-external-connections' ); ?>
							</button>
							<p class="description">
								<?php echo esc_html( $service['description'] ); ?>
								<a href="<?php echo esc_url( $support_link ); ?>" target="_blank" data-target="wpcom-help-center"><?php esc_html_e( 'Learn more', 'jetpack-external-connections' ); ?></a>
							</p>
						</div>
						<?php
					},
					$page,
					'jetpack_external_connections_section'
				);

				$script_data[ $service['service'] ] = array(
					'isConnected' => $is_connected,
					'connectUrl'  => $connect_url,
					'deleteNonce' => wp_create_nonce( 'jetpack_delete_external_connection_' . $service['service'] ),
				);
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
	 * Registers settings and hooks for a specified service on a given admin page.
	 *
	 * @param string $page The identifier of the admin page where the service settings are added.
	 * @param array  $service The service to be associated with the specified admin page.
	 */
	public static function add_settings_for_service( $page, $service ) {
		if ( ! isset( self::$services[ $page ] ) ) {
			self::$services[ $page ] = array();
		}
		self::$services[ $page ][] = $service;

		if ( ! has_action( 'admin_init', array( __CLASS__, 'register_settings' ) ) ) {
			add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		}

		if ( ! has_action( 'wp_ajax_jetpack_delete_external_connection', array( __CLASS__, 'ajax_delete_connection' ) ) ) {
			add_action( 'wp_ajax_jetpack_delete_external_connection', array( __CLASS__, 'ajax_delete_connection' ) );
		}
	}
}
