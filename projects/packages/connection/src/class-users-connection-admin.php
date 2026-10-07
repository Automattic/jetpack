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
	 * Query argument that filters the users list to connected users.
	 *
	 * @var string
	 */
	const VIEW_QUERY_ARG = 'jetpack_connection';

	/**
	 * Value of VIEW_QUERY_ARG that selects the connected view. Doubles as the view's
	 * key, which WP_List_Table::views() renders as the list item's class.
	 *
	 * @var string
	 */
	const VIEW_CONNECTED = 'connected';

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
		// Static callbacks: a request runs several instances of this class, and WP keys
		// callbacks by object hash, so instance callbacks here would stack up and print the
		// hidden field once each. The column callbacks above stack harmlessly.
		add_filter( 'views_users', array( self::class, 'add_connected_view' ) );
		add_filter( 'users_list_table_query_args', array( self::class, 'filter_query_to_connected_users' ) );
		add_action( 'restrict_manage_users', array( self::class, 'keep_connected_view_on_submit' ) );
	}

	/**
	 * Carry the connected view through the list table's form submissions.
	 *
	 * The search box and bulk actions submit a GET form that only replays the parameters
	 * it carries, so without this, searching from the connected view silently searches
	 * every user while the view still looks active. Core preserves `role` the same way.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $which Which tablenav is being rendered, 'top' or 'bottom'.
	 */
	public static function keep_connected_view_on_submit( $which ) {
		// Both tablenavs sit in the same form, so only one copy of the field is needed.
		if ( 'top' !== $which || ! self::is_connected_view() ) {
			return;
		}

		printf(
			'<input type="hidden" name="%1$s" value="%2$s" />',
			esc_attr( self::VIEW_QUERY_ARG ),
			esc_attr( self::VIEW_CONNECTED )
		);
	}

	/**
	 * Whether the users list is currently filtered to connected users.
	 *
	 * Only the per-site Users screen offers the view. Network admin shares the same
	 * list-table hooks but never shows the link, so honouring the argument there would
	 * narrow those lists silently, by this site's tokens, with no way to clear it.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function is_connected_view() {
		if ( is_network_admin() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only list filter, compared against a fixed value.
		$view = isset( $_GET[ self::VIEW_QUERY_ARG ] ) ? sanitize_key( wp_unslash( $_GET[ self::VIEW_QUERY_ARG ] ) ) : '';

		return self::VIEW_CONNECTED === $view;
	}

	/**
	 * URL of the users list filtered to connected users.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public static function get_connected_view_url() {
		return add_query_arg( self::VIEW_QUERY_ARG, self::VIEW_CONNECTED, admin_url( 'users.php' ) );
	}

	/**
	 * Local user IDs holding a valid WordPress.com user token.
	 *
	 * There is no meta to query: the tokens live in the `user_tokens` grouped option,
	 * keyed by local user ID. Read it once rather than calling `is_user_connected()` per
	 * key — that re-reads the option, and on managed hosts external storage serves it
	 * with an uncached query. An ID here need not resolve to a user; see the count.
	 *
	 * @since $$next-version$$
	 *
	 * @return int[]
	 */
	public static function get_connected_user_ids() {
		$tokens_api = ( new Manager() )->get_tokens();

		// A locked site has no usable tokens, which is what the column reports too.
		if ( $tokens_api->is_locked() ) {
			return array();
		}

		$tokens = $tokens_api->get_user_tokens();

		if ( ! is_array( $tokens ) ) {
			return array();
		}

		$ids = array();

		foreach ( $tokens as $id => $token ) {
			// PHP leaves a non-canonical key like "01" a string, and get_access_token() looks
			// the token up by the integer ID, so normalising here would claim a user it cannot find.
			if ( ! is_int( $id ) || $id <= 0 ) {
				continue;
			}

			$chunks = is_string( $token ) ? explode( '.', $token ) : array();

			// Mirrors Tokens::get_access_token(): three parts, and the token names its own user.
			if ( ! empty( $chunks[1] ) && ! empty( $chunks[2] ) && (string) $id === $chunks[2] ) {
				$ids[] = $id;
			}
		}

		return $ids;
	}

	/**
	 * Narrow the users list table query to connected users when the view is active.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $args Query arguments for the list table's WP_User_Query.
	 * @return array
	 */
	public static function filter_query_to_connected_users( $args ) {
		if ( ! self::is_connected_view() ) {
			return $args;
		}

		$connected = self::get_connected_user_ids();

		// A pre-existing `include` means something else already narrowed the list, so both
		// constraints are kept rather than overwriting theirs. Tested with isset(), not
		// empty(): core sets an empty `include` for `role=none` when every user has a role,
		// and that already means "nobody" — reading it as "unset" would list everyone.
		if ( isset( $args['include'] ) ) {
			$existing  = wp_parse_id_list( $args['include'] );
			$connected = $existing ? array_intersect( $existing, $connected ) : array();
		}

		// WP_User_Query only honours `exclude` when `include` is empty, so setting `include`
		// below would silently un-exclude whoever another filter had removed.
		if ( ! empty( $args['exclude'] ) ) {
			$connected = array_diff( $connected, wp_parse_id_list( $args['exclude'] ) );
		}

		// An empty `include` is ignored by WP_User_Query, which would list every user. No
		// user has ID 0, so it is the way to express "match nothing".
		$args['include'] = empty( $connected ) ? array( 0 ) : array_values( $connected );

		return $args;
	}

	/**
	 * Add a "Connected" view to the users list table.
	 *
	 * @since $$next-version$$
	 *
	 * @param string[] $views View links keyed by view name.
	 * @return string[]
	 */
	public static function add_connected_view( $views ) {
		$count = self::count_connected_users();

		if ( ! $count ) {
			return $views;
		}

		$is_current = self::is_connected_view();

		// Core marks "All" as current whenever no role is selected, which stays true here.
		// Matches WP_List_Table::get_views_links(); a core change makes this a no-op and
		// two links look active, so it fails cosmetically rather than breaking the view.
		if ( $is_current && isset( $views['all'] ) ) {
			$views['all'] = str_replace( ' class="current" aria-current="page"', '', $views['all'] );
		}

		$views[ self::VIEW_CONNECTED ] = sprintf(
			'<a href="%1$s"%2$s>%3$s <span class="count">(%4$s)</span></a>',
			esc_url( self::get_connected_view_url() ),
			$is_current ? ' class="current" aria-current="page"' : '',
			esc_html__( 'Connected', 'jetpack-connection' ),
			esc_html( number_format_i18n( $count ) )
		);

		return $views;
	}

	/**
	 * Number of connected users the list will actually show.
	 *
	 * Queried, not counted off the option: a token can outlive its user, and the query
	 * drops those IDs and scopes to the current site. Ordered by ID so it does not
	 * filesort on `user_login`, the default, which a count never needs.
	 *
	 * @since $$next-version$$
	 *
	 * @return int
	 */
	private static function count_connected_users() {
		$ids = self::get_connected_user_ids();

		if ( ! $ids ) {
			return 0;
		}

		$query = new \WP_User_Query(
			array(
				'include'     => $ids,
				'fields'      => 'ID',
				'number'      => -1,
				'orderby'     => 'ID',
				'count_total' => false,
			)
		);

		return count( $query->get_results() );
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
