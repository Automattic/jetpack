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

	private $threats = array();

	/**
	 * Construction.
	 */
	public function __construct() {
		$upload_dir    = wp_upload_dir()['basedir'];
		$admin_dir     = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$content_dir   = str_replace( site_url() . '/', ABSPATH, content_url() );
		$this->threats = array(
			'eicar'                  => "$upload_dir/jptt_eicar.php",
			'suspicious_link'        => "$upload_dir/jptt_suspicious_link.php",
			'core_file_modification' => "{$admin_dir}index.php",
			'non_core_file'          => "{$admin_dir}non-core-file.php",
			'infected_file'          => "$content_dir/index.php",
		);

		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
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
	 * Get contents of a file to an array using the WP Filesystem API
	 *
	 * @param string $file_path File path.
	 */
	private function get_contents_array( $file_path ) {
		global $wp_filesystem;

		if ( ! $this->has_credentials() ) {
			die;
		}

		return $wp_filesystem->get_contents_array( $file_path );
	}

	/**
	 * Checks the existance of a file through the WP Filesystem API.
	 *
	 * @param string $file_path File path.
	 */
	private function wp_file_exists( $file_path ) {
		global $wp_filesystem;

		if ( ! $this->has_credentials() ) {
			die;
		}

		return $wp_filesystem->exists( $file_path );
	}

	/**
	 * Write File
	 *
	 * @param string $file File path.
	 * @param string $contents File contents.
	 */
	private function write_file( $file, $contents ) {
		global $wp_filesystem;

		check_admin_referer( 'scan-helper-nonce' );

		if ( ! $this->has_credentials() ) {
			die;
		}

		$file_written = $wp_filesystem->put_contents( $file, $contents, FS_CHMOD_FILE );

		if ( ! $file_written ) {
			echo 'Error!';
			return;
		}

	}

	/**
	 * Delete File
	 *
	 * @param string $file File path.
	 */
	private function delete_file( $file ) {
		global $wp_filesystem;

		if ( ! $this->has_credentials() ) {
			die;
		}

		return $wp_filesystem->delete( $file );
	}

	/**
	 * Generate EICAR threats.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_eicar_threat() {
		$eicar_patterns =
			"<?php\n\necho <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;\n" .
			"echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNVU1BJQ0lPVVMtQU5USVZJUlVTLVRFU1QtRklMRSEkSCtIKg==' ) . "\nHTML;\n" .
			"echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNVU1BJQ0lPVVMtQU5USVZJUlVTLVRFU1QtRklMRSEkSCtIKg==' ) . "\nHTML;\n" .
			"echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLU1FRElVTS1BTlRJVklSVVMtVEVTVC1GSUxFISRIK0gq' ) . "\nHTML;\n" .
			"echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLUNSSVRJQ0FMLUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;\n";

		if ( ! $this->write_file( $this->threats['eicar'], $eicar_patterns ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file {$this->threats['eicar']}." );

		}

		return "Successfully added EICAR threats to {$this->threats['eicar']}.";
	}

	/**
	 * Remove EICAR Threat
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_eicar_threat() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['eicar'] );

		if ( ! $this->delete_file( $this->threats['eicar'] ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file $relative_file_path." );
		}

		return "Successfully removed EICAR threats to $relative_file_path.";
	}

	/**
	 * Generate suspicious link threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_suspicious_link_threat() {
		if ( ! $this->write_file( $this->threats['suspicious_link'], "<?php\n \$url = 'https://example.com/akismet-guaranteed-spam/'; \n" ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file {$this->threats['suspicious_link']}" );
		}

		return "Successfully added Suspicious Link threat to {$this->threats['suspicious_link']}";
	}

	/**
	 * Remove suspicious link threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_suspicious_link_threat() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['suspicious_link'] );

		if ( ! $this->delete_file( $relative_file_path ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file $relative_file_path." );

		}

		return "Successfully removed Suspicious Link threat from $relative_file_path.";
	}

	/**
	 * Generate core file modification threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_core_file_modification_threat() {
		$lines = $this->get_contents_array( $this->threats['core_file_modification'] );

		// add the threat by modifying the file
		$lines[] = 'if ( true === false ) exit();';

		$success = $this->write_file( $this->threats['core_file_modification'], implode( '', $lines ) );
		if ( ! $success ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file {$this->threats['core_file_modification']}" );
		}

		return "Modified the core file: {$this->threats['core_file_modification']}";
	}

	/**
	 * Remove core file modification threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_core_file_modification_threat() {
		$lines = $this->get_contents_array( $this->threats['core_file_modification'] );

		if ( $lines[ count( $lines ) - 1 ] === 'if ( true === false ) exit();' ) {
			// eliminate the threat by removing the modification
			$last = count( $lines ) - 1;
			$this->delete_file( $lines[ $last ] ); // to do - this might not work
			return 'Removed the core modification threat.';
		}

		return new WP_Error( 'could-not-write', "Unable to write/remove threat from $filerel" );
	}

	/**
	 * Generate core file modification threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_non_core_file_threat() {
		if ( ! $this->write_file( $this->threats['non_core_file'], "<?php echo 'I am a bad file'; ?>" ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file {$this->threats['non_core_file']}" );
		}

		return "Successfully added a non-core file {$this->threats['non_core_file']} in a core directory.";
	}

	/**
	 * Remove non-core file threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_non_core_file_threat() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['non_core_file'] );

		if ( ! $this->delete_file( $relative_file_path ) ) {
			return new WP_Error( 'could-not-write', "Unable to remove Non-Core File threat from $relative_fle_path." );
		}

		return "Successfully removed Non-Core File threat from $relative_file_path.";
	}

	/**
	 * Generate post db threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_post_db_threat() {
		global $wpdb;

		$post_id = $wpdb->get_var( "SELECT ID FROM $wpdb->posts WHERE post_title = 'Scan Tester Post'" );

		if ( $post_id ) {
			return 'Scan tester post already exists.';
		}

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Scan Tester Post',
				'post_content' => 'This will trigger the db scanner <script>let url="' . base64_decode( 'Y2xhc3NpY3RyYWluZXJzb25saW5lLmNvbQ==' ) . '"</script>',
				'post_status'  => 'publish',
				'post_type'    => 'post',
			)
		);

		if ( ! $post_id || ! is_int( $post_id ) ) {
			return new WP_Error( 'could-not-write', 'Unable to create post.' );
		}

		return 'Successfully created a new Scan tester post.';
	}

	/**
	 * Remove post db threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_post_db_threat() {
		global $wpdb;

		$post_id = $wpdb->get_var( "SELECT ID FROM $wpdb->posts WHERE post_title = 'Scan Tester Post'" );

		if ( ! $post_id ) {
			return 'Scan tester post does not exist.';
		}

		if ( ! wp_delete_post( $post_id, true ) ) {
			return new WP_Error( 'could-not-write', 'Unable to remove post.' );
		}

		return 'Successfully removed the Scan tester post.';
	}

	/**
	 * Generate infected file threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_infected_file_threat() {
		$content = "echo <<<HTML\n" . base64_decode( 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=' ) . "\nHTML;";
		if ( ! $this->write_file( $this->threats['infected_file'], $content, FILE_APPEND ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat from {$this->threats['infected_file']}" );
		}

		return "Successfully added infected file threat to {$this->threats['infected_file']}.";
	}

	/**
	 * Remove infected file threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_infected_file_threat() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['infected_file'] );
		$lines              = file( $this->threats['infected_file'] );
		if ( ! $lines[ count( $lines ) - 1 ] === 'HTML;' ) {
			return 'Infected file does not exist.';
		}

		// eliminate the threat by removing the modification
		array_splice( $lines, count( $lines ) - 3, 3 );
		if ( ! $this->write_file( $this->threats['infected_file'], implode( '', $lines ) ) ) {
			return new WP_Error( 'could-not-write', "Unable to remove threat from $relative_file_path." );
		}

		return "Removed the infected file threat from: $relative_file_path";
	}

	private function handle_submit() {
		if ( ! isset( $_POST['save-scan-helper'] ) ) {
			return;
		}

		check_admin_referer( 'scan-helper-nonce' );

		$successes = array();
		$errors    = array();

		// EICAR
		if ( isset( $_POST['threat-eicar'] ) ) {
			$eicar = $this->generate_eicar_threat();
		} else {
			$eicar = $this->remove_eicar_threat();
		}
		if ( is_wp_error( $eicar ) ) {
			$errors[] = $eicar;
		} else {
			$successes[] = $eicar;
		}

		// Suspicious Link
		if ( isset( $_POST['threat-suspicious-link'] ) ) {
			$suspicious_link = $this->generate_suspicious_link_threat();
		} else {
			$suspicious_link = $this->remove_suspicious_link_threat();
		}
		if ( is_wp_error( $suspicious_link ) ) {
			$errors[] = $suspicious_link;
		} else {
			$successes[] = $suspicious_link;
		}

		// Core File Modification
		if ( isset( $_POST['threat-core'] ) ) {
			$core_modification = $this->generate_core_file_modification_threat();
		} else {
			$core_modification = $this->remove_core_file_modification_threat();
		}
		if ( is_wp_error( $core_modification ) ) {
			$errors[] = $core_modification;
		} else {
			$successes[] = $core_modification;
		}

		// Non-Core File
		if ( isset( $_POST['threat-core-add'] ) ) {
			$core_add = $this->generate_core_file_modification_threat();
		} else {
			$core_add = $this->remove_non_core_file_threat();
		}
		if ( is_wp_error( $core_add ) ) {
			$errors[] = $core_add;
		} else {
			$successes[] = $core_add;
		}

		// Post DB
		if ( isset( $_POST['threat-post'] ) ) {
			$post_db = $this->generate_post_db_threat();
		} else {
			$post_db = $this->remove_post_db_threat();
		}
		if ( is_wp_error( $post_db ) ) {
			$errors[] = $post_db;
		} else {
			$successes[] = $post_db;
		}

		// Infected File
		if ( isset( $_POST['threat-infect'] ) ) {
			$infected_file = $this->generate_infected_file_threat();
		} else {
			$infected_file = $this->remove_infected_file_threat();
		}
		if ( is_wp_error( $infected_file ) ) {
			$errors[] = $infected_file;
		} else {
			$successes[] = $infected_file;
		}

		return array(
			'errors'    => $errors,
			'successes' => $successes,
		);
	}

	/**
	 * Render the UI.
	 */
	public function render_ui() {
		$submission = $this->handle_submit();
		if ( $submission ) {
			foreach ( $submission['errors'] as $wp_error ) {
				foreach ( $wp_error->errors as $error ) {
					echo $error . '<br>';
				}
			}
			foreach ( $submission['successes'] as $success ) {
				echo $success . '<br>';
			}
		}

		// eicar check
		$dir   = wp_upload_dir()['basedir'];
		$eicar = $this->wp_file_exists( $this->threats['eicar'] ) ? 'checked="checked"' : '';
		// suspciious link check
		$suspicious_link = $this->wp_file_exists( $this->threats['suspicious_link'] ) ? 'checked="checked"' : '';

		// core modification check
		$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$lines    = $this->get_contents_array( "$dir/index.php" );
		$core_mod = $lines[ count( $lines ) - 1 ] === 'if ( true === false ) exit();' ? 'checked' : '';

		// non-core file check
		$dir      = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$core_add = $this->wp_file_exists( "$dir/non-core-file.php" ) ? 'checked' : '';

		// post db check
		$post_db = post_exists( 'Scan Tester Post' ) ? 'checked' : '';

		// infected file check
		$dir    = str_replace( site_url() . '/', ABSPATH, content_url() );
		$lines  = file( "$dir/index.php" );
		$infect = $lines[ count( $lines ) - 1 ] === 'HTML;' ? 'checked' : '';

		?>

		<h1>Site Threats</h1>
	
		<div id="a8cjptt-alert" class="a8cjptt-alert"><strong>Notifications</strong></div>

		<form method="post" class="a8cjptt-threats">
			
			<?php wp_nonce_field( 'scan-helper-nonce' ); ?>

			<div>
				<label for="threat-eicar">
					<input type="checkbox" name="threat-eicar" id="threat-eicar" <?php echo $eicar; ?>> 
					<strong>EICAR Threat</strong>
					<br>
					Add/Remove five EICAR threats (one for every severity) to a new file in the WordPress <code>uploads</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-suspicious-link">
					<input type="checkbox" name="threat-suspicious-link" id="threat-suspicious-link" <?php echo $suspicious_link; ?>> 
					<strong>Suspicious Link</strong>
					<br>
					Add/Remove a link that will be flagged by Akismet to a new file in the Wordpress <code>uploads</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-core">
					<input type="checkbox" name="threat-core" id="threat-core" <?php echo $core_mod; ?>> 
					<strong>Core File Modification Threat</strong>
					<br>
					Add/Remove a Core File Modification threat in the WordPress <code>wp-admin</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-core-add">
					<input type="checkbox" name="threat-core-add" id="threat-core-add" <?php echo $core_add; ?>> 
					<strong>Add a Non-Core File to Core Directory</strong>
					<br>
					Add/Remove a file to the <code>wp-admin</code> core directory.
				</label>
			</div>

			<div>
				<label for="threat-post">
					<input type="checkbox" name="threat-post" id="threat-post" <?php echo $post_db; ?>> 
					<strong>Post DB Threat</strong>
					<br>
					Add/Remove a blog post containing data that will trigger a DB scan.
				</label>
			</div>

			<div>
				<label for="threat-infect">
					<input type="checkbox" name="threat-infect" id="threat-infect" <?php echo $infect; ?>> 
					<strong>Infect a File Threat</strong>
					<br>
					Add/Remove an EICAR threat to an existing file in the WordPress <code>contents</code> folder.
				</label>
			</div>

			<div>
				<input type="submit" name="save-scan-helper" value="Update Site Threats" class="button button-primary">
			</div>

		</form>
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
