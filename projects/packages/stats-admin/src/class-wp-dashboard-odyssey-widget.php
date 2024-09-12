<?php
/**
 * A class that adds Jetpack Stats widget for WP Dashboard.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

/**
 * Responsible for loading Jetpack Stats widget for WP Dashboard.
 *
 * @package jetpack-stats-admin
 */
class WP_Dashboard_Odyssey_Widget {
	const DASHBOARD_WIDGET_ID = 'jetpack_summary_widget';

	/**
	 * Renders the widget and fires a dashboard widget action.
	 */
	public function render() {
		// The widget is always rendered, so if it was hidden and then toggled open, we need to ask user to refresh the page to load data properly.
		$is_toggled_open = $this->is_widget_hidden();
		?>
		<div id="dashboard_stats" class="jp-stats-widget" style="min-height: 200px;">
			<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Stats widget requires JavaScript to function properly.', 'jetpack-stats-admin' ); ?></div>
			<div class="hide-if-no-js" style="height: 100%">
				<img
					class="jp-stats-widget-loading-spinner"
					width="32"
					height="32"
					style="position: absolute; left: calc(50% - 28px); top: calc(50% - 36px);"
					alt=<?php echo esc_attr( __( 'Loading', 'jetpack-stats-admin' ) ); ?>
					src="//en.wordpress.com/i/loading/loading-64.gif"
				/>
				<p>
				<?php
				if ( $is_toggled_open ) {
					echo esc_html__( 'Please reload the page to see your stats...', 'jetpack-stats-admin' );
				}
				?>
				</p>
			</div>
		</div>
		<?php
		/**
		 * Fires when the dashboard is loaded, but no longer used anywhere in the Jetpack plugin.
		 * The action is still available for backward compatibility.
		 *
		 * @since 3.4.0
		 */
		do_action( 'jetpack_dashboard_widget' );
	}

	/**
	 * Load the admin scripts.
	 */
	public function load_admin_scripts() {
		$config_data = ( new Odyssey_Config_Data() )->get_data();
		( new Odyssey_Assets() )->load_admin_scripts(
			'jetpack_stats_widget',
			'widget-loader.min',
			array(
				'config_variable_name' => 'jetpackStatsOdysseyWidgetConfigData',
				'config_data'          => $config_data,
				'enqueue_css'          => false,
			)
		);
	}

	/**
	 * Load the admin scripts when the widget is visible.
	 */
	public function maybe_load_admin_scripts() {
		if ( $this->is_widget_hidden() ) {
			return;
		}
		$this->load_admin_scripts();
	}

	/**
	 * Returns true if the widget is hidden for the current screen and current user.
	 *
	 * @return bool
	 */
	public function is_widget_hidden() {
		$hidden = get_hidden_meta_boxes( get_current_screen() );
		return in_array( self::DASHBOARD_WIDGET_ID, $hidden, true );
	}
}
