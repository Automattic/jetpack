<?php
/**
 * A class that adds a stats column to wp-admin Post List.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Status\Host;
use NumberFormatter;

/**
 * Add a Stats column in the post and page lists.
 */
class Admin_Post_List_Column {

	/**
	 * Create the object.
	 *
	 * @return self
	 */
	public static function register() {
		return new self();
	}

	/**
	 * A list of NumberFormatters.
	 *
	 * @var \NumberFormatter[]
	 */
	private $formatter;

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
				$stats_post_url = admin_url( sprintf( 'admin.php?page=stats#!/stats/post/%d/%d', $post_id, \Jetpack_Options::get_option( 'id', 0 ) ) );
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

				if ( null !== $views ) {
					$formatted_views = class_exists( '\NumberFormatter' )
						? $this->get_formatter( $current_locale )->format( $views )
						: $this->get_fallback_format_to_compact_version( $views );
				} else {
					$formatted_views = '';
				}

				?>
				<a href="<?php echo esc_url( $stats_post_url ); ?>"
					title="<?php echo esc_html__( 'Views for the last thirty days. Click for detailed stats', 'jetpack-stats-admin' ); ?>">
					<span
						class="dashicons dashicons-visibility"></span>&nbsp;<span><?php echo null !== $views ? esc_html( $formatted_views ) : ''; ?></span>
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
	 * @return mixed
	 */
	public function add_stats_post_table( $columns ) {
		/**
		 * The manage_options capability is a fallback for Simple.
		 * This should be updated with a proper fix. Implemented based on this PR: https://github.com/Automattic/jetpack/pull/41549.
		 */
		$has_access = current_user_can( 'view_stats' ) || current_user_can( 'manage_options' );

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
			! $has_access
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

		$chunks             = array_chunk( $columns, $pos, true );
		$chunks[0]['stats'] = esc_html__( 'Stats', 'jetpack-stats-admin' );

		return call_user_func_array( 'array_merge', $chunks );
	}

	/**
	 * Get a list of post views for each post id from the global $wp_query.
	 *
	 * @return array
	 */
	public function get_post_page_views_for_current_list(): array {
		global $wp_query;

		if ( ! $wp_query->posts ) {
			return array();
		}

		$post_ids = wp_list_pluck( $wp_query->posts, 'ID' );

		$wpcom_stats = $this->get_stats();
		$post_views  = $wpcom_stats->get_total_post_views(
			array(
				'num'      => 30,
				'post_ids' => implode( ',', $post_ids ),
			)
		);

		if ( is_wp_error( $post_views ) || empty( $post_views ) ) {
			return array();
		}

		$views = array();

		foreach ( $post_views['posts'] as $post ) {
			$views[ $post['ID'] ] = $post['views'];
		}

		return $views;
	}

	/**
	 * Get the stats object.
	 *
	 * @return WPCOM_Stats
	 */
	protected function get_stats() {
		return new WPCOM_Stats();
	}

	/**
	 * Get the NumberFormatter instance.
	 *
	 * @param string $locale The current locale.
	 *
	 * @return NumberFormatter
	 */
	protected function get_formatter( string $locale ): \NumberFormatter {
		if ( isset( $this->formatter[ $locale ] ) ) {
			return $this->formatter[ $locale ];
		}

		/**
		 * PHP's NumberFormatter is just a wrapper over the ICU C library. The library does support decimal compact short formatter, but PHP doesn't have a stub for it (=< PHP 8.4).
		 *
		 * @see https://unicode-org.github.io/icu-docs/apidoc/dev/icu4c/unum_8h.html UNUM_DECIMAL_COMPACT_SHORT constant.
		 */
		$compact_decimal_short = 14;

		/**
		 * NumberFormatter::DECIMAL_COMPACT_SHORT only exists in PHP 8.5 and later. At this time, NumberFormatter::DECIMAL_COMPACT_SHORT only exists in PHP `main` branch.
		 *
		 * Use the constant if it's defined since it's safer.
		 */
		if ( defined( '\NumberFormatter::DECIMAL_COMPACT_SHORT' ) ) {
			// @phan-suppress-next-line PhanUndeclaredConstantOfClass
			$compact_decimal_short = NumberFormatter::DECIMAL_COMPACT_SHORT;
		}

		try {
			$formatter = new \NumberFormatter( $locale, $compact_decimal_short );
			$formatter->setAttribute( \NumberFormatter::MAX_FRACTION_DIGITS, 1 );
		} catch ( \Exception $e ) {
			// Fallback to decimal if for some reason it fails to work.
			$formatter = new \NumberFormatter( $locale, \NumberFormatter::DECIMAL );
		}

		$this->formatter[ $locale ] = $formatter;

		return $formatter;
	}

	/**
	 * Fallback Format a number to a compact version if the Intl extension is not available.
	 *
	 * @param int $views The given number.
	 *
	 * @return string
	 */
	public function get_fallback_format_to_compact_version( $views ) {
		if ( $views >= 10000000 ) {
			return round( $views / 1000000 ) . 'M';
		} elseif ( $views >= 1000000 ) {
			$views = round( $views / 1000000, 1 );
			return preg_replace( '/\.0$/', '', (string) $views ) . 'M';
		} elseif ( $views >= 10000 ) {
			return round( $views / 1000 ) . 'K';
		} elseif ( $views >= 1000 ) {
			$views = round( $views / 1000, 1 );
			return preg_replace( '/\.0$/', '', (string) $views ) . 'K';
		}

		return (string) $views;
	}
}
