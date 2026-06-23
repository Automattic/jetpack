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
	 * Wire all hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register_columns_for_post_types' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'default_hidden_columns', array( __CLASS__, 'default_hidden_columns' ), 10, 2 );
	}

	/**
	 * Hide the SEO columns by default in Screen Options.
	 *
	 * Three extra always-on columns squeeze the title column unreadably narrow,
	 * so we default them to hidden using core's `default_hidden_columns` filter —
	 * the standard mechanism for choosing which columns start hidden in Screen
	 * Options. It only applies to users who have never customized Screen Options
	 * for the screen, so anyone who explicitly enabled the columns keeps them.
	 *
	 * @param string[]  $hidden Column IDs hidden by default.
	 * @param WP_Screen $screen Current screen.
	 * @return string[]
	 */
	public static function default_hidden_columns( $hidden, $screen ) {
		if ( isset( $screen->base ) && 'edit' === $screen->base ) {
			$hidden = array_merge(
				$hidden,
				array( 'jetpack_seo_schema', 'jetpack_seo_description', 'jetpack_seo_search' )
			);
		}
		return $hidden;
	}

	/**
	 * Register columns + renderers for each public, visible post type.
	 *
	 * @return void
	 */
	public static function register_columns_for_post_types() {
		$post_types = get_post_types(
			array(
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
			),
			'names'
		);
		unset( $post_types['attachment'] );

		foreach ( $post_types as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( __CLASS__, 'add_columns' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( __CLASS__, 'render_column' ), 10, 2 );
		}
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
		$columns = array( 'jetpack_seo_schema', 'jetpack_seo_description', 'jetpack_seo_search' );
		if ( ! in_array( $column, $columns, true ) ) {
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
