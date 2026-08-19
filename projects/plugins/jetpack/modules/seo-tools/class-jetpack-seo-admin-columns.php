<?php
/**
 * Adds factual SEO columns to wp-admin post list tables.
 *
 * Surfaces the per-post SEO *state* at a glance — schema type, whether a meta
 * description is set, and search visibility — without grading it. Whether a
 * given setting should be configured depends on the post's purpose, so we
 * report facts and let the author decide.
 *
 * @package automattic/jetpack
 */

/**
 * Registers read-only SEO columns on every public post-list table.
 */
class Jetpack_SEO_Admin_Columns {

	/**
	 * The column IDs this class registers on the post-list tables.
	 *
	 * @var string[]
	 */
	const COLUMNS = array( 'jetpack_seo_schema', 'jetpack_seo_description', 'jetpack_seo_search' );

	/**
	 * User meta listing the post-list screen IDs whose saved hidden-column set
	 * has already been backfilled with the SEO columns.
	 */
	const BACKFILL_USER_META_KEY = 'jetpack_seo_columns_backfilled_screens';

	/**
	 * Wire all hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register_columns_for_post_types' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'default_hidden_columns', array( __CLASS__, 'default_hidden_columns' ), 10, 2 );
		add_action( 'current_screen', array( __CLASS__, 'backfill_hidden_columns' ) );
	}

	/**
	 * Hide the SEO columns by default in Screen Options.
	 *
	 * Three extra always-on columns squeeze the title column unreadably narrow,
	 * so we default them to hidden using core's `default_hidden_columns` filter —
	 * the standard mechanism for choosing which columns start hidden in Screen
	 * Options. It only reaches users who have never customized Screen Options for
	 * the screen; everyone else is handled by self::backfill_hidden_columns().
	 *
	 * @param string[]  $hidden Column IDs hidden by default.
	 * @param WP_Screen $screen Current screen.
	 * @return string[]
	 */
	public static function default_hidden_columns( $hidden, $screen ) {
		if ( isset( $screen->base ) && 'edit' === $screen->base ) {
			$hidden = array_merge( $hidden, self::COLUMNS );
		}
		return $hidden;
	}

	/**
	 * Hide the SEO columns for users whose Screen Options predate them.
	 *
	 * `default_hidden_columns` is a first-run default: core only consults it when
	 * the user has no saved hidden-column set for the screen (`$use_defaults =
	 * ! is_array( $hidden )` in wp-admin/includes/screen.php). Toggling any single
	 * column checkbox writes that user meta, so a user who customized Screen
	 * Options at any point — years before these columns existed — never gets the
	 * default and sees all three columns crowding the title column.
	 *
	 * Backfill those users once per screen by merging the SEO columns into the set
	 * they already have, the way core seeds its own nav-menu column defaults in
	 * wp-admin/includes/nav-menu.php. Screens are recorded as they're visited, so a
	 * post type registered later still gets handled the first time it's opened, and
	 * a user who turns the columns back on afterwards keeps them.
	 *
	 * @param WP_Screen $screen Current screen.
	 * @return void
	 */
	public static function backfill_hidden_columns( $screen ) {
		if ( ! ( $screen instanceof WP_Screen ) || 'edit' !== $screen->base ) {
			return;
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return;
		}

		$backfilled = get_user_meta( $user_id, self::BACKFILL_USER_META_KEY, true );
		$backfilled = is_array( $backfilled ) ? $backfilled : array();
		if ( in_array( $screen->id, $backfilled, true ) ) {
			return;
		}

		$option_name = 'manage' . $screen->id . 'columnshidden';
		$hidden      = get_user_option( $option_name, $user_id );

		/*
		 * A non-array means the user has never customized this screen, so
		 * `default_hidden_columns` already hides the columns for them and there is
		 * nothing to backfill — just record the screen so we stop looking.
		 */
		if ( is_array( $hidden ) ) {
			$missing = array_values( array_diff( self::COLUMNS, $hidden ) );
			if ( ! empty( $missing ) ) {
				/*
				 * $is_global = true writes the unprefixed key — the same one core's
				 * `hidden-columns` AJAX handler writes and that the get_user_option()
				 * read above falls back to. Passing false would write a blog-prefixed
				 * key that core itself never updates, so the two would diverge.
				 */
				update_user_option( $user_id, $option_name, array_values( array_merge( $hidden, $missing ) ), true );
			}
		}

		$backfilled[] = $screen->id;
		update_user_meta( $user_id, self::BACKFILL_USER_META_KEY, $backfilled );
	}

	/**
	 * Register columns + renderers for each supported post type.
	 *
	 * @return void
	 */
	public static function register_columns_for_post_types() {
		foreach ( self::get_supported_post_types() as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( __CLASS__, 'add_columns' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( __CLASS__, 'render_column' ), 10, 2 );
		}
	}

	/**
	 * Post types that get the SEO columns.
	 *
	 * Defers to the SEO package so the columns cover exactly the post types the
	 * Jetpack > SEO Content tab lists, rather than a second copy of the same query
	 * that can drift from it. The guard covers older bundled snapshots of the
	 * package that predate Post_Types.
	 *
	 * @return string[]
	 */
	private static function get_supported_post_types() {
		if ( method_exists( '\Automattic\Jetpack\SEO\Post_Types', 'get_supported_content_types' ) ) {
			return \Automattic\Jetpack\SEO\Post_Types::get_supported_content_types();
		}

		$post_types = get_post_types(
			array(
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			),
			'names'
		);
		unset( $post_types['attachment'] );

		return array_values( $post_types );
	}

	/**
	 * Insert the SEO columns just after the title column.
	 *
	 * @param array $columns Existing columns keyed by column name.
	 * @return array
	 */
	public static function add_columns( $columns ) {
		$new = array();
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['jetpack_seo_schema']      = __( 'Schema', 'jetpack' );
				$new['jetpack_seo_description'] = __( 'Meta description', 'jetpack' );
				$new['jetpack_seo_search']      = __( 'Search', 'jetpack' );
			}
		}
		return $new;
	}

	/**
	 * Render a single cell — factual state only.
	 *
	 * @param string $column  Column identifier.
	 * @param int    $post_id Current row post ID.
	 * @return void
	 */
	public static function render_column( $column, $post_id ) {
		if ( ! in_array( $column, self::COLUMNS, true ) ) {
			return;
		}

		$coverage = Jetpack_SEO_Posts::get_post_seo_coverage( $post_id );

		switch ( $column ) {
			case 'jetpack_seo_schema':
				$schema = Jetpack_SEO_Posts::get_post_schema_type( $post_id );
				echo esc_html( '' !== $schema ? self::schema_type_label( $schema ) : '—' );
				break;

			case 'jetpack_seo_description':
				// wp_kses_post() sanitizes the markup and signals the escaping to PHPCS;
				// the muted branch wraps its (already-escaped) label in a <span>.
				echo wp_kses_post(
					$coverage['has_description']
						? esc_html__( 'Set', 'jetpack' )
						: '<span class="jetpack-seo-col-muted">' . esc_html__( 'Not set', 'jetpack' ) . '</span>'
				);
				break;

			case 'jetpack_seo_search':
				echo wp_kses_post(
					$coverage['noindex']
						? esc_html__( 'Hidden', 'jetpack' )
						: '<span class="jetpack-seo-col-muted">' . esc_html__( 'Visible', 'jetpack' ) . '</span>'
				);
				break;
		}
	}

	/**
	 * Display label for an allowed schema type.
	 *
	 * @param string $schema Schema type slug.
	 * @return string
	 */
	private static function schema_type_label( $schema ) {
		switch ( $schema ) {
			case 'article':
				return __( 'Article', 'jetpack' );
			case 'faq':
				return __( 'FAQ', 'jetpack' );
			default:
				return ucfirst( $schema );
		}
	}

	/**
	 * Minimal column-width styling on edit.php only (no color-coding —
	 * these columns report state, not a grade).
	 *
	 * @param string $hook_suffix Current admin hook suffix.
	 * @return void
	 */
	public static function enqueue_assets( $hook_suffix ) {
		if ( 'edit.php' !== $hook_suffix ) {
			return;
		}
		wp_register_style( 'jetpack-seo-admin-columns', false, array(), JETPACK__VERSION );
		wp_add_inline_style(
			'jetpack-seo-admin-columns',
			'.column-jetpack_seo_schema,.column-jetpack_seo_description,.column-jetpack_seo_search{width:9em}' .
			'.jetpack-seo-col-muted{color:#787c82}'
		);
		wp_enqueue_style( 'jetpack-seo-admin-columns' );
	}
}
