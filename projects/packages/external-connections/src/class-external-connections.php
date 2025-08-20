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
			if ( ! empty( $service ) ) {
				return $service['connect_URL'];
			}
		} else {
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
			if ( ! property_exists( $body, 'services' ) || ! property_exists( $body->services, $service ) ) {
				return null;
			}

			return $body->services->{ $service }->connect_URL;
		}
		return null;
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
	 */
	public static function delete_connection( $service ) {
		$keyring_connection = self::get_connection( $service );

		if ( ( new Host() )->is_wpcom_simple() ) {
			if ( get_current_user_id() === $keyring_connection['user_ID'] ) {
				require_lib( 'external-connections' );
				$connections = \WPCOM_External_Connections::init();
				$connections->delete_keyring_connection( $keyring_connection['ID'] );
			}
		} else {
			Client::wpcom_json_api_request_as_user(
				'/me/connections/' . $keyring_connection['ID'],
				'2',
				array( 'method' => 'DELETE' )
			);
		}
	}

	/**
	 * Registers connection settings for the provided services on a specified settings page.
	 *
	 * @param string $page The slug of the settings page where the connection settings should be added.
	 * @param array  $services A list of services to be configured, where each service contains 'service', 'title',
	 *                          'description', and 'support_link' keys.
	 */
	public static function add_connections_settings_section_and_fields( $page, $services ) {
		global $pagenow;

		if ( $pagenow !== "options-$page.php" ) {
			return;
		}

		$host = new Host();

		if ( ! $host->is_wpcom_simple() ) {
			$connection = new Connection_Manager( 'jetpack' );
			$status     = new Status();

			if ( $status->is_offline_mode() ) {
				return;
			}

			if ( ! $connection->has_connected_owner() ) {
				return;
			}

			if ( ! $connection->is_user_connected() ) {
				return;
			}
		}

		add_settings_section(
			'external_connections_section',
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

			add_settings_field(
				'external_connections_field_' . $service['service'],
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
				'external_connections_section'
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

	/**
	 * Handles the AJAX request to delete an external connection.
	 */
	public static function ajax_delete_connection() {
		if ( ! isset( $_REQUEST['service'] ) ) {
			wp_die();
		}

		$service = sanitize_text_field( wp_unslash( $_REQUEST['service'] ) );
		check_ajax_referer( 'jetpack_delete_external_connection_' . $service );

		self::delete_connection( $service );
		wp_die();
	}

	/**
	 * Adds connections settings and related actions.
	 *
	 * @param string $page The slug of the settings page where the connection settings should be added.
	 * @param array  $services A list of services to be configured, where each service contains 'service', 'title',
	 *                           'description', and 'support_link' keys.
	 *
	 * @return void
	 */
	public static function add_connections_settings( $page, $services ) {
		add_action(
			'admin_init',
			function () use ( $page, $services ) {
				self::add_connections_settings_section_and_fields( $page, $services );
			}
		);
		add_action( 'wp_ajax_jetpack_delete_external_connection', array( __CLASS__, 'ajax_delete_connection' ) );
	}
}
