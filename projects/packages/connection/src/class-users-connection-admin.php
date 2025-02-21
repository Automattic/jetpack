<?php
/**
 * Handles the WordPress.com account column in the users list table.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Class Users_Connection_Admin
 */
class Users_Connection_Admin {
	/**
	 * The column ID used for the WordPress.com account column.
	 *
	 * @var string
	 */
	const COLUMN_ID = 'user_jetpack';

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Only set up hooks if we're in the admin area and user has proper permissions
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Initialize the admin functionality if conditions are met.
	 */
	public function init() {
		if ( ! is_admin() || ! current_user_can( 'manage_options' ) || ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		add_filter( 'manage_users_columns', array( $this, 'add_connection_column' ) );
		add_filter( 'manage_users_custom_column', array( $this, 'render_connection_column' ), 9, 3 ); // Priority 9 to run before SSO
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_print_styles-users.php', array( $this, 'add_connection_column_styles' ) );
	}

	/**
	 * Add the connection column to the users list table.
	 *
	 * @param array $columns The current columns.
	 * @return array Modified columns.
	 */
	public function add_connection_column( $columns ) {
		$columns[ self::COLUMN_ID ] = sprintf(
			'<span class="jetpack-connection-tooltip-icon" role="tooltip" tabindex="0" aria-label="%2$s: %1$s">
				%1$s
				<span class="jetpack-connection-tooltip"></span>
			</span>',
			esc_html__( 'WordPress.com account', 'jetpack-connection' ),
			esc_attr__( 'Tooltip', 'jetpack-connection' )
		);
		return $columns;
	}

	/**
	 * Render the connection column content.
	 *
	 * @param string $output      Custom column output.
	 * @param string $column_name Column name.
	 * @param int    $user_id     ID of the currently-listed user.
	 * @return string
	 */
	public function render_connection_column( $output, $column_name, $user_id ) {
		if ( self::COLUMN_ID !== $column_name ) {
			return $output;
		}

		if ( ( new Manager() )->is_user_connected( $user_id ) ) {
			return sprintf(
				'<span title="%1$s" class="jetpack-connection-status">%2$s</span>',
				esc_attr__( 'This user has connected their WordPress.com account.', 'jetpack-connection' ),
				esc_html__( 'Connected', 'jetpack-connection' )
			);
		}

		return $output;
	}

	/**
	 * Enqueue scripts and styles.
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_scripts( $hook ) {
		if ( 'users.php' !== $hook ) {
			return;
		}

		Assets::register_script(
			'jetpack-users-connection',
			'../dist/jetpack-users-connection.js',
			__FILE__,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
				'enqueue'   => true,
				'version'   => Package_Version::PACKAGE_VERSION,
				'deps'      => array( 'wp-i18n' ),

			)
		);

		wp_localize_script(
			'jetpack-users-connection',
			'jetpackConnectionTooltips',
			array(
				'columnTooltip' => esc_html__( 'Connecting a WordPress.com account unlocks Jetpack’s full suite of features including secure logins.', 'jetpack-connection' ),
			)
		);
	}

	/**
	 * Add styles for the connection column.
	 */
	public function add_connection_column_styles() {
		?>
		<style>
			.jetpack-connection-tooltip-icon {
				position: relative;
				cursor: pointer;
			}
			/* Add [?] icon using pseudo-element, only in column header */
			th.manage-column .jetpack-connection-tooltip-icon::after {
				content: '[?]';
				color: #3c434a;
				font-size: 1em;
				margin-left: 4px;
			}
			.jetpack-connection-tooltip {
				position: absolute;
				background: #f6f7f7;
				top: -85px;
				width: 250px;
				padding: 7px;
				color: #3c434a;
				font-size: .75rem;
				line-height: 17px;
				text-align: left;
				margin: 0;
				display: none;
				border-radius: 4px;
				font-family: sans-serif;
				box-shadow: 5px 10px 10px rgba(0, 0, 0, 0.1);
				left: -170px;
			}
			.column-user_jetpack {
				width: 140px;
			}
			/* Show tooltip on hover and focus */
			.jetpack-connection-tooltip-icon:hover .jetpack-connection-tooltip,
			.jetpack-connection-tooltip-icon:focus-within .jetpack-connection-tooltip {
				display: block;
			}
		</style>
		<?php
	}

	/**
	 * Get the column ID. Allows other classes to reference the same column.
	 *
	 * @return string
	 */
	public static function get_column_id() {
		return self::COLUMN_ID;
	}
}
