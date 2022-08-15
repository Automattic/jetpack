<?php
/**
 * Jetpack Scan helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Helps debug Scan
 */
class Scan_Helper {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'rest_api_init', array( $this, 'initialize_api' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Scan Helper',
			'Scan Helper',
			'manage_options',
			'scan-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Enqueue scripts!
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'jetpack-debug_page_scan-helper' ) === 0 ) {
			wp_enqueue_style( 'scan_helper_style', plugin_dir_url( __FILE__ ) . 'inc/css/scan-helper.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Has Credentials
	 *
	 * @return bool
	 */
	private function has_credentials() {
		$url         = wp_nonce_url( add_query_arg( array( 'page' => 'scan-helper' ), 'options-general.php' ), 'scan-helper-nonce' );
		$credentials = request_filesystem_credentials( $url );

		if ( false === $credentials ) {
			return false;
		}

		if ( ! WP_Filesystem( $credentials ) ) {
			request_filesystem_credentials( $url, '', true );
			return false;
		}

		return true;
	}

	/**
	 * Write File
	 *
	 * @param string $file
	 * @param string $contents
	 */
	private function write_file( $file, $contents ) {
		global $wp_filesystem;

		check_admin_referer( 'scan-helper-nonce' );

		if ( ! $this->has_credentials() ) {
			return;
		}

		$file_written = $wp_filesystem->put_contents( $file, $contents, FS_CHMOD_FILE );

		if ( ! $file_written ) {
			echo 'Error!';
			return;
		}

		echo 'File written';
	}

	/**
	 * Delete File
	 *
	 * @param string $file
	 */
	private function delete_file( $file ) {
		global $wp_filesystem;

		if ( ! $this->has_credentials() ) {
			return;
		}

		return $wp_filesystem->delete( $file );
	}

	/**
	 * Initialize the rest api.
	 */
	public function initialize_api() {
		// EICAR
		register_rest_route(
			'jptt/v1',
			'/generate-eicar',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					// generate a unique filename
					$dir      = wp_upload_dir()['basedir'];
					$filepath = "$dir/jptt_eicar.php";
					$filerel  = str_replace( ABSPATH, '', $filepath );

					if ( file_exists( $filepath ) ) {
						$success = $this->delete_file( $filerel );
						$message = 'Removed the EICAR threat.';
					} else {
						// write the EICAR pattern to the file (base64-encoded here so this plugin doesn't get flagged)
						$success = $this->write_file( $filepath, "<?php\n\necho <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;\n" );
						// SUSP
						$success = $this->write_file( $filepath, "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNVU1BJQ0lPVVMtQU5USVZJUlVTLVRFU1QtRklMRSEkSCtIKg==' ) . "\nHTML;\n", FILE_APPEND );
						// LOW
						$success = $this->write_file( $filepath, "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLUxPVy1BTlRJVklSVVMtVEVTVC1GSUxFISRIK0gq' ) . "\nHTML;\n", FILE_APPEND );
						// MED
						$success = $this->write_file( $filepath, "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLU1FRElVTS1BTlRJVklSVVMtVEVTVC1GSUxFISRIK0gq' ) . "\nHTML;\n", FILE_APPEND );
						// CRITICAL
						$success = $this->write_file( $filepath, "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLUNSSVRJQ0FMLUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;\n", FILE_APPEND );

						$message = "Created $filerel.";
					}

					if ( $success !== false ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', "Unable to write/remove threat file $filerel" );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
		// SUSPICIOUS LINK
		register_rest_route(
			'jptt/v1',
			'/generate-suspicious-link',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					// generate a unique filename
					$dir      = wp_upload_dir()['basedir'];
					$filepath = "$dir/jptt_suspicious_link.php";
					$filerel  = str_replace( ABSPATH, '', $filepath );

					if ( file_exists( $filepath ) ) {
						$success = $this->delete_file( $filerel );
						$message = 'Removed the Suspicious Link threat.';
					} else {
						// write the suspicious link
						$success = $this->write_file( $filepath, "<?php\n \$url = 'https://example.com/akismet-guaranteed-spam/'; \n" );

						$message = "Created $filerel.";
					}

					if ( $success !== false ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', "Unable to write/remove threat file $filerel" );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
		// CORE FILE MODIFICATION
		register_rest_route(
			'jptt/v1',
			'/generate-core',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
					$filepath = $dir . 'index.php';
					$filerel  = str_replace( ABSPATH, '', $filepath );
					$lines    = file( $filepath );

					// check if we've already modified this file
					if ( $lines[ count( $lines ) - 1 ] === 'if ( true === false ) exit();' ) {
						// eliminate the threat by removing the modification
						$last = count( $lines ) - 1;
						unset( $lines[ $last ] );
						$message = 'Removed the core modification threat.';
					} else {
						// add the threat by modifying the file
						$lines[] = 'if ( true === false ) exit();';
						$message = "Modified the core file: $filerel";
					}
					$fp      = fopen( $filepath, 'w' );
					$success = fwrite( $fp, implode( '', $lines ) );
					fclose( $fp );

					if ( $success !== false ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', "Unable to write/remove threat from $filerel" );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
		// CORE DIRECTORY ADD FILE
		register_rest_route(
			'jptt/v1',
			'/generate-core-add',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					// generate a unique filename
					$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
					$filepath = $dir . 'non-core-file.php';
					$filerel  = str_replace( ABSPATH, '', $filepath );

					if ( file_exists( $filepath ) ) {
						$success = $this->delete_file( $filerel );
						$message = 'Removed the non-core file from core directory.';
					} else {
						// write a innocuous file to
						$success = $this->write_file( $filepath, "<?php echo 'I am a bad file'; ?>" );
						$message = "Created non-core file $filerel in a core directory.";
					}

					if ( $success !== false ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', "Unable to write/remove threat file $filerel" );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
		// POST DB
		register_rest_route(
			'jptt/v1',
			'/generate-post',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					global $wpdb;
					$post_id = $wpdb->get_var( "SELECT ID FROM $wpdb->posts WHERE post_title = 'Scan Tester Post'" );
					if ( $post_id ) {
						// Scan tester post already exists - remove it
						$success = wp_delete_post( $post_id, true );
						$message = 'Removed the Scan tester post.';
					} else {
						// Scan tester post does not exist - create it
						$post_id = wp_insert_post(
							array(
								'post_title'   => 'Scan Tester Post',
								'post_content' => 'This will trigger the db scanner <script>let url="' . base64_decode( 'Y2xhc3NpY3RyYWluZXJzb25saW5lLmNvbQ==' ) . '"</script>',
								'post_status'  => 'publish',
								'post_type'    => 'post',
							)
						);
						$success = is_int( $post_id ) && $post_id > 0 ? true : false;
						$message = 'Created a new Scan tester post.';
					}

					if ( $success ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', 'Unable to create/remove post.' );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
		// INFECTED FILE
		register_rest_route(
			'jptt/v1',
			'/generate-infect',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => function ( \WP_REST_Request $req ) {
					$dir      = str_replace( site_url() . '/', ABSPATH, content_url() );
					$filepath = $dir . '/index.php';
					$filerel  = str_replace( ABSPATH, '', $filepath );
					$lines    = file( $filepath );

					// check if we've already modified this file
					if ( $lines[ count( $lines ) - 1 ] === 'HTML;' ) {
						// eliminate the threat by removing the modification
						array_splice( $lines, count( $lines ) - 3, 3 );
						$success = $this->write_file( $filepath, implode( '', $lines ) );

						$message = "Removed the EICAR threat from: $filerel";
					} else {
						// add the threat by modifying the file
						$content = "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;";

						$success = $this->write_file( $filepath, $content, FILE_APPEND );
						$message = "Added an EICAR threat to: $filerel";
					}

					if ( $success !== false ) {
						return $message;
					} else {
						return new WP_Error( 'could-not-write', "Unable to write/remove threat from $filerel" );
					}
				},
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Render the UI.
	 */
	public function render_ui() {
		// eicar check
		$dir   = wp_upload_dir()['basedir'];
		$eicar = file_exists( "$dir/jptt_eicar.php" ) ? 'checked' : '';
		// suspciious link check
		$suspicious_link = file_exists( "$dir/jptt_suspicious_link.php" ) ? 'checked' : '';

		// core modification check
		$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$lines    = file( "$dir/index.php" );
		$core_mod = $lines[ count( $lines ) - 1 ] === 'if ( true === false ) exit();' ? 'checked' : '';

		// non-core file check
		$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$core_add = file_exists( "$dir/non-core-file.php" ) ? 'checked' : '';

		// post db check
		$post_db = post_exists( 'Scan Tester Post' ) ? 'checked' : '';

		// infected file check
		$dir    = str_replace( site_url() . '/', ABSPATH, content_url() );
		$lines  = file( "$dir/index.php" );
		$infect = $lines[ count( $lines ) - 1 ] === 'HTML;' ? 'checked' : '';

		$ajax_nonce = wp_create_nonce( 'wp_rest' );
		?>
	
		<div id="a8cjptt-alert" class="a8cjptt-alert"><strong>Notifications</strong></div>

		<?php echo request_filesystem_credentials( 'admin.php?page=scan-helper', false, false, null ); ?>
	
		<div class="wrap">
			<ul class="a8cjptt-threats">
				<li>
					EICAR Threat
					<label class="a8cjptt-switch">
						<input id="threat-eicar" type="checkbox" <?php echo esc_attr( $eicar ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove five EICAR threats (one for every severity) to a new file in the WordPress <code>uploads</code> folder.</p>
				</li>
				<li>
					Suspicious Link
					<label class="a8cjptt-switch">
						<input id="threat-suspicious-link" type="checkbox" <?php echo esc_attr( $suspicious_link ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove a link that will be flagged by Akismet to a new file in the Wordpress <code>uploads</code> folder.</p>
				</li>
				<li>
					Core File Modification Threat
					<label class="a8cjptt-switch">
						<input id="threat-core" type="checkbox" <?php echo esc_attr( $core_mod ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove a Core File Modification threat in the WordPress <code>wp-admin</code> folder.</p>
				</li>
				<li>
					Add a Non-Core File to Core Directory
					<label class="a8cjptt-switch">
						<input id="threat-core-add" type="checkbox" <?php echo esc_attr( $core_add ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove a file to the <code>wp-admin</code> core directory.</p>
				</li>
				<li>
					Post DB Threat
					<label class="a8cjptt-switch">
						<input id="threat-post" type="checkbox" <?php echo esc_attr( $post_db ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove a blog post containing data that will trigger a DB scan.</p>
				</li>
				<li>
					Infect a File Threat
					<label class="a8cjptt-switch">
						<input id="threat-infect" type="checkbox" <?php echo esc_attr( $infect ); ?>>
						<span class="a8cjptt-slider round"></span>
					</label>
					<p>Add/Remove an EICAR threat to an existing file in the WordPress <code>contents</code> folder.</p>
				</li>
			</ul>
		</div>
	
		<script type="text/javascript">
		jQuery.ajaxSetup( { headers: { 'X-WP-Nonce': '<?php echo esc_attr( $ajax_nonce ); ?>' } } );
		jQuery( document ).ready( function ( $ ) {
	
			function sendRequest( $cmd ) {
				$.post(
					'<?php echo esc_attr( rest_url() ); ?>jptt/v1/' + $cmd,
					{ action: 'generate' }
				).then(
					// success
					function( message ) {
						$( '#a8cjptt-alert' )
							.removeClass( 'a8cjptt-danger' )
							.addClass( 'a8cjptt-success' )
							.text( message );
					},
					// error
					function( response ) {
						$( '#a8cjptt-alert' )
							.removeClass( 'a8cjptt-success' )
							.addClass( 'a8cjptt-danger' )
							.text( response.responseJSON.message );
					}
				);
			}
	
			$( '#threat-eicar' ).on( 'click', () => sendRequest( 'generate-eicar' ) );
	
			$( '#threat-suspicious-link' ).on( 'click', () => sendRequest( 'generate-suspicious-link' ) );
	
			$( '#threat-core' ).on( 'click', () => sendRequest( 'generate-core' ) );
	
			$( '#threat-core-add' ).on( 'click', () => sendRequest( 'generate-core-add' ) );
	
			$( '#threat-post' ).on( 'click', () => sendRequest( 'generate-post' ) );
	
			$( '#threat-infect' ).on( 'click', () => sendRequest( 'generate-infect' ) );
		} );
		</script>
		<?php
	}
}

add_action(
	'plugins_loaded',
	function () {
		new Scan_Helper();
	},
	1000
);
