<?php
/**
 * Adds the Jetpack Newsletter widget to the WordPress admin dashboard.
 *
 * @package jetpack
 */

/**
 * Class that adds the Jetpack newsletter widget to the WordPress admin dashboard.
 */
class Jetpack_Newsletter_Dashboard_Widget {

	/**
	 * Indicates whether the class initialized or not.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * The Widget ID.
	 *
	 * @var string
	 */
	private static $widget_id = 'jetpack_newsletter_dashboard_widget';

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
	 * JavaScript and CSS for dashboard widget.
	 *
	 * @access public
	 * @return void
	 */
	public static function admin_head() {
		?>
			<script type="text/javascript">
				/* <![CDATA[ */
				jQuery( function($) {
					var dashStats = jQuery( '#dashboard_stats div.inside' );

					if ( dashStats.find( '.dashboard-widget-control-form' ).length ) {
						return;
					}

					if ( ! dashStats.length ) {
						dashStats = jQuery( '#dashboard_stats div.dashboard-widget-content' );
						var h = parseInt( dashStats.parent().height() ) - parseInt( dashStats.prev().height() );
						var args = 'width=' + dashStats.width() + '&height=' + h.toString();
					} else {
						if ( jQuery('#dashboard_stats' ).hasClass('postbox') ) {
							var args = 'width=' + ( dashStats.prev().width() * 2 ).toString();
						} else {
							var args = 'width=' + ( dashStats.width() * 2 ).toString();
						}
					}

					dashStats
						.not( '.dashboard-widget-control' )
						.load( 'admin.php?page=stats&noheader&dashboard&' + args, function() {
							jQuery( '#dashboard_stats' ).removeClass( 'is-loading' );
							jQuery( '#stat-chart' ).css( 'width', 'auto' );
						} );

					// Widget settings toggle container.
					var toggle = $( '.js-toggle-stats_dashboard_widget_control' );

					// Move the toggle in the widget header.
					toggle.appendTo( '#jetpack_summary_widget .handle-actions' );

					// Toggle settings when clicking on it.
					toggle.show().click( function( e ) {
						e.preventDefault();
						e.stopImmediatePropagation();
						$( this ).parent().toggleClass( 'controlVisible' );
						$( '#stats_dashboard_widget_control' ).slideToggle();
					} );
				} );
				/* ]]> */
			</script>
		<?php
	}

	/**
	 * Sets up the Jetpack Newsletter widget in the WordPress admin dashboard.
	 */
	public static function wp_dashboard_setup() {

		// TODO: Check who can view the widget

		if ( Jetpack::is_connection_ready() ) {
			add_action( 'admin_head', array( static::class, 'admin_head' ) );

			$widget_title = sprintf(
				__( 'Newsletter', 'jetpack' )
			);

			wp_add_dashboard_widget(
				self::$widget_id,
				$widget_title,
				array( static::class, 'render_widget' )
			);
		}
	}

	/**
	 * Renders the widget.
	 */
	public static function render_widget() {
		echo 'This is a test widget';
	}
}