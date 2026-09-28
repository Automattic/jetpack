<?php
/**
 * SQL_Postprocessor file.
 *
 * @package wpcomsh
 */

// This class performs multiple low-level operations on the database.

// phpcs:disable phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:disable WordPress.DB.DirectDatabaseQuery.NoCaching
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared
// phpcs:disable WordPress.DB.DirectDatabaseQuery.SchemaChange

namespace Imports;

require_once __DIR__ . '/../class-backup-import-action.php';

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Postprocess a SQL database.
 */
class SQL_Postprocessor extends \Imports\Backup_Import_Action {
	const PLAYGROUND_SCOPED_URL = 'https://playground.wordpress.net/scope:';

	/**
	 * The home URL.
	 *
	 * @var string
	 */
	private string $home_url;

	/**
	 * The site URL.
	 *
	 * @var string
	 */
	private string $site_url;

	/**
	 * The table temporary prefix.
	 *
	 * @var string
	 */
	private string $tmp_prefix;

	/**
	 * Whether to run the command in dry run mode.
	 *
	 * @var bool
	 */
	private bool $dry_run;

	/**
	 * SQL_Postprocessor constructor.
	 *
	 * @param string                       $home_url   The home URL.
	 * @param string                       $site_url   The site URL.
	 * @param string                       $tmp_prefix The table temporary prefix.
	 * @param bool                         $dry_run    Whether to run the command in dry run mode.
	 * @param null|Utils\Logger\FileLogger $logger     An optional logger for logging operations.
	 */
	public function __construct( string $home_url, string $site_url, string $tmp_prefix, $dry_run = true, $logger = null ) {
		parent::__construct( $logger );
		$this->home_url   = $home_url;
		$this->site_url   = $site_url;
		$this->tmp_prefix = $tmp_prefix;
		$this->dry_run    = $dry_run;
	}

	/**
	 * Postprocess the database after importing.
	 *
	 * @return bool|\WP_Error
	 */
	public function postprocess() {
		global $wpdb;

		// 1. Replace the URLs.
		$ret = $this->replace_urls();

		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// 2. Preserve a whitelist of options.
		$ret = $this->save_whitelist_options();

		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// 3. Remove a list of options.
		$ret = $this->remove_options();

		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// 4. Merge plugins.
		$ret = $this->merge_plugins();

		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// 5. Replace temporary users.
		$ret = $this->replace_users();

		if ( is_wp_error( $ret ) ) {
			return $ret;
		}

		// Query used to replace the tables.
		// We do not replace the users and usermeta tables.
		$exclude_list  = array( $wpdb->prefix . 'users', $wpdb->prefix . 'usermeta' );
		$replace_query = $this->get_tables_replace_query( $exclude_list );

		if ( ! is_array( $replace_query ) ) {
			return $replace_query;
		}

		if ( ! $this->dry_run ) {
			$this->log( 'Replace tables' );

			// 6. Replace tables with temporary ones.
			foreach ( $replace_query as $query ) {
				$wpdb->query( $query );
			}

			// Flush the cache. This is needed to have fresh data.
			wp_cache_flush();
		}

		return true;
	}

	/**
	 * Postprocess the database after importing.
	 *
	 * @return bool|\WP_Error
	 */
	public function replace_urls() {
		global $wpdb;

		$this->log( 'Replace URLs' );

		if ( ! wp_http_validate_url( $this->home_url ) ) {
			return $this->error( 'invalid-home-url', __( 'The home URL is not valid.', 'wpcomsh' ) );
		}

		if ( ! wp_http_validate_url( $this->site_url ) ) {
			return $this->error( 'invalid-site-url', __( 'The site URL is not valid.', 'wpcomsh' ) );
		}

		// Get the options from Playground database.
		$tmp_options  = $this->tmp_table_name( 'options' );
		$query        = "SELECT option_value FROM {$tmp_options} WHERE option_name = '%s'";
		$prev_siteurl = $wpdb->get_var( sprintf( $query, 'siteurl' ) );

		if ( $prev_siteurl === null ) {
			return $this->error( 'missing-siteurl', __( 'Missing site URL.', 'wpcomsh' ) );
		}

		// 1. Replace the URLs.
		$this->log( "Replace siteurl '{$prev_siteurl}' with '{$this->site_url}'" );
		$this->search_replace( $prev_siteurl, esc_url_raw( $this->site_url ), $this->tmp_prefix . '*' );

		$prev_home = $wpdb->get_var( sprintf( $query, 'home' ) );

		if ( $prev_home === null ) {
			return $this->error( 'missing-home', __( 'Missing home URL.', 'wpcomsh' ) );
		}

		if ( $prev_home !== $prev_siteurl ) {
			// 2. Replace the (home) URLs.
			$this->log( "Replace home '{$prev_home}' with '{$this->home_url}'" );
			$this->search_replace( $prev_home, esc_url_raw( $this->home_url ), $this->tmp_prefix . '*' );
		}

		$app_scope = $this->get_app_scope();

		if ( $app_scope !== null ) {
			$scope = self::PLAYGROUND_SCOPED_URL . $app_scope;
			// 3. Replace the app scope.
			$this->log( "Replace app scope '{$scope}' with '{$this->site_url}'" );
			$this->search_replace( $scope, esc_url_raw( $this->site_url ), $this->tmp_prefix . '*' );
		}

		return true;
	}

	/**
	 * Save a whitelist of options in temporary tables.
	 *
	 * @return bool|\WP_Error
	 */
	public function save_whitelist_options() {
		global $wpdb;

		// A list of options to save.
		$whitelist = array(
			'admin_email',
			'jetpack_active_modules',
			'jetpack_options',
			'jetpack_private_options',
			'permalink_structure',
			'db_version',
		);

		// Substitute the options.
		$tmp_options = $this->tmp_table_name( 'options' );
		$options     = implode( "', '", $whitelist );
		$query       = "SELECT option_name, option_value FROM %s WHERE option_name IN ('{$options}')";
		$options     = $wpdb->get_results( sprintf( $query, $wpdb->prefix . 'options' ), ARRAY_A );

		if ( ! count( $options ) ) {
			$this->log( 'No whitelist options' );

			return false;
		}

		$inserted = 0;

		foreach ( $options as $option ) {
			$this->log( 'Save ' . $option['option_name'] );

			// Replace the option.
			$last_insert_id = $wpdb->replace(
				$tmp_options,
				array(
					'option_name'  => $option['option_name'],
					'option_value' => $option['option_value'],
				),
				array( '%s', '%s' )
			);

			if ( $last_insert_id !== false ) {
				++$inserted;
			}
		}

		if ( $inserted > 0 ) {
			$this->log( 'Whitelist options saved' );

			return true;
		} else {
			return $this->error( 'error-save-whitelist-option', __( 'Error saving whitelist options.', 'wpcomsh' ) );
		}
	}

	/**
	 * Remove a list of options.
	 */
	public function remove_options() {
		global $wpdb;

		// A list of options to remove.
		$remove = array(
			'new_admin_email', // This option is saved by default in Playground, not needed.
		);

		// Substitute the options.
		$tmp_options = $this->tmp_table_name( 'options' );
		$options     = implode( "', '", $remove );
		$query       = "DELETE FROM %s WHERE option_name IN ('{$options}')";
		$deleted     = $wpdb->query( sprintf( $query, $tmp_options ) );

		$this->log( 'Options removed: ' . (int) $deleted );

		return true;
	}

	/**
	 * Replace the users.
	 *
	 * @return bool|\WP_Error
	 */
	public function replace_users() {
		global $wpdb;

		$this->log( 'Replace users' );

		if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) ) {
			// Jetpack is not installed.
			return $this->error( 'jetpack-not-installed', __( 'Jetpack is not installed.', 'wpcomsh' ) );
		}

		$manager  = new Connection_Manager( 'jetpack' );
		$owner_id = $manager->get_connection_owner_id();

		if ( $owner_id === false ) {
			// The site is not connected.
			return $this->error( 'site-not-connected', __( 'The site is not connected.', 'wpcomsh' ) );
		}

		// Remap all posts.
		$posts_table = $this->tmp_table_name( 'posts' );
		$changed     = $wpdb->query( $wpdb->prepare( 'UPDATE ' . $posts_table . ' SET post_author=%d', $owner_id ) );

		if ( $changed === false ) {
			return $this->error( 'error-update-posts', __( 'Error update posts.', 'wpcomsh' ) );
		} else {
			$this->log( 'Posts updated: ' . $changed );
		}

		// Remap all links.
		$links_table = $this->tmp_table_name( 'links' );
		$changed     = $wpdb->query( $wpdb->prepare( 'UPDATE ' . $links_table . ' SET link_owner=%d', $owner_id ) );

		if ( $changed === false ) {
			return $this->error( 'error-update-links', __( 'Error update links.', 'wpcomsh' ) );
		} else {
			$this->log( 'Links updated: ' . $changed );
		}

		return true;
	}

	/**
	 * Merge the plugins.
	 *
	 * @return bool
	 */
	public function merge_plugins(): bool {
		global $wpdb;

		$tmp_options = $this->tmp_table_name( 'options' );
		$query       = "SELECT option_value FROM {$tmp_options} WHERE option_name = 'active_plugins'";

		// Get the active plugins and the temporary ones.
		$active_plugins     = (array) get_option( 'active_plugins', array() );
		$tmp_active_plugins = $wpdb->get_var( $query );

		if ( ! empty( $tmp_active_plugins ) ) {
			$tmp_active_plugins = maybe_unserialize( $tmp_active_plugins );

			if ( is_array( $tmp_active_plugins ) ) {
				// Playground has some incompatible plugins installed by default.
				$incompatible_plugins = array(
					'sqlite-database-integration/load.php',
					'wordpress-importer/wordpress-importer.php',
				);

				// Remove the incompatible plugins.
				$tmp_active_plugins = array_diff( $tmp_active_plugins, $incompatible_plugins );

				// Merge the plugins.
				$active_plugins = array_merge( $active_plugins, $tmp_active_plugins );
				$active_plugins = array_unique( $active_plugins );
			}
		}

		$new_option = array( 'option_value' => maybe_serialize( $active_plugins ) );
		$result     = $wpdb->update( $tmp_options, $new_option, array( 'option_name' => 'active_plugins' ) );

		return $result !== false;
	}

	/**
	 * Get the replace table SQL query.
	 *
	 * @param array $exclude The tables to exclude.
	 *
	 * @return array|\WP_Error
	 */
	public function get_tables_replace_query( $exclude = array() ) {
		global $wpdb;

		$this->log( 'Generate replace query' );

		// Can't change the prefix if it's not different.
		if ( $this->tmp_prefix === $wpdb->prefix ) {
			return $this->error( 'invalid-prefix', __( 'Temporary prefix is equals to current prefix.', 'wpcomsh' ) );
		}

		$results = $wpdb->get_results( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( $this->tmp_prefix ) . '%' ), ARRAY_N );

		// Check if the temporary tables exist.
		if ( null === $results || ( is_array( $results ) && ! count( $results ) ) ) {
			return $this->error( 'missing-tables', __( 'Missing temporary tables.', 'wpcomsh' ) );
		}

		$prefix_len = strlen( $this->tmp_prefix );
		$tmp_tables = array();
		$tables     = array();
		$renames    = array();

		// Build the list of tables to rename, from tmp_wp_* to wp_*.
		foreach ( $results as $result ) {
			$from = $result[0];
			$to   = substr( $result[0], $prefix_len );

			// Save the temporary tables to drop them later.
			$tmp_tables[] = $from;

			// Skip the tables to exclude.
			if ( in_array( $to, $exclude, true ) ) {
				continue;
			}

			$tables[]  = $to;
			$renames[] = $from . ' TO ' . $to; // The string 'tmp_wp_table TO wp_table'
		}

		// Drop production wp_* tables.
		// Rename temporary tables tmp_wp_* with wp_*.
		// Drop tmp_* temporary tables.
		$ret = array( 'START TRANSACTION' );

		if ( count( $tables ) ) {
			$ret[] = 'DROP TABLE IF EXISTS ' . implode( ', ', $tables );
		}

		if ( count( $renames ) ) {
			$ret[] = 'RENAME TABLE ' . implode( ', ', $renames );
		}

		if ( count( $tmp_tables ) ) {
			$ret[] = 'DROP TABLE IF EXISTS ' . implode( ', ', $tmp_tables );
		}

		$ret[] = 'COMMIT';

		return $ret;
	}

	/**
	 * Search and replace a string in the database.
	 *
	 * @param string $search  The string to search.
	 * @param string $replace The string to replace.
	 * @param string $tables  The tables to search and replace.
	 * @param bool   $dry_run Whether to run the command in dry run mode.
	 *
	 * @return mixed
	 */
	public function search_replace( string $search, string $replace, string $tables, bool $dry_run = false ) {
		$replace_query = 'search-replace \'%s\' \'%s\' \'%s\' %s';
		$options       = array(
			'--all-tables',
			'--precise',
			'--no-report',
			'--format=count',
		);

		if ( $dry_run ) {
			$options[] = '--dry-run';
		}

		$options = implode( ' ', $options );
		$command = sprintf(
			$replace_query,
			$search,
			$replace,
			$tables,
			$options
		);

		// Replace the site URL.
		return $this->run_command( $command, array( 'return' => true ) );
	}

	/**
	 * Run a WP-CLI command.
	 *
	 * @param string $command The command to run.
	 * @param array  $args    The arguments to pass to the command.
	 *
	 * @return mixed
	 */
	public function run_command( $command, $args = array() ) {
		if ( class_exists( 'WP_CLI' ) ) {
			return \WP_CLI::runcommand( $command, $args );
		}

		return false;
	}

	/**
	 * Get the temporary table name.
	 *
	 * @param string $table_name The table name.
	 *
	 * @return string
	 */
	public function tmp_table_name( string $table_name ): string {
		global $wpdb;

		return $this->tmp_prefix . $wpdb->prefix . $table_name;
	}

	/**
	 * Get the app scope.
	 *
	 * The app scope is a guid like https://playground.wordpress.net/scope:app-scope.
	 *
	 * @see https://wordpress.github.io/wordpress-playground/architecture/browser-scopes/
	 *
	 * @return null|string|\WP_Error
	 */
	public function get_app_scope() {
		global $wpdb;

		// Get the first scoped URL from database, if any.
		$tmp_posts = $this->tmp_table_name( 'posts' );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$query = $wpdb->prepare( "SELECT guid FROM {$tmp_posts} WHERE guid LIKE %s LIMIT 1", self::PLAYGROUND_SCOPED_URL . '%' );
		$guid  = $wpdb->get_var( $query );

		if ( $guid === null ) {
			// Nothing to replace.
			return null;
		}

		// See setURLScope function in playground.js.
		return $this->get_url_scope( $guid );
	}

	/**
	 * Get the scope from a URL.
	 *
	 * @param string $url The URL.
	 * @param string $scope The scope.
	 *
	 * @return string|null
	 */
	public function get_url_scope( string $url, string $scope = self::PLAYGROUND_SCOPED_URL ): ?string {
		// See setURLScope function in Playground.
		$pattern = '/' . preg_quote( $scope, '/' ) . '([^\/]+)\/.*/';
		$matches = array();
		$ret     = preg_match( $pattern, $url, $matches );

		if ( $ret !== 1 || ! isset( $matches[1] ) ) {
			return null;
		}

		return $matches[1];
	}
}

// phpcs:enable
