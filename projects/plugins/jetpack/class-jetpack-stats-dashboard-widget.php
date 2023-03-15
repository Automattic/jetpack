<?php
/**
 * Adds the Jetpack stats widget to the WordPress admin dashboard.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status;

/**
 * Class that adds the Jetpack stats widget to the WordPress admin dashboard.
 */
class Jetpack_Stats_Dashboard_Widget {

	/**
	 * Indicates whether the class initialized or not.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the class by calling the setup static function.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			self::wp_dashboard_setup();
		}
	}

	/**
	 * Sets up the Jetpack Stats widget in the WordPress admin dashboard.
	 */
	public static function wp_dashboard_setup() {
		/**
		 * Filter whether the Jetpack Stats dashboard widget should be shown to the current user.
		 * By default, the dashboard widget is shown to users who can view_stats.
		 *
		 * @module stats
		 * @since 11.9
		 *
		 * @param bool Whether to show the widget to the current user.
		 */
		if ( ! apply_filters( 'jetpack_stats_dashboard_widget_show_to_user', current_user_can( 'view_stats' ) ) ) {
			return;
		}

		add_action( 'admin_head', 'stats_dashboard_head' );

		if ( Jetpack::is_connection_ready() ) {
			$widget_title = sprintf(
				__( 'Jetpack Stats', 'jetpack' )
			);

			wp_add_dashboard_widget(
				'jetpack_summary_widget',
				$widget_title,
				array( __CLASS__, 'render_widget' )
			);
			wp_enqueue_style(
				'jetpack-dashboard-widget',
				Assets::get_file_url_for_environment(
					'css/dashboard-widget.min.css',
					'css/dashboard-widget.css'
				),
				array(),
				JETPACK__VERSION
			);
			wp_style_add_data( 'jetpack-dashboard-widget', 'rtl', 'replace' );
		}
	}

	/**
	 * Accessor for widget options.
	 *
	 * @return array
	 */
	public static function get_widget_options() {
		$defaults = array(
			'chart'  => 1,
			'top'    => 1,
			'search' => 7,
		);
		$options  = get_option( 'stats_dashboard_widget' );
		if ( ( ! $options ) || ! is_array( $options ) ) {
			$options = array();
		}

		// Ignore obsolete option values.
		$intervals = array( 1, 7, 31, 90, 365 );
		foreach ( array( 'top', 'search' ) as $key ) {
			if ( isset( $options[ $key ] ) && ! in_array( (int) $options[ $key ], $intervals, true ) ) {
				unset( $options[ $key ] );
			}
		}

		return array_merge( $defaults, $options );
	}

	/**
	 * Stats Dashboard Widget Control.
	 *
	 * @access public
	 * @return void
	 */
	public static function render_widget_controls() {
		$periods   = array(
			'1'  => __( 'day', 'jetpack' ),
			'7'  => __( 'week', 'jetpack' ),
			'31' => __( 'month', 'jetpack' ),
		);
		$intervals = array(
			'1'   => __( 'the past day', 'jetpack' ),
			'7'   => __( 'the past week', 'jetpack' ),
			'31'  => __( 'the past month', 'jetpack' ),
			'90'  => __( 'the past quarter', 'jetpack' ),
			'365' => __( 'the past year', 'jetpack' ),
		);
		self::process_widget_controls_submission();
		self::render_widget_controls_html( $intervals, $periods, self::get_widget_options() );
	}

	/**
	 * Handle widget controls form submission.
	 *
	 * @access public
	 * @return void
	 */
	public static function process_widget_controls_submission() {
		$options  = self::get_widget_options();
		$defaults = array(
			'top'    => 1,
			'search' => 7,
		);

		if (
			isset( $_SERVER['REQUEST_METHOD'] ) &&
			'post' === strtolower( filter_var( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) &&
			isset( $_POST['stats_id'] ) && 'dashboard_stats' === $_POST['stats_id'] // phpcs:ignore WordPress.Security.NonceVerification
		) {
			if ( isset( $periods[ $_POST['chart'] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
				$options['chart'] = filter_var( wp_unslash( $_POST['chart'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
			}
			foreach ( array( 'top', 'search' ) as $key ) {
				if ( isset( $intervals[ $_POST[ $key ] ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
					$options[ $key ] = filter_var( wp_unslash( $_POST[ $key ] ) ); // phpcs:ignore WordPress.Security.NonceVerification
				} else {
					$options[ $key ] = $defaults[ $key ];
				}
			}
			update_option( 'stats_dashboard_widget', $options );
		}
	}

	/**
	 * Output HTML for widget controls.
	 *
	 * @param array $intervals Array of intervals.
	 * @param array $periods Array of periods.
	 * @param array $options Array of options.
	 *
	 * @access public
	 * @return void
	 */
	public static function render_widget_controls_html( $intervals, $periods, $options ) { ?>
		<p>
			<label for="chart"><?php esc_html_e( 'Chart stats by', 'jetpack' ); ?></label>
			<select id="chart" name="chart">
				<?php foreach ( $periods as $val => $label ) { ?>
					<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['chart'] ); ?>><?php echo esc_html( $label ); ?></option>
				<?php } ?>
			</select>.
		</p>
		<p>
			<label for="top"><?php esc_html_e( 'Show top posts over', 'jetpack' ); ?></label>
			<select id="top" name="top">
				<?php foreach ( $intervals as $val => $label ) { ?>
					<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['top'] ); ?>><?php echo esc_html( $label ); ?></option>
				<?php } ?>
			</select>.
		</p>
		<p>
			<label for="search"><?php esc_html_e( 'Show top search terms over', 'jetpack' ); ?></label>
			<select id="search" name="search">
				<?php foreach ( $intervals as $val => $label ) { ?>
					<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $val, $options['search'] ); ?>><?php echo esc_html( $label ); ?></option>
				<?php } ?>
			</select>.
		</p>
		<?php
	}

	/**
	 * Renders the widget and fires a dashboard widget action.
	 *
	 * @access public
	 * @return void
	 */
	public static function render_widget() {
		?>
		<form id="stats_dashboard_widget_control" action="<?php echo esc_url( admin_url() ); ?>" method="post">
			<?php self::render_widget_controls(); ?>
			<?php wp_nonce_field( 'edit-dashboard-widget_dashboard_stats', 'dashboard-widget-nonce' ); ?>
			<input type="hidden" name="stats_id" value="dashboard_stats" />
			<?php submit_button( __( 'Submit', 'jetpack' ) ); ?>
		</form>
		<button type="button" class="handlediv js-toggle-stats_dashboard_widget_control" aria-expanded="true">
			<span class="screen-reader-text"><?php esc_html_e( 'Configure', 'jetpack' ); ?></span>
			<span class="toggle-indicator" aria-hidden="true"></span>
		</button>
		<div id="dashboard_stats">
			<div class="inside">
				<div style="height: 250px;"></div>
			</div>
		</div>
		<?php
		self::render_widget_footer();

		/**
		 * Fires when the dashboard is loaded, but no longer used anywhere in the Jetpack plugin.
		 * The action is still available for backward compatibility.
		 *
		 * @since 3.4.0
		 */
		do_action( 'jetpack_dashboard_widget' );
	}

	/**
	 * Stats Dashboard Widget Content.
	 *
	 * @access public
	 * @return void
	 */
	public static function stats_dashboard_widget_content() {
		$width  = isset( $_GET['width'] ) ? intval( $_GET['width'] ) / 2 : null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$height = isset( $_GET['height'] ) ? intval( $_GET['height'] ) - 36 : null; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! $width || $width < 250 ) {
			$width = 370;
		}
		if ( ! $height || $height < 230 ) {
			$height = 180;
		}

		$_width  = $width - 5;
		$_height = $height - 5;

		$options = self::get_widget_options();
		$blog_id = Jetpack_Options::get_option( 'id' );

		$q = array(
			'noheader' => 'true',
			'proxy'    => '',
			'blog'     => $blog_id,
			'page'     => 'stats',
			'chart'    => '',
			'unit'     => $options['chart'],
			'color'    => get_user_option( 'admin_color' ),
			'width'    => $_width,
			'height'   => $_height,
			'ssl'      => is_ssl(),
			'j'        => sprintf( '%s:%s', JETPACK__API_VERSION, JETPACK__VERSION ),
		);

		$url = 'https://' . STATS_DASHBOARD_SERVER . '/wp-admin/index.php';

		$url     = add_query_arg( $q, $url );
		$method  = 'GET';
		$timeout = 90;
		$user_id = 0; // Means use the blog token.

		$get      = Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
		$get_code = wp_remote_retrieve_response_code( $get );
		if ( is_wp_error( $get ) || ( 2 !== (int) ( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
			stats_print_wp_remote_error( $get, $url );
		} else {
			$body = stats_convert_post_titles( $get['body'] );
			$body = stats_convert_chart_urls( $body );
			$body = stats_convert_image_urls( $body );
			echo $body; // phpcs:ignore WordPress.Security.EscapeOutput
		}

		$post_ids = array();

		$csv_end_date = current_time( 'Y-m-d' );
		$csv_args     = array(
			'top'    => "&limit=8&end=$csv_end_date",
			'search' => "&limit=5&end=$csv_end_date",
		);

		$top_posts = stats_get_csv( 'postviews', "days=$options[top]$csv_args[top]" );
		foreach ( $top_posts as $i => $post ) {
			if ( 0 === $post['post_id'] ) {
				unset( $top_posts[ $i ] );
				continue;
			}
			$post_ids[] = $post['post_id'];
		}

		// Cache.
		get_posts( array( 'include' => join( ',', array_unique( $post_ids ) ) ) );

		$searches     = array();
		$search_terms = stats_get_csv( 'searchterms', "days=$options[search]$csv_args[search]" );
		foreach ( $search_terms as $search_term ) {
			if ( 'encrypted_search_terms' === $search_term['searchterm'] ) {
				continue;
			}
			$searches[] = esc_html( $search_term['searchterm'] );
		}

		?>
	<div id="stats-info">
		<div id="top-posts" class='stats-section'>
			<div class="stats-section-inner">
			<h3 class="heading"><?php esc_html_e( 'Top Posts', 'jetpack' ); ?></h3>
			<?php
			if ( empty( $top_posts ) ) {
				?>
				<p class="nothing"><?php esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
				<?php
			} else {
				foreach ( $top_posts as $post ) {
					if ( ! get_post( $post['post_id'] ) ) {
						continue;
					}
					?>
					<p>
					<?php
					printf(
						esc_html(
							/* Translators: Stats dashboard widget Post list with view count: "Post Title 1 View (or Views if plural)". */
							_n( '%1$s %2$s View', '%1$s %2$s Views', $post['views'], 'jetpack' )
						),
						'<a href="' . esc_url( get_permalink( $post['post_id'] ) ) . '">' . esc_html( get_the_title( $post['post_id'] ) ) . '</a>',
						esc_html( number_format_i18n( $post['views'] ) )
					);
					?>
				</p>
					<?php
				}
			}
			?>
			</div>
		</div>
		<div id="top-search" class='stats-section'>
			<div class="stats-section-inner">
			<h3 class="heading"><?php esc_html_e( 'Top Searches', 'jetpack' ); ?></h3>
			<?php
			if ( empty( $searches ) ) {
				?>
				<p class="nothing"><?php esc_html_e( 'Sorry, nothing to report.', 'jetpack' ); ?></p>
				<?php
			} else {
				foreach ( $searches as $search_term_item ) {
					printf(
						'<p>%s</p>',
						esc_html( $search_term_item )
					);
				}
			}
			?>
			</div>
		</div>
	</div>
	<div class="clear"></div>
	<div class="stats-view-all">
		<?php
		$new_stats_enabled = Stats_Options::get_option( 'enable_odyssey_stats' );
		if ( ! $new_stats_enabled ) {
			$stats_day_url = Redirect::get_url( 'calypso-stats-day' );
			printf(
				'<a class="button" target="_blank" rel="noopener noreferrer" href="%1$s">%2$s</a>',
				esc_url( $stats_day_url ),
				esc_html__( 'View all stats', 'jetpack' )
			);
		} else {
			printf(
				'<a class="button" href="%1$s">%2$s</a>',
				esc_url( menu_page_url( 'stats', false ) ),
				esc_html__( 'View all stats', 'jetpack' )
			);

		}
		?>
	</div>
	<div class="clear"></div>
		<?php
		exit;
	}

	/**
	 * Load the widget footer showing Protect and Akismet stats.
	 */
	public static function render_widget_footer() {
		?>
		<footer>
		<div class="blocked-container">
			<div class="protect">
				<h3><?php esc_html_e( 'Brute force attack protection', 'jetpack' ); ?></h3>
				<?php if ( Jetpack::is_module_active( 'protect' ) ) : ?>
					<p class="blocked-count">
						<?php echo esc_html( number_format_i18n( get_site_option( 'jetpack_protect_blocked_attempts', 0 ) ) ); ?>
					</p>
					<p><?php echo esc_html_x( 'Blocked malicious login attempts', '{#} Blocked malicious login attempts -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
				<?php elseif ( current_user_can( 'jetpack_activate_modules' ) && ! ( new Status() )->is_offline_mode() ) : ?>
					<a href="
					<?php
					echo esc_url(
						wp_nonce_url(
							Jetpack::admin_url(
								array(
									'action' => 'activate',
									'module' => 'protect',
								)
							),
							'jetpack_activate-protect'
						)
					);
					?>
								" class="button button-jetpack" title="<?php esc_attr_e( 'Protect helps to keep you secure from brute-force login attacks.', 'jetpack' ); ?>">
						<?php esc_html_e( 'Activate brute force attack protection', 'jetpack' ); ?>
					</a>
				<?php else : ?>
					<?php esc_html_e( 'Brute force attack protection is inactive.', 'jetpack' ); ?>
				<?php endif; ?>
			</div>

			<div class="akismet">
				<h3><?php esc_html_e( 'Akismet Anti-spam', 'jetpack' ); ?></h3>
				<?php if ( is_plugin_active( 'akismet/akismet.php' ) ) : ?>
					<p class="blocked-count">
						<?php echo esc_html( number_format_i18n( get_option( 'akismet_spam_count', 0 ) ) ); ?>
					</p>
					<p><?php echo esc_html_x( 'Blocked spam comments.', '{#} Spam comments blocked by Akismet -- number is on a prior line, text is a caption.', 'jetpack' ); ?></p>
				<?php elseif ( current_user_can( 'activate_plugins' ) && ! is_wp_error( validate_plugin( 'akismet/akismet.php' ) ) ) : ?>
					<a href="
					<?php
					echo esc_url(
						wp_nonce_url(
							add_query_arg(
								array(
									'action' => 'activate',
									'plugin' => 'akismet/akismet.php',
								),
								admin_url( 'plugins.php' )
							),
							'activate-plugin_akismet/akismet.php'
						)
					);
					?>
								" class="button button-jetpack">
						<?php esc_html_e( 'Activate Anti-spam', 'jetpack' ); ?>
					</a>
				<?php else : ?>
					<p><a href="<?php echo esc_url( 'https://akismet.com/?utm_source=jetpack&utm_medium=link&utm_campaign=Jetpack%20Dashboard%20Widget%20Footer%20Link' ); ?>"><?php esc_html_e( 'Anti-spam can help to keep your blog safe from spam!', 'jetpack' ); ?></a></p>
				<?php endif; ?>
			</div>
		</div>
		<div class="footer-links">
			<?php
				$jetpack_logo = new Jetpack_Logo();
				echo $jetpack_logo->get_jp_emblem( true );// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			if ( Jetpack::is_module_active( 'stats' ) ) :
				?>
				<span>
					<?php
					if ( current_user_can( 'jetpack_manage_modules' ) ) :
						$i18n_headers = jetpack_get_module_i18n( 'stats' );
						?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack#/settings?term=' . rawurlencode( $i18n_headers['name'] ) ) ); ?>"
					>
						<?php
						esc_html_e( 'Configure Jetpack Stats', 'jetpack' );
						?>
				</a>
				|
						<?php
						endif;
					?>
				<a href="<?php echo esc_url( Redirect::get_url( 'jetpack-support-wordpress-com-stats' ) ); ?>" target="_blank"><?php esc_html_e( 'Learn more', 'jetpack' ); ?></a>
				</span>
				<?php
			endif;
			?>

		</div>
		</footer>

		<?php
	}
}
