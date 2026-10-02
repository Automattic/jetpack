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
	 * The handle used for the users list table column styles.
	 *
	 * @var string
	 */
	const STYLE_HANDLE = 'jetpack-connection-users-column';

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
			$logo_url = Jetpack_Connector::get_inline_connector_logo_url();

			return sprintf(
				'<span title="%1$s" class="jetpack-connection-status"><img src="%2$s" alt="" class="jetpack-connection-status__logo" height="18" decoding="async" loading="lazy" />%3$s</span>',
				esc_attr__( 'This user has connected their WordPress.com account.', 'jetpack-connection' ),
				esc_url( $logo_url ),
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

		self::enqueue_connection_column_styles();

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
				'columnTooltip' => esc_html( self::get_column_tooltip_text() ),
			)
		);
	}

	/**
	 * Enqueue the styles for the connection column as inline CSS on a source-less handle.
	 */
	private static function enqueue_connection_column_styles() {
		// A request can run several instances of this class, and wp_add_inline_style() appends, so the CSS is added once per handle.
		if ( ! wp_style_is( self::STYLE_HANDLE, 'registered' ) ) {
			wp_register_style( self::STYLE_HANDLE, false, array(), Package_Version::PACKAGE_VERSION );
			wp_add_inline_style( self::STYLE_HANDLE, self::get_connection_column_styles() );
		}
		wp_enqueue_style( self::STYLE_HANDLE );
	}

	/**
	 * Add the styles for the connection column.
	 *
	 * @deprecated 8.12.0 The CSS is enqueued on the `jetpack-connection-users-column` style handle by enqueue_scripts().
	 */
	public function add_connection_column_styles() {
		_deprecated_function( __METHOD__, 'connection-8.12.0', __CLASS__ . '::enqueue_scripts' );
		self::enqueue_connection_column_styles();
	}

	/**
	 * Get the styles for the connection column.
	 *
	 * @return string CSS rules.
	 */
	private static function get_connection_column_styles() {
		return '
		.jetpack-connection-tooltip-icon {
			position: relative;
			cursor: pointer;
		}
		/* Add [?] icon using pseudo-element, only in column header */
		th.manage-column .jetpack-connection-tooltip-icon::after {
			content: \'[?]\';
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
			width: 190px;
		}
		@media screen and (max-width: 1100px) {
			.column-user_jetpack {
				width: auto;
			}
		}
		.jetpack-connection-status {
			display: inline-flex;
			align-items: center;
			column-gap: 6px;
		}
		.jetpack-connection-status__logo {
			display: block;
			flex-shrink: 0;
		}
		/* Show tooltip on hover and focus */
		.jetpack-connection-tooltip-icon:hover .jetpack-connection-tooltip,
		.jetpack-connection-tooltip-icon:focus-within .jetpack-connection-tooltip {
			display: block;
		}
		';
	}

	/**
	 * Build the column header tooltip text based on which plugin families use the connection.
	 *
	 * @return string Tooltip text.
	 */
	private static function get_column_tooltip_text() {
		$families = Jetpack_Connector::get_connected_plugin_families();

		if ( $families['has_woo'] && $families['has_a4a'] ) {
			return __( 'Connecting a WordPress.com account unlocks features for Jetpack, WooCommerce, and Automattic for Agencies including secure logins.', 'jetpack-connection' );
		}

		if ( $families['has_woo'] ) {
			return __( 'Connecting a WordPress.com account unlocks features for Jetpack and WooCommerce including secure logins.', 'jetpack-connection' );
		}

		if ( $families['has_a4a'] ) {
			return __( 'Connecting a WordPress.com account unlocks features for Jetpack and Automattic for Agencies including secure logins.', 'jetpack-connection' );
		}

		return __( 'Connecting a WordPress.com account unlocks Jetpack features including secure logins.', 'jetpack-connection' );
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
