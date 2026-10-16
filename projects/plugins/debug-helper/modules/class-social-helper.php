<?php
/**
 * Jetpack Social helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Simulates Jetpack Social connection and service edge cases.
 *
 * Everything here is local: fake connections are injected via the
 * `jetpack_publicize_connections` and `jetpack_publicize_services` filters,
 * so nothing is ever created or changed on WordPress.com.
 *
 * @phan-constructor-used-for-side-effects
 */
class Social_Helper {

	/**
	 * Option name for the stored settings.
	 */
	const STORED_OPTIONS_KEY = 'jetpack_social_helper_settings';

	/**
	 * Prefix used for every fake connection ID, so they can be told apart from real ones.
	 */
	const FAKE_ID_PREFIX = 'debug-helper-';

	/**
	 * The wpcom user ID used for connections that belong to somebody else.
	 */
	const OTHER_USER_ID = 987654321;

	/**
	 * The services Jetpack Social supports, keyed by service name.
	 *
	 * Hardcoded rather than read from Services::get_all(), which would recurse
	 * through our own `jetpack_publicize_services` filter.
	 *
	 * @var array<string, string>
	 */
	const SERVICES = array(
		'bluesky'            => 'Bluesky',
		'facebook'           => 'Facebook',
		'instagram-business' => 'Instagram Business',
		'linkedin'           => 'LinkedIn',
		'mastodon'           => 'Mastodon',
		'nextdoor'           => 'Nextdoor',
		'threads'            => 'Threads',
		'tumblr'             => 'Tumblr',
	);

	/**
	 * The fake connection scenarios, keyed by setting name.
	 *
	 * @var array<string, array{label: string, description: string}>
	 */
	const SCENARIOS = array(
		'broken'         => array(
			'label'       => 'Broken connection',
			'description' => 'Status "broken", which shows the error notice and the Reconnect link. Applied to a real connection where the site has one, so that reconnecting actually works.',
		),
		'must_reauth'    => array(
			'label'       => 'Connection needing re-authentication',
			'description' => 'Status "must_reauth". Applied to a real connection where the site has one, so that reconnecting actually works.',
		),
		'no_avatar'      => array(
			'label'       => 'Connection without a profile picture',
			'description' => 'An empty profile_picture, which should fall back to the default avatar.',
		),
		'broken_avatar'  => array(
			'label'       => 'Connection with a broken profile picture URL',
			'description' => 'A profile_picture pointing at a 404, which should fall back to the default avatar on image error.',
		),
		'long_handle'    => array(
			'label'       => 'Connection with a very long handle and display name',
			'description' => 'For checking truncation and wrapping.',
		),
		'no_handle'      => array(
			'label'       => 'Connection without a handle',
			'description' => 'An empty external_handle, as some services return.',
		),
		'special_chars'  => array(
			'label'       => 'Connection with emoji, RTL text and HTML entities',
			'description' => 'For checking escaping and bidirectional text.',
		),
		'no_profile_url' => array(
			'label'       => 'Connection without a profile link',
			'description' => 'An empty profile_link, so the name should not be rendered as a link.',
		),
		'shared'         => array(
			'label'       => 'Shared connection owned by another user',
			'description' => 'Shows "This connection is added by a site administrator." and disables management for non-editors.',
		),
		'all_services'   => array(
			'label'       => 'One healthy connection per supported service',
			'description' => 'Fills the list with a connection for every service.',
		),
	);

	/**
	 * Notice type.
	 *
	 * @var string
	 */
	public $notice_type = '';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_post_social_helper_store_options', array( $this, 'admin_post_store_options' ) );
		add_action( 'admin_post_social_helper_reset_options', array( $this, 'admin_post_reset_options' ) );

		if ( isset( $_GET['social_helper_notice'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_notices', array( $this, 'display_notice' ) );
		}

		if ( self::is_active() ) {
			add_action( 'admin_notices', array( $this, 'display_active_notice' ) );
			add_filter( 'jetpack_publicize_connections', array( $this, 'filter_connections' ) );
			add_filter( 'jetpack_publicize_services', array( $this, 'filter_services' ) );
		}
	}

	/**
	 * Whether the module is currently changing anything.
	 *
	 * @return bool
	 */
	public static function is_active() {
		$settings = self::get_settings();

		return (bool) array_filter(
			array(
				$settings['scenarios'],
				$settings['unsupported_services'],
				$settings['bulk_count'],
				$settings['force_status'],
				$settings['strip_avatars'],
				'all' !== $settings['connections_source'],
			)
		);
	}

	/**
	 * Get the stored settings.
	 *
	 * @return array
	 */
	public static function get_settings() {
		$settings = wp_parse_args(
			get_option( self::STORED_OPTIONS_KEY, array() ),
			array(
				'scenarios'            => array(),
				'unsupported_services' => array(),
				'bulk_count'           => 0,
				'bulk_service'         => 'mastodon',
				'force_status'         => '',
				'strip_avatars'        => false,
				'connections_source'   => 'all',
			)
		);

		// Guard against stale keys from earlier versions of this module.
		$settings['scenarios']            = array_values( array_intersect( (array) $settings['scenarios'], array_keys( self::SCENARIOS ) ) );
		$settings['unsupported_services'] = array_values( array_intersect( (array) $settings['unsupported_services'], array_keys( self::SERVICES ) ) );

		return $settings;
	}

	/**
	 * Register the submenu page.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Social Helper',
			'Social Helper',
			'manage_options',
			'social-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Render the UI.
	 */
	public function render_ui() {
		$settings = self::get_settings();
		?>
		<h1>Jetpack Social Helper 🎭</h1>
		<p>Injects fake Jetpack Social connections and tweaks the services list so the awkward states are easy to reproduce.</p>
		<p>
			<strong>Nothing here touches WordPress.com.</strong> The fake connections only exist in the responses served to this site,
			so disconnecting, reconnecting or sharing to them will fail. Reload the Social admin page or the block editor after saving.
		</p>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">

		<h2>Fake connections</h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">Scenarios</th>
					<td>
						<fieldset>
						<?php foreach ( self::SCENARIOS as $key => $scenario ) : ?>
							<label>
								<input type="checkbox" name="scenarios[]" value="<?php echo esc_attr( $key ); ?>" <?php checked( in_array( $key, $settings['scenarios'], true ) ); ?>>
								<strong><?php echo esc_html( $scenario['label'] ); ?></strong>
							</label>
							<p class="description" style="margin: 0 0 8px 25px;"><?php echo esc_html( $scenario['description'] ); ?></p>
						<?php endforeach; ?>
						</fieldset>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="social-helper-bulk-count">Bulk connections</label></th>
					<td>
						<input type="number" min="0" max="100" id="social-helper-bulk-count" name="bulk_count" value="<?php echo esc_attr( (string) $settings['bulk_count'] ); ?>" class="small-text">
						extra healthy connections for
						<select name="bulk_service">
							<?php foreach ( self::SERVICES as $service_name => $label ) : ?>
								<option value="<?php echo esc_attr( $service_name ); ?>" <?php selected( $service_name, $settings['bulk_service'] ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
						<p class="description">For checking how the list behaves with a lot of connections.</p>
					</td>
				</tr>
			</tbody>
		</table>

		<h2>The whole list</h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row"><label for="social-helper-force-status">Force status</label></th>
					<td>
						<select name="force_status" id="social-helper-force-status">
							<option value="" <?php selected( '', $settings['force_status'] ); ?>>Do not override</option>
							<option value="ok" <?php selected( 'ok', $settings['force_status'] ); ?>>ok</option>
							<option value="broken" <?php selected( 'broken', $settings['force_status'] ); ?>>broken</option>
							<option value="must_reauth" <?php selected( 'must_reauth', $settings['force_status'] ); ?>>must_reauth</option>
						</select>
						<p class="description">Applies to every connection, real and fake, and overrides the status scenarios above.</p>
					</td>
				</tr>
				<tr>
					<th scope="row">Profile pictures</th>
					<td>
						<label>
							<input type="checkbox" name="strip_avatars" <?php checked( $settings['strip_avatars'] ); ?>>
							Remove the profile picture from every connection
						</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="social-helper-connections-source">Connections to show</label></th>
					<td>
						<select name="connections_source" id="social-helper-connections-source">
							<option value="all" <?php selected( 'all', $settings['connections_source'] ); ?>>Real and fake connections</option>
							<option value="fake" <?php selected( 'fake', $settings['connections_source'] ); ?>>Only the fake connections</option>
							<option value="none" <?php selected( 'none', $settings['connections_source'] ); ?>>No connections at all</option>
						</select>
						<p class="description">"No connections at all" returns an empty list, whatever is selected above, for checking the zero state.</p>
					</td>
				</tr>
			</tbody>
		</table>

		<h2>Services</h2>
		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row">Unsupported services</th>
					<td>
						<fieldset>
							<p class="description">
								Marks the service as <code>unsupported</code>, which is how a network that Jetpack Social has dropped is
								represented. Connections for it show the "This platform is no longer supported" notice, and a fake
								connection is added for each one so there is something to look at.
							</p>
							<?php foreach ( self::SERVICES as $service_name => $label ) : ?>
								<label>
									<input type="checkbox" name="unsupported_services[]" value="<?php echo esc_attr( $service_name ); ?>" <?php checked( in_array( $service_name, $settings['unsupported_services'], true ) ); ?>>
									<?php echo esc_html( $label ); ?>
								</label><br>
							<?php endforeach; ?>
						</fieldset>
					</td>
				</tr>
			</tbody>
		</table>

		<input type="hidden" name="action" value="social_helper_store_options">
		<?php wp_nonce_field( 'social-helper-store-options' ); ?>
		<input type="submit" value="Save" class="button button-primary">
		</form>

		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin-top: 10px;">
			<input type="hidden" name="action" value="social_helper_reset_options">
			<?php wp_nonce_field( 'social-helper-reset-options' ); ?>
			<input type="submit" value="Reset everything" class="button button-secondary">
		</form>
		<?php
	}

	/**
	 * Store the submitted settings.
	 */
	public function admin_post_store_options() {
		check_admin_referer( 'social-helper-store-options' );

		$scenarios = isset( $_POST['scenarios'] ) ? array_map( 'sanitize_key', wp_unslash( (array) $_POST['scenarios'] ) ) : array();
		$services  = isset( $_POST['unsupported_services'] ) ? array_map( 'sanitize_key', wp_unslash( (array) $_POST['unsupported_services'] ) ) : array();

		$bulk_service = isset( $_POST['bulk_service'] ) ? sanitize_key( wp_unslash( $_POST['bulk_service'] ) ) : '';
		$force_status = isset( $_POST['force_status'] ) ? sanitize_key( wp_unslash( $_POST['force_status'] ) ) : '';
		$source       = isset( $_POST['connections_source'] ) ? sanitize_key( wp_unslash( $_POST['connections_source'] ) ) : '';

		update_option(
			self::STORED_OPTIONS_KEY,
			array(
				'scenarios'            => array_values( array_intersect( $scenarios, array_keys( self::SCENARIOS ) ) ),
				'unsupported_services' => array_values( array_intersect( $services, array_keys( self::SERVICES ) ) ),
				'bulk_count'           => isset( $_POST['bulk_count'] ) ? max( 0, min( 100, (int) $_POST['bulk_count'] ) ) : 0,
				'bulk_service'         => isset( self::SERVICES[ $bulk_service ] ) ? $bulk_service : 'mastodon',
				'force_status'         => in_array( $force_status, array( 'ok', 'broken', 'must_reauth' ), true ) ? $force_status : '',
				'strip_avatars'        => isset( $_POST['strip_avatars'] ),
				'connections_source'   => in_array( $source, array( 'fake', 'none' ), true ) ? $source : 'all',
			)
		);

		$this->clear_publicize_caches();

		$this->notice_type = 'saved';
		$this->redirect_referrer();
	}

	/**
	 * Reset the settings.
	 */
	public function admin_post_reset_options() {
		check_admin_referer( 'social-helper-reset-options' );

		delete_option( self::STORED_OPTIONS_KEY );

		$this->clear_publicize_caches();

		$this->notice_type = 'reset';
		$this->redirect_referrer();
	}

	/**
	 * Clear the Publicize transients so the next page load rebuilds the lists.
	 */
	private function clear_publicize_caches() {
		if ( class_exists( 'Automattic\Jetpack\Publicize\Connections' ) ) {
			Automattic\Jetpack\Publicize\Connections::clear_cache();
		}

		if ( class_exists( 'Automattic\Jetpack\Publicize\Services' ) ) {
			Automattic\Jetpack\Publicize\Services::clear_cache();
		}
	}

	/**
	 * Filter the connections list.
	 *
	 * @param array $connections List of connections.
	 *
	 * @return array
	 */
	public function filter_connections( $connections ) {
		$settings = self::get_settings();

		if ( 'none' === $settings['connections_source'] ) {
			return array();
		}

		$connections = 'fake' === $settings['connections_source'] ? array() : array_values( (array) $connections );

		/*
		 * The status scenarios take over a real connection when the site has one, since
		 * reconnecting a fake connection can never succeed. Each status claims a different
		 * connection, and whatever is left over falls back to a fake one.
		 */
		$pending_statuses = array_values( array_intersect( array( 'broken', 'must_reauth' ), $settings['scenarios'] ) );

		foreach ( $pending_statuses as $index => $status ) {
			if ( ! isset( $connections[ $index ] ) ) {
				break;
			}

			$connections[ $index ]['status'] = $status;

			unset( $pending_statuses[ $index ] );
		}

		$connections = array_merge( $connections, $this->get_fake_connections( $pending_statuses ) );

		if ( $settings['force_status'] || $settings['strip_avatars'] ) {
			foreach ( $connections as &$connection ) {
				if ( $settings['force_status'] ) {
					$connection['status'] = $settings['force_status'];
				}

				if ( $settings['strip_avatars'] ) {
					$connection['profile_picture'] = '';
				}
			}
			unset( $connection );
		}

		return $connections;
	}

	/**
	 * Filter the services list.
	 *
	 * @param array $services List of services.
	 *
	 * @return array
	 */
	public function filter_services( $services ) {
		$unsupported = self::get_settings()['unsupported_services'];

		if ( empty( $unsupported ) ) {
			return $services;
		}

		foreach ( $services as &$service ) {
			$id = $service['id'] ?? ( $service['ID'] ?? '' );

			if ( in_array( $id, $unsupported, true ) ) {
				$service['status'] = 'unsupported';
			}
		}
		unset( $service );

		return $services;
	}

	/**
	 * Build the list of fake connections for the current settings.
	 *
	 * @param array $pending_statuses Statuses that could not be applied to a real connection,
	 *                                and so need a fake connection to carry them.
	 *
	 * @return array
	 */
	private function get_fake_connections( $pending_statuses = array() ) {
		$settings  = self::get_settings();
		$scenarios = $settings['scenarios'];

		$connections = array();

		if ( in_array( 'broken', $pending_statuses, true ) ) {
			$connections[] = $this->fake_connection(
				'broken',
				'facebook',
				array(
					'display_name'    => 'Broken Page',
					'external_handle' => 'broken.page',
					'status'          => 'broken',
				)
			);
		}

		if ( in_array( 'must_reauth', $pending_statuses, true ) ) {
			$connections[] = $this->fake_connection(
				'must-reauth',
				'linkedin',
				array(
					'display_name'    => 'Needs Reauth',
					'external_handle' => 'needs-reauth',
					'status'          => 'must_reauth',
				)
			);
		}

		if ( in_array( 'no_avatar', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'no-avatar',
				'mastodon',
				array(
					'display_name'    => 'No Avatar',
					'external_handle' => '@no-avatar@mastodon.social',
					'profile_picture' => '',
				)
			);
		}

		if ( in_array( 'broken_avatar', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'broken-avatar',
				'bluesky',
				array(
					'display_name'    => 'Broken Avatar',
					'external_handle' => 'broken-avatar.bsky.social',
					'profile_picture' => 'https://example.com/jetpack-debug-helper/this-avatar-does-not-exist.png',
				)
			);
		}

		if ( in_array( 'long_handle', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'long-handle',
				'mastodon',
				array(
					'display_name'    => 'A Display Name That Simply Refuses To Stop Going On And On And On For Quite A While Longer Than Anybody Expected',
					'external_handle' => '@an-extremely-long-handle-that-will-not-fit-anywhere-at-all@a-very-long-mastodon-instance-domain-name.example.social',
				)
			);
		}

		if ( in_array( 'no_handle', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'no-handle',
				'tumblr',
				array(
					'display_name'    => 'No Handle',
					'external_handle' => '',
				)
			);
		}

		if ( in_array( 'special_chars', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'special-chars',
				'threads',
				array(
					'display_name'    => '🎉 Ben & Jerry\'s <script>alert(1)</script> مرحبا بالعالم',
					'external_handle' => '@emoji_🎉_handle',
				)
			);
		}

		if ( in_array( 'no_profile_url', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'no-profile-url',
				'nextdoor',
				array(
					'display_name'    => 'No Profile Link',
					'external_handle' => 'no-profile-link',
					'profile_link'    => '',
				)
			);
		}

		if ( in_array( 'shared', $scenarios, true ) ) {
			$connections[] = $this->fake_connection(
				'shared',
				'instagram-business',
				array(
					'display_name'    => 'Somebody Else\'s Shared Account',
					'external_handle' => 'shared.account',
					'shared'          => true,
					'wpcom_user_id'   => self::OTHER_USER_ID,
				)
			);
		}

		if ( in_array( 'all_services', $scenarios, true ) ) {
			foreach ( self::SERVICES as $service_name => $label ) {
				$connections[] = $this->fake_connection(
					'service-' . $service_name,
					$service_name,
					array(
						'display_name'    => $label . ' Account',
						'external_handle' => $service_name . '.account',
					)
				);
			}
		}

		// A connection for every service marked as unsupported, so the state is visible.
		foreach ( $settings['unsupported_services'] as $service_name ) {
			$connections[] = $this->fake_connection(
				'unsupported-' . $service_name,
				$service_name,
				array(
					'display_name'    => self::SERVICES[ $service_name ] . ' Legacy Account',
					'external_handle' => $service_name . '.legacy',
				)
			);
		}

		for ( $i = 1; $i <= $settings['bulk_count']; $i++ ) {
			$connections[] = $this->fake_connection(
				'bulk-' . $i,
				$settings['bulk_service'],
				array(
					'display_name'    => sprintf( 'Bulk Account %d', $i ),
					'external_handle' => sprintf( 'bulk.account.%d', $i ),
				)
			);
		}

		return $connections;
	}

	/**
	 * Build a single fake connection.
	 *
	 * @param string $slug         Unique slug for the connection, used to build its IDs.
	 * @param string $service_name The service the connection belongs to.
	 * @param array  $overrides    Fields to override on the default connection.
	 *
	 * @return array
	 */
	private function fake_connection( $slug, $service_name, $overrides = array() ) {
		$connection_id = self::FAKE_ID_PREFIX . $slug;

		$connection = array_merge(
			array(
				'connection_id'   => $connection_id,
				'display_name'    => 'Debug Account',
				'external_handle' => 'debug.account',
				'external_id'     => $connection_id,
				'profile_link'    => 'https://example.com/' . rawurlencode( $slug ),
				'profile_picture' => 'https://0.gravatar.com/avatar/' . md5( $connection_id ) . '?s=96&d=identicon', // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_md5 -- Gravatar URLs use md5.
				'service_label'   => self::SERVICES[ $service_name ] ?? ucfirst( $service_name ),
				'service_name'    => $service_name,
				'shared'          => false,
				'status'          => 'ok',
				'template'        => '',
				'wpcom_user_id'   => self::get_current_wpcom_user_id(),
			),
			$overrides
		);

		// Deprecated fields, still read in a few places.
		$connection['id']                   = $connection['connection_id'];
		$connection['username']             = $connection['external_handle'];
		$connection['profile_display_name'] = $connection['display_name'];
		$connection['global']               = $connection['shared'];

		return $connection;
	}

	/**
	 * Get the WordPress.com user ID of the current user.
	 *
	 * @return int
	 */
	private static function get_current_wpcom_user_id() {
		static $wpcom_user_id = null;

		if ( null !== $wpcom_user_id ) {
			return $wpcom_user_id;
		}

		$wpcom_user_id = 0;

		if ( class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
			$user_data = ( new Connection_Manager() )->get_connected_user_data();

			if ( is_array( $user_data ) ) {
				$wpcom_user_id = (int) ( $user_data['ID'] ?? 0 );
			}
		}

		return $wpcom_user_id;
	}

	/**
	 * Redirect back to the referrer.
	 *
	 * @return never
	 */
	private function redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect( add_query_arg( array( 'social_helper_notice' => $this->notice_type ), wp_get_referer() ) );
		} else {
			wp_safe_redirect( get_home_url() );
		}

		exit;
	}

	/**
	 * Display the save/reset notice.
	 */
	public function display_notice() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$notice = isset( $_GET['social_helper_notice'] ) ? sanitize_key( wp_unslash( $_GET['social_helper_notice'] ) ) : '';

		wp_admin_notice(
			'reset' === $notice ? 'Social Helper settings have been reset.' : 'Social Helper settings have been saved.',
			array(
				'type'        => 'success',
				'dismissible' => true,
			)
		);
	}

	/**
	 * Warn that the Social data is being tampered with.
	 */
	public function display_active_notice() {
		wp_admin_notice(
			'Jetpack Social connections and services are being modified by the Social Helper module of the Jetpack Debug Helper plugin.',
			array(
				'type' => 'warning',
			)
		);
	}
}

add_action(
	'plugins_loaded',
	function () {
		new Social_Helper();
	},
	1000
);
