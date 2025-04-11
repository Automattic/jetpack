<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Top Clicks Widget (retired) from WordPress.com
 * Copied from: fbhepr%2Skers%2Sgehax%2Sjc%2Qpbagrag%2Szh%2Qcyhtvaf%2Sfgngf.cuc%234198-og
 */
class Widget_Top_Clicks extends WP_Widget {
	/**
	 * Alt option name.
	 *
	 * @var string $alt_option_name
	 */
	public $alt_option_name = 'widget_stats_topclicks';

	/**
	 * Widget default settings.
	 *
	 * @var array{title:string,count:int,len:int} $defaults
	 */
	public $defaults = array(
		'title' => '',
		'count' => 10,
		'len'   => 25,
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			'top-clicks',
			__( 'Top Clicks', 'wpcomsh' ),
			array( 'description' => __( 'List the most-clicked links on your blog.', 'wpcomsh' ) )
		);
	}

	/**
	 * Display the widget.
	 *
	 * @param array $args     Widget arguments.
	 * @param array $instance Widget instance.
	 */
	public function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );

		if ( empty( $instance['title'] ) ) {
			$instance['title'] = __( 'Top Clicks', 'wpcomsh' );
		}

		$instance['count'] = isset( $instance['count'] ) ? intval( $instance['count'] ) : null;
		if ( empty( $instance['count'] ) || $instance['count'] < 1 || 10 < $instance['count'] ) {
			$instance['count'] = 10;
		}

		echo $args['before_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $args['before_title'] . esc_html( $instance['title'] ) . $args['after_title']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		$this->display_top_clicks( $instance['count'], $instance['len'] );
		echo $args['after_widget']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

		do_action( 'jetpack_stats_extra', 'widget_view', 'top_clicks' );
	}

	/**
	 * Display the widget settings form.
	 *
	 * @param array $instance Current settings.
	 * @return never
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( $instance, $this->defaults );
		?>
		<p>
			<label>
				<?php esc_html_e( 'Title:', 'wpcomsh' ); ?>
				<input class="widefat" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'Display length:', 'wpcomsh' ); ?>
				<input style="width: 60px;" name="<?php echo esc_attr( $this->get_field_name( 'len' ) ); ?>" type="text" value="<?php echo esc_attr( $instance['len'] ); ?>" />
			</label>
		</p>
		<p>
			<label>
				<?php esc_html_e( 'URLs to show:', 'wpcomsh' ); ?>
				<select name="<?php echo esc_attr( $this->get_field_name( 'count' ) ); ?>">
					<?php for ( $i = 1; $i <= 12; ++$i ) { ?>
						<option value="<?php echo $i; ?>" <?php selected( $i, $instance['count'] ); ?>><?php echo $i; /* phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $i is an integer iterator. */ ?></option>
					<?php } ?>
				</select>
			</label>
		</p>
		<p><?php esc_html_e( 'Top Clicks are calculated from 48-72 hours of stats. They take a while to change.', 'wpcomsh' ); ?></p>
		<?php
	}

	/**
	 * Update the widget settings.
	 *
	 * @param array $new_instance New settings.
	 * @param array $old_instance Old settings.
	 */
	public function update( $new_instance, $old_instance ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$new_instance          = wp_parse_args(
			$new_instance,
			array(
				'title' => __( 'Top Clicks', 'wpcomsh' ),
				'count' => 10,
				'len'   => 25,
			)
		);
		$new_instance['title'] = wp_strip_all_tags( $new_instance['title'] );
		$new_instance['count'] = intval( $new_instance['count'] );
		$new_instance['len']   = intval( $new_instance['len'] );

		if ( $new_instance['len'] < 1 ) {
			$new_instance['len'] = 20;
		}

		wp_cache_delete( 'display_top_clicks', 'output' );

		return $new_instance;
	}

	/**
	 * Display top clicks widget content.
	 *
	 * @param int       $number Number of links to show.
	 * @param int|false $len Trim link text to X chars, or false to not trim.
	 */
	protected function display_top_clicks( $number, $len = 25 ) {
		$html = wp_cache_get( 'display_top_clicks', 'output' );
		if ( empty( $html ) ) {
			$urls = wp_cache_get( 'display_top_clicks_urls', 'stats' );
			if ( false === $urls ) {
				$stats = stats_get_from_restapi( array( 'num' => 3 ), 'clicks' );
				if ( is_wp_error( $stats ) || empty( $stats ) ) {
					$urls = array();
				} else {
					$urls = $this->get_urls_from_stats( $stats );
				}
				wp_cache_add( 'display_top_clicks_urls', $urls, 'stats' );
			}

			$html = '<ul>';
			if ( ! empty( $urls ) ) {
				arsort( $urls );
				foreach ( $urls as $url => $views ) {
					if ( ! $number-- ) {
						break;
					}
					if ( strstr( $url, 'pagead2.google' ) ) {
						continue;
					}
					// TEMP: mask out url shorteners to hide Top Clicks spam till we have a better solution
					if ( preg_match( '#(?:tinyurl[.]com)/.#', $url ) ) {
						continue;
					}
					$url   = preg_replace( '/http:\/\/wordpress\.redirectingat\.com\/\?id=725X1342&site=[a-zA-Z0-9]+\.WordPress\.com&url=http%3A/', 'http:', $url );
					$html .= '<li>' . $this->shrink_link( $url, $len ) . '</li>';
				}
			} else {
				$html .= '<li>' . __( 'None', 'wpcomsh' ) . '</li>';
			}
			$html .= '</ul>';
			$html  = preg_replace( '|<a (.+?)>|', "<a $1 rel='nofollow'>", $html );
			wp_cache_add( 'display_top_clicks', $html, 'output', 3600 );
		}
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- as it's HTML that is already escaped in shrink_link().
	}

	/**
	 * Get click count by URL.
	 *
	 * @param object $stats Stats.
	 *
	 * @return array
	 */
	protected function get_urls_from_stats( $stats ) {
		if ( is_wp_error( $stats ) || ! is_object( $stats ) || empty( $stats->days ) ) {
			return array();
		}
		$urls = array();
		$days = (array) $stats->days;
		foreach ( $days as $day ) {
			foreach ( $day->clicks as $click ) {
				if ( empty( $click->url ) || empty( $click->views ) ) {
					continue;
				}
				$urls[ $click->url ] = $click->views;
			}
		}
		return $urls;
	}

	/**
	 * Trim link text.
	 *
	 * @param string    $url Raw URL.
	 * @param int|false $len Trim link text to X chars, or false to not trim.
	 *
	 * @return string
	 */
	protected function shrink_link( $url, $len = false ) {
		$text = preg_replace( '!^(mailto:|https?://(www\.)?)!', '', $url );
		$text = trim( $text, '/' );
		$text = rawurldecode( $text );
		if ( $len > 0 && strlen( $text ) > $len ) {
			$text = wp_html_excerpt( $text, $len ) . '&#8230;';
		}
		$text = esc_html( $text );

		$url = esc_attr( $url );

		return "<a href='$url' target='_blank'>$text</a>";
	}

	/**
	 * Determine if URL is presentable.
	 *
	 * @param string $url URL.
	 *
	 * @return bool
	 */
	protected function is_presentable_url( $url ) {
		if ( empty( $url ) ) {
			return false;
		}

		// ALL NON-URL REFERRERS ARE ALLOWED UNLESS ADDED HERE
		if ( in_array(
			$url,
			array(
				'internal',
				'DOCUMENT_REFERRER',
			),
			true
		) ) {
			return false;
		}
		$parts = @ wp_parse_url( $url ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( empty( $parts['host'] ) ) {
			return true;
		}

		// ALL NON-HTTP REFERRERS FAIL
		if ( $parts['scheme'] !== 'http' && $parts['scheme'] !== 'https' ) {
			return false;
		}

		// ALL HOSTS ARE ALLOWED UNLESS ADDED HERE
		if ( in_array(
			$parts['host'],
			array(
				'redirect.ad-feeds.com',
				'shots.snap.com',
			),
			true
		) ) {
			return false;
		}

		// Filter out wp-admin links
		if ( str_starts_with( $parts['path'], '/wp-admin/' ) ) {
			return false;
		}

		// Filter out clicks on abuse link
		if ( false !== strpos( $url, 'wordpress.com/abuse' ) ) {
			return false;
		}

		if ( wp_check_invalid_utf8( $url ) === '' ) {
			return false;
		}

		return true;
	}
}

/**
 * Register the widget.
 */
function wpcomsh_register_top_clicks_widget() { // phpcs:ignore Universal.Files.SeparateFunctionsFromOO.Mixed
	// Only register the widget if the Jetpack Stats module is active and we already have an existing instance (since the widget is retired).
	if ( function_exists( 'stats_get_from_restapi' ) && is_active_widget( false, false, 'top-clicks' ) ) {
		register_widget( 'Widget_Top_Clicks' );
	}
}
add_action( 'widgets_init', 'wpcomsh_register_top_clicks_widget' );
