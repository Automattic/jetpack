<?php
/**
 * Adds SEO columns to wp-admin post list tables.
 *
 * PRD differentiator: traffic-light status, inline-editable title and
 * description, Schema type, and a SERP preview popover — none of which
 * Yoast or Rank Math surface from the list table today.
 *
 * @package automattic/jetpack
 */

/**
 * Registers post-list columns for every public post type and wires up
 * the inline-editing + preview React island.
 */
class Jetpack_SEO_Admin_Columns {

	const NONCE_ACTION = 'jetpack_seo_admin_columns';

	/**
	 * Wire all hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'register_columns_for_post_types' ) );
		add_action( 'admin_print_styles-edit.php', array( __CLASS__, 'print_column_styles' ) );
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
			add_action(
				"manage_{$post_type}_posts_custom_column",
				array( __CLASS__, 'render_column' ),
				10,
				2
			);
		}
	}

	/**
	 * Prepend the SEO columns just after the title column.
	 *
	 * @param array $columns Existing columns keyed by column name.
	 * @return array
	 */
	public static function add_columns( $columns ) {
		$new = array();
		foreach ( $columns as $key => $label ) {
			$new[ $key ] = $label;
			if ( 'title' === $key ) {
				$new['jetpack_seo_status']  = __( 'SEO', 'jetpack' );
				$new['jetpack_seo_schema']  = __( 'Schema', 'jetpack' );
				$new['jetpack_seo_preview'] = __( 'Preview', 'jetpack' );
			}
		}
		return $new;
	}

	/**
	 * Render a single cell.
	 *
	 * @param string $column  Column identifier.
	 * @param int    $post_id Current row post ID.
	 * @return void
	 */
	public static function render_column( $column, $post_id ) {
		if ( ! in_array( $column, array( 'jetpack_seo_status', 'jetpack_seo_schema', 'jetpack_seo_preview' ), true ) ) {
			return;
		}

		$title       = (string) get_post_meta( $post_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, true );
		$description = (string) get_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, true );
		$noindex     = (bool) get_post_meta( $post_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, true );
		$schema      = Jetpack_SEO_Posts::get_post_schema_type( $post_id );

		if ( 'jetpack_seo_status' === $column ) {
			$status = self::compute_status( $title, $description, $noindex );
			printf(
				'<span class="jetpack-seo-status jetpack-seo-status--%1$s" aria-label="%2$s" title="%2$s"></span>',
				esc_attr( $status ),
				esc_attr( self::status_label( $status ) )
			);
		}

		if ( 'jetpack_seo_schema' === $column ) {
			echo esc_html( $schema ? ucfirst( $schema ) : __( 'Default', 'jetpack' ) );
		}

		if ( 'jetpack_seo_preview' === $column ) {
			printf(
				'<button type="button" class="button-link jetpack-seo-preview-trigger" data-post-id="%1$d">%2$s</button>',
				(int) $post_id,
				esc_html__( 'Preview', 'jetpack' )
			);
		}
	}

	/**
	 * Traffic-light computation (mirrors the REST controller's heuristic).
	 *
	 * @param string $title       SEO title override (may be empty).
	 * @param string $description SEO description override (may be empty).
	 * @param bool   $noindex     Whether the post is marked noindex.
	 * @return string 'good' | 'fair' | 'poor'
	 */
	private static function compute_status( $title, $description, $noindex ) {
		if ( $noindex ) {
			return 'poor';
		}
		$tl = strlen( $title );
		$dl = strlen( $description );
		if ( 0 === $tl && 0 === $dl ) {
			return 'poor';
		}
		$title_ok = $tl >= 30 && $tl <= 60;
		$desc_ok  = $dl >= 120 && $dl <= 160;
		if ( $title_ok && $desc_ok ) {
			return 'good';
		}
		return 'fair';
	}

	/**
	 * Human-readable label for the traffic-light status.
	 *
	 * @param string $status Status string.
	 * @return string
	 */
	private static function status_label( $status ) {
		switch ( $status ) {
			case 'good':
				return __( 'SEO looks good', 'jetpack' );
			case 'fair':
				return __( 'SEO could be improved', 'jetpack' );
			default:
				return __( 'Needs attention', 'jetpack' );
		}
	}

	/**
	 * Print the column styles. Hooked to `admin_print_styles-edit.php`, so
	 * it only runs on the post list table.
	 *
	 * @return void
	 */
	public static function print_column_styles() {
		?>
		<style>
			.column-jetpack_seo_status { width: 48px; text-align: center; }
			.column-jetpack_seo_schema { width: 120px; }
			.column-jetpack_seo_preview { width: 96px; }
			.jetpack-seo-status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #cc1818; }
			.jetpack-seo-status--good { background: #4ab866; }
			.jetpack-seo-status--fair { background: #dba617; }
			.jetpack-seo-status--poor { background: #cc1818; }
		</style>
		<?php
	}
}
