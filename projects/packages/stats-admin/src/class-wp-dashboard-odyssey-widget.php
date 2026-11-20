<?php
/**
 * A class that adds Jetpack Stats widget for WP Dashboard.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Responsible for loading Jetpack Stats widget for WP Dashboard.
 *
 * @package jetpack-stats-admin
 */
class WP_Dashboard_Odyssey_Widget {
	const DASHBOARD_WIDGET_ID = 'jetpack_summary_widget';

	/**
	 * Add the widget to the WordPress dashboard of a connected site with Stats active.
	 *
	 * Hook it to `wp_dashboard_setup`.
	 *
	 * @return bool Whether the widget was added.
	 */
	public static function register_widget() {
		/**
		 * Filter whether the Jetpack Stats dashboard widget should be shown to the current user.
		 * By default, the dashboard widget is shown to users who can manage options or view Stats.
		 *
		 * @module stats
		 * @since-jetpack 11.9
		 *
		 * @param bool Whether to show the widget to the current user.
		 */
		if ( ! apply_filters( 'jetpack_stats_dashboard_widget_show_to_user', current_user_can( 'manage_options' ) || current_user_can( 'view_stats' ) ) ) {
			return false;
		}

		if ( ! Main::is_site_connected() || ! ( new Modules() )->is_active( 'stats' ) ) {
			return false;
		}

		$widget = new self();
		wp_add_dashboard_widget(
			self::DASHBOARD_WIDGET_ID,
			/** "Stats" is a product name, do not translate. */
			'Jetpack Stats',
			array( $widget, 'render' )
		);
		$widget->maybe_load_admin_scripts();

		return true;
	}

	/**
	 * Renders the widget and fires a dashboard widget action.
	 */
	public function render() {
		// The widget is always rendered, so if it was hidden and then toggled open, we need to ask user to refresh the page to load data properly.
		$is_toggled_open = $this->is_widget_hidden();
		?>
		<div id="dashboard_stats" class="jp-stats-widget">
			<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Stats widget requires JavaScript to function properly.', 'jetpack-stats-admin' ); ?></div>
			<div class="hide-if-no-js">
				<?php if ( $is_toggled_open ) : ?>
					<p><?php esc_html_e( 'Please reload the page to see your stats...', 'jetpack-stats-admin' ); ?></p>
				<?php else : ?>
					<?php $this->render_loading_skeleton(); ?>
				<?php endif; ?>
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
	 * Renders the widget's skeleton for the time before its script runs; the loader then swaps in
	 * its own copy. Kept in step with wp-calypso's apps/odyssey-stats/src/widget/loading-skeleton.ts.
	 */
	private function render_loading_skeleton() {
		// The gates the widget applies to its Site protection card: not on Simple sites, nor on
		// a standalone Stats plugin without Jetpack. See Odyssey_Config_Data::get_config_data().
		$has_site_protection = ! ( new Host() )->is_wpcom_simple() && defined( 'JETPACK__VERSION' );
		?>
		<div class="jp-stats-widget-skeleton" role="status" aria-label="<?php esc_attr_e( 'Loading', 'jetpack-stats-admin' ); ?>">
			<style>
				.jp-stats-widget-skeleton{container-type:inline-size;margin:-11px -12px -12px;border-radius:0 0 8px 8px;background:#f6f7f7;font-size:0}
				.jp-stats-widget-skeleton__inner{display:flex;flex-direction:column;gap:8px;padding:8px}
				.jp-stats-widget-skeleton__card{border-radius:7px;box-shadow:0 0 0 1px rgba(0,0,0,.1);background:#fff}
				.jp-stats-widget-skeleton__header{display:flex;justify-content:space-between;align-items:center;min-block-size:32px;padding:8px}
				.jp-stats-widget-skeleton__body{padding:8px 12px 12px}
				.jp-stats-widget-skeleton__body.is-tabbed{padding-block-start:0}
				.jp-stats-widget-skeleton__metrics{display:flex;gap:16px}
				.jp-stats-widget-skeleton__metric{display:flex;flex-direction:column;flex:1 1 0}
				.jp-stats-widget-skeleton__tabs{display:flex;margin-inline:-12px;border-block-end:1px solid #dbdbdb}
				.jp-stats-widget-skeleton__tab{flex:1;display:flex;justify-content:center;padding-block:18px}
				.jp-stats-widget-skeleton__rows{display:flex;flex-direction:column;margin-block-start:8px}
				.jp-stats-widget-skeleton__row{display:flex;justify-content:space-between;align-items:center;gap:16px;min-block-size:32px}
				.jp-stats-widget-skeleton__link{display:flex;align-items:center;block-size:18.2px;margin-block-start:16px}
				.jp-stats-widget-skeleton__link.is-view-all{margin-block-start:8px}
				.jp-stats-widget-skeleton__footer{display:flex;justify-content:space-between;align-items:center;padding:8px}
				.jp-stats-widget-skeleton__bar{display:block;block-size:12px;border-radius:4px;background:#f4f4f4}
				.jp-stats-widget-skeleton__bar.is-title{inline-size:140px;block-size:16px}
				.jp-stats-widget-skeleton__bar.is-control{inline-size:112px;block-size:32px}
				.jp-stats-widget-skeleton__bar.is-label{inline-size:72px;block-size:14px;margin-block:3px}
				.jp-stats-widget-skeleton__bar.is-value{inline-size:64px;block-size:28px;margin-block:8px 4px}
				.jp-stats-widget-skeleton__bar.is-chart{block-size:160px;border-radius:8px;margin-block-start:16px}
				.jp-stats-widget-skeleton__bar.is-tab{inline-size:96px}
				.jp-stats-widget-skeleton__bar.is-row-title{inline-size:60%}
				.jp-stats-widget-skeleton__bar.is-row-value{inline-size:46px}
				.jp-stats-widget-skeleton__bar.is-link{inline-size:72px}
				.jp-stats-widget-skeleton__bar.is-logo{inline-size:88px;block-size:20px}
				.jp-stats-widget-skeleton__bar.is-footer-link{inline-size:80px}
				@container (max-inline-size:360px){.jp-stats-widget-skeleton__metrics{flex-direction:column}.jp-stats-widget-skeleton__metric{flex:none}}
				@media not (prefers-reduced-motion){.jp-stats-widget-skeleton__bar{animation:jp-stats-widget-skeleton-pulse 1.5s ease-in-out infinite}}
				@media (forced-colors:active){.jp-stats-widget-skeleton__bar{outline:1px solid CanvasText;outline-offset:-1px}}
				@keyframes jp-stats-widget-skeleton-pulse{0%,100%{opacity:1}50%{opacity:.4}}
			</style>
			<div class="jp-stats-widget-skeleton__inner">
				<div class="jp-stats-widget-skeleton__card">
					<div class="jp-stats-widget-skeleton__header">
						<span class="jp-stats-widget-skeleton__bar is-title"></span>
						<span class="jp-stats-widget-skeleton__bar is-control"></span>
					</div>
					<div class="jp-stats-widget-skeleton__body">
						<div class="jp-stats-widget-skeleton__metrics">
							<div class="jp-stats-widget-skeleton__metric">
								<span class="jp-stats-widget-skeleton__bar is-label"></span>
								<span class="jp-stats-widget-skeleton__bar is-value"></span>
							</div>
							<div class="jp-stats-widget-skeleton__metric">
								<span class="jp-stats-widget-skeleton__bar is-label"></span>
								<span class="jp-stats-widget-skeleton__bar is-value"></span>
							</div>
						</div>
						<span class="jp-stats-widget-skeleton__bar is-chart"></span>
						<div class="jp-stats-widget-skeleton__link"><span class="jp-stats-widget-skeleton__bar is-link"></span></div>
					</div>
				</div>
				<div class="jp-stats-widget-skeleton__card">
					<div class="jp-stats-widget-skeleton__header">
						<span class="jp-stats-widget-skeleton__bar is-title"></span>
					</div>
					<div class="jp-stats-widget-skeleton__body is-tabbed">
						<div class="jp-stats-widget-skeleton__tabs">
							<div class="jp-stats-widget-skeleton__tab"><span class="jp-stats-widget-skeleton__bar is-tab"></span></div>
							<div class="jp-stats-widget-skeleton__tab"><span class="jp-stats-widget-skeleton__bar is-tab"></span></div>
						</div>
						<div class="jp-stats-widget-skeleton__rows">
							<div class="jp-stats-widget-skeleton__row">
								<span class="jp-stats-widget-skeleton__bar is-row-title"></span>
								<span class="jp-stats-widget-skeleton__bar is-row-value"></span>
							</div>
						</div>
						<div class="jp-stats-widget-skeleton__link is-view-all"><span class="jp-stats-widget-skeleton__bar is-link"></span></div>
					</div>
				</div>
				<?php if ( $has_site_protection ) : ?>
				<div class="jp-stats-widget-skeleton__card">
					<div class="jp-stats-widget-skeleton__header">
						<span class="jp-stats-widget-skeleton__bar is-title"></span>
					</div>
					<div class="jp-stats-widget-skeleton__body">
						<div class="jp-stats-widget-skeleton__metrics">
							<div class="jp-stats-widget-skeleton__metric">
								<span class="jp-stats-widget-skeleton__bar is-label"></span>
								<span class="jp-stats-widget-skeleton__bar is-value"></span>
							</div>
							<div class="jp-stats-widget-skeleton__metric">
								<span class="jp-stats-widget-skeleton__bar is-label"></span>
								<span class="jp-stats-widget-skeleton__bar is-value"></span>
							</div>
						</div>
					</div>
				</div>
				<?php endif; ?>
				<div class="jp-stats-widget-skeleton__footer">
					<span class="jp-stats-widget-skeleton__bar is-logo"></span>
					<span class="jp-stats-widget-skeleton__bar is-footer-link"></span>
				</div>
			</div>
		</div>
		<?php
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
