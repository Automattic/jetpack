<?php
/**
 * The Coverage Logger file contains the class `Coverage_Logger` that logs coverage data.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

require_once __DIR__ . '/inc/class-coverage-data-loader.php';

/**
 * Class Coverage_Logger
 *
 * Handles logging of coverage data that Jetpack plugins generate.
 *
 * @package Automattic\Jetpack\Debug_Helper
 */
class Coverage_Logger {

	const RUNTIME_TABLE_NAME = 'jetpack_runtime_coverage_data';
	const TEST_TABLE_NAME    = 'jetpack_test_coverage_data';

	/**
	 * Starts the coverage logging process in case the needed criteria match.
	 */
	public static function maybe_start_logging() {
		if ( function_exists( 'xdebug_start_code_coverage' ) ) {
			self::maybe_upsert_database();

			xdebug_start_code_coverage();
			add_action( 'shutdown', array( self::class, 'log_coverage_results' ), 100000 );
		}
	}

	/**
	 * XMLRPC_Logger constructor.
	 * Hooks the XML-RPC logging function into WordPress's init action.
	 */
	public function __construct() {

		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		// POST actions
		add_action( 'admin_post_clear_real_coverage', array( $this, 'admin_post_clear_real_coverage' ) );
		add_action( 'admin_post_clear_test_coverage', array( $this, 'admin_post_clear_test_coverage' ) );
	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Coverage Logger',
			'Coverage Logger',
			'manage_options',
			'coverage-logger',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Some custom style.
	 */
	public function enqueue_scripts() {
		$screen = get_current_screen();
		if ( $screen->id !== 'jetpack-debug_page_modules-helper' ) {
			return;
		}
		?>
			<style>
				table {
					width: 50%;
					float: left;
					margin-bottom: 50px;
				}
				th {
					text-align: left;
					font-size: 110%;
				}
			</style>
		<?php
	}

	/**
	 * Renders the UI.
	 */
	public function render_ui() {
		$html  = '<h1>Coverage difference logger</h1>';
		$html .= '<p>Allows you to see what code gets actually run and compare it to existing test coverage.</p><hr />';

		?>

		<div><?php echo wp_kses_post( $html ); ?></div>

		<hr />
		<p>Here you can clear the existing stored coverage data. Click the button to truncate the corresponding table.</p>
		<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
			<p>Clear the data that gets observed on this site:
				<input type="hidden" name="action" value="clear_real_coverage">
				<?php wp_nonce_field( 'clear-real-coverage' ); ?>
				<input type="submit" value="Clear real coverage data" class="button button-secondary button-small">
			</p>
			<p>Clear the data that you submit via this tool:
				<input type="hidden" name="action" value="clear_test_coverage">
				<?php wp_nonce_field( 'clear-test-coverage' ); ?>
				<input type="submit" value="Clear test coverage data" class="button button-secondary button-small">
			</p>
		</form>
		<hr />
		<?php
	}

	/**
	 * Purge real coverage data from the coverage table.
	 */
	public function admin_post_clear_real_coverage() {
		global $wpdb;

		check_admin_referer( 'clear-real-coverage' );

		$wpdb->query( sprintf( 'TRUNCATE TABLE `%s`', $wpdb->prefix . self::RUNTIME_TABLE_NAME ) ); // phpcs:ignore WordPress.DB

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Purge test coverage data from the coverage table.
	 */
	public function admin_post_clear_test_coverage() {
		global $wpdb;

		check_admin_referer( 'clear-test-coverage' );

		$wpdb->query( sprintf( 'TRUNCATE TABLE `%s`', $wpdb->prefix . self::TEST_TABLE_NAME ) ); // phpcs:ignore WordPress.DB

		$this->admin_post_redirect_referrer();
	}

	/**
	 * Redirect back to the referrer.
	 */
	public function admin_post_redirect_referrer() {
		if ( wp_get_referer() ) {
			wp_safe_redirect( wp_get_referer() );
		} else {
			wp_safe_redirect( get_home_url() );
		}
	}

	/**
	 * Saves coverage results into a file.
	 */
	public static function log_coverage_results() {
		global $wpdb;

		$coverage_data = xdebug_get_code_coverage();

		$sql = sprintf( 'INSERT IGNORE INTO `%s` (path, line) VALUES ', $wpdb->prefix . self::RUNTIME_TABLE_NAME );

		foreach ( $coverage_data as $file => $lines ) {
			$path = substr( $file, strlen( ABSPATH ) );

			if ( ! str_starts_with( $path, 'wp-content/plugins/jetpack' ) ) {
				continue;
			}

			if ( false !== strpos( $path, '/vendor/' ) ) {
				continue;
			}

			$path = substr( $path, strlen( 'wp-content/plugins/' ) );

			$vendor_pos = strpos( $path, 'jetpack_vendor' );
			if ( false !== $vendor_pos ) {
				$path = substr( $path, $vendor_pos + strlen( 'jetpack_vendor/automattic/' ) );
			}

			foreach ( $lines as $line => $count ) {
				for ( $i = 0; $i < $count; $i++ ) {
					$sql .= $wpdb->prepare( '( %s, %d ),', $path, $line );
				}
			}
		}

		$wpdb->query( rtrim( $sql, ',' ) ); // phpcs:ignore WordPress.DB -- We are preparing the query before this.
	}

	/**
	 * Uses the dbDelta function to either update, create, or leave the existing
	 * database in peace.
	 */
	protected static function maybe_upsert_database() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();
		$table_name      = $wpdb->prefix . self::RUNTIME_TABLE_NAME;

		$sql = array(
			"CREATE TABLE $table_name (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  path varchar(255),
  line int,
  PRIMARY KEY (id),
  UNIQUE KEY `unique_path` (path, line)
) $charset_collate;",
		);

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Returns an SQL string for getting the coverage diff results.
	 */
	protected function get_coverage_diff() {
		return '
SELECT
    runtime.path AS file_path,
    runtime.lines_covered AS runtime_coverage,
    test.line AS test_coverage,
    runtime.lines_covered - test.line AS coverage_difference
        FROM
    (
        SELECT
            path,
            COUNT(DISTINCT line) AS lines_covered
        FROM
            wp_jetpack_runtime_coverage_data
        GROUP BY
            path
    ) AS runtime
    INNER JOIN
    (
        SELECT
            path,
            line
        FROM
            wp_jetpack_test_coverage_data
    ) AS test
    ON runtime.path = test.path
    ORDER BY coverage_difference
';
	}
}

if ( isset( $_COOKIE['jetpack_enable_coverage_logging'] ) ) {
	Coverage_Logger::maybe_start_logging();
}

add_action(
	'plugins_loaded',
	function () {
		new Coverage_Logger();
	},
	1000
);
