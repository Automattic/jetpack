<?php
/**
 * A class that adds a stats column to wp-admin Post List.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

/**
 * Add a Stats column in the post and page lists.
 */
class Admin_Post_List_Column {

	/**
	 * The constructor.
	 */
	public function __construct() {
		// Add an icon to see stats in WordPress.com for a particular post.
		add_action( 'admin_print_styles-edit.php', array( $this, 'stats_load_admin_css' ) );

		add_filter( 'manage_posts_columns', array( $this, 'add_stats_post_table' ) );
		add_filter( 'manage_pages_columns', array( $this, 'add_stats_post_table' ) );

		add_action( 'manage_posts_custom_column', array( $this, 'add_stats_post_table_cell' ), 10, 2 );
		add_action( 'manage_pages_custom_column', array( $this, 'add_stats_post_table_cell' ), 10, 2 );
	}

	/**
	 * Load CSS needed for Stats column width in WP-Admin area.
	 *
	 * @since 4.7.0
	 */
	public function stats_load_admin_css() {
		?>
		<style type="text/css">
			.fixed .column-stats {
				width: 5em;
			}
		</style>
		<?php
	}

	/**
	 * Set content for cell with link to an entry's stats in Odyssey Stats.
	 *
	 * @param string $column  The name of the column to display.
	 * @param int    $post_id The current post ID.
	 *
	 * @since 4.7.0
	 */
	public function add_stats_post_table_cell( $column, $post_id ) {
		if ( 'stats' === $column ) {
			if ( 'publish' !== get_post_status( $post_id ) ) {
				printf(
					'<span aria-hidden="true">—</span><span class="screen-reader-text">%s</span>',
					esc_html__( 'No stats', 'jetpack-stats-admin' )
				);
			} else {
				// Link to the wp-admin stats page.
				$stats_post_url = admin_url( sprintf( 'admin.php?page=stats#!/stats/post/%d/%d', $post_id, Jetpack_Options::get_option( 'id', 0 ) ) );
				// Unless the user is on a Default style WOA site, in which case link to Calypso.
				if ( ( new Host() )->is_woa_site() && Stats_Options::get_option( 'enable_odyssey_stats' ) && 'wp-admin' !== get_option( 'wpcom_admin_interface' ) ) {
					$stats_post_url = Redirect::get_url(
						'calypso-stats-post',
						array(
							'path' => $post_id,
						)
					);
				}

				static $post_views = null;

				/**
				 * Jetpack_stats_get_post_page_views_for_current_list makes a request with all post ids in the current $wp_query.
				 * This way, we'll make a single API request instead of making one for each post.
				 *
				 * For this reason, we'll cache the result with the static $post_views variable.
				 */
				if ( null === $post_views ) {
					$post_views = $this->get_post_page_views_for_current_list();
				}

				$views = $post_views[ $post_id ] ?? null;

				$current_locale = get_bloginfo( 'language' );

				/**
				 * PHP's NumberFormatter is just a wrapper over the ICU C library. The library does support decimal compact short formatter, but PHP doesn't have a stub for it.
				 *
				 * @see https://unicode-org.github.io/icu-docs/apidoc/dev/icu4c/unum_8h.html UNUM_DECIMAL_COMPACT_SHORT constant.
				 */
				$compact_decimal_short = 14;

				try {
					$formatter = new NumberFormatter( $current_locale, $compact_decimal_short );
					$formatter->setAttribute( NumberFormatter::MAX_FRACTION_DIGITS, 1 );
				} catch ( \Exception $e ) {
					// Fallback to decimal if for some reason it fails to work.
					$formatter = new NumberFormatter( $current_locale, NumberFormatter::DECIMAL );
				}

				?>
				<a href="<?php echo esc_url( $stats_post_url ); ?>"
					title="<?php esc_html__( 'View stats for this post', 'jetpack-stats-admin' ); ?>" target="_blank">
					<span
						class="dashicons dashicons-visibility"></span>&nbsp;<span><?php echo $views ? esc_html( $formatter->format( $views ) ) : ''; ?></span>
				</a>
				<?php
			}
		}
	}

	/**
	 * Set header for column that allows to view an entry's stats.
	 *
	 * @param array $columns An array of column names.
	 *
	 * @since 4.7.0
	 *
	 * @return mixed
	 */
	public function add_stats_post_table( $columns ) {
		/*
		 * Stats can be accessed in wp-admin or in Calypso,
		 * depending on what version of the stats screen is enabled on your site.
		 *
		 * In both cases, the user must be allowed to access stats.
		 *
		 * If the Odyssey Stats experience isn't enabled, the user will need to go to Calypso,
		 * so they need to be connected to WordPress.com to be able to access that page.
		 */
		if (
			! current_user_can( 'view_stats' )
			|| (
				! Stats_Options::get_option( 'enable_odyssey_stats' )
				&& ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected()
			)
		) {
			return $columns;
		}

		// Array-Fu to add before comments.
		$pos = array_search( 'comments', array_keys( $columns ), true );

		// Fallback to the last position if the post type does not support comments.
		if ( ! is_int( $pos ) ) {
			$pos = count( $columns );
		}

		// Final fallback, if the array was malformed by another plugin for example.
		if ( ! is_int( $pos ) ) {
			return $columns;
		}

		$chunks             = array_chunk( $columns, $pos, true );
		$chunks[0]['stats'] = esc_html__( 'Stats', 'jetpack-stats-admin' );

		return call_user_func_array( 'array_merge', $chunks );
	}

	/**
	 * Get a list of post views for each post id from the global $wp_query.
	 *
	 * @return array
	 */
	private function get_post_page_views_for_current_list(): array {
		global $wp_query;

		if ( ! $wp_query->posts ) {
			return array();
		}

		$post_ids = wp_list_pluck( $wp_query->posts, 'ID' );

		$wpcom_stats = new WPCOM_Stats();
		$post_views  = $wpcom_stats->get_total_post_views( array( 'post_ids' => implode( ',', $post_ids ) ) );

		if ( is_wp_error( $post_views ) ) {
			$post_views = array();
		}

		$views = array();

		foreach ( $post_views['posts'] as $post ) {
			$views[ $post['ID'] ] = $post['views'];
		}

		return $views;
	}
}
