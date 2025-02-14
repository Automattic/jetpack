<?php
/**
 * Jetpack Newsletter Dashboard Widget.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Assets;

/**
 * Adds the Jetpack Newsletter widget to the WordPress admin dashboard.
 *
 * @package jetpack
 */

/**
 * Class that adds the Jetpack Newsletter Dashboard Widget to the WordPress admin dashboard.
 */
class Jetpack_Newsletter_Dashboard_Widget {
	const JS_DEPENDENCIES = array( 'lodash', 'react', 'react-dom', 'wp-api-fetch', 'wp-components', 'wp-compose', 'wp-element', 'wp-html-entities', 'wp-i18n', 'wp-is-shallow-equal', 'wp-polyfill', 'wp-primitives', 'wp-url', 'wp-warning', 'moment' );
	// Sometimes custom scripts would strip the `ver` query params, so we need to make sure it doesn't by adding a custom version param `osv` here.
	const NEWSLETTER_WIDGET_CDN_URL = 'https://widgets.wp.com/newsletter/%s?minify=false';
	const NEWSLETTER_WIDGET_VERSION = '1.0.0';

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

		if ( Jetpack::is_connection_ready() ) {
			add_action( 'admin_head', array( static::class, 'admin_head' ) );
			add_action( 'admin_init', array( static::class, 'admin_init' ) );

			$widget_title = sprintf(
				__( 'Newsletter', 'jetpack' )
			);

			wp_add_dashboard_widget(
				self::$widget_id,
				$widget_title,
				array( static::class, 'render' )
			);
		}
	}

	/**
	 * Render the Jetpack Newsletter widget.
	 *
	 * @return void
	 */
	public static function render() {
		?>
		<div id="wpcom" style="min-height: calc(100vh - 100px);">
			<div id="newsletter-widget-app"></div>
		</div>
		<?php
	}

	/**
	 * Load the admin scripts for the Jetpack Newsletter widget.
	 *
	 * @return void
	 */
	public static function admin_init() {
		static::load_admin_scripts( 'jp-newsletter-widget', 'app.min', array( 'config_variable_name' => 'jetpackNewsletterWidgetConfigData' ) );
	}

	/**
	 * Load the admin scripts for the Jetpack Newsletter widget.
	 *
	 * @param string $asset_handle The handle of the asset.
	 * @param string $asset_name The name of the asset.
	 * @param array  $options The options for the asset.
	 * @return void
	 */
	public static function load_admin_scripts( $asset_handle, $asset_name, $options = array() ) {
		$default_options = array(
			'config_data'          => array(),
			'config_variable_name' => 'configData',
			'enqueue_css'          => true,
		);
		$options         = wp_parse_args( $options, $default_options );
		if ( file_exists( __DIR__ . "/../dist/{$asset_name}.js" ) ) {
			// Load local assets for the convinience of development.
			Assets::register_script(
				$asset_handle,
				"../dist/{$asset_name}.js",
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack',
				)
			);
			Assets::enqueue_script( $asset_handle );
		} else {
			// In production, we load the assets from our CDN.
			wp_register_script(
				$asset_handle,
				sprintf( self::NEWSLETTER_WIDGET_CDN_URL, "{$asset_name}.js" ),
				self::JS_DEPENDENCIES,
				self::NEWSLETTER_WIDGET_VERSION,
				true
			);
			wp_enqueue_script( $asset_handle );
		}

		// TODO: Add config data.
	}
}