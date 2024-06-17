<?php
/**
 * A class that adds the WPCOM site management widget to the WordPress admin dashboard.
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Class that adds the WPCOM site management widget to the WordPress admin dashboard.
 */
class WPCOM_Site_Management_Widget {
	const WPCOM_SITE_MANAGEMENT_WIDGET_ID = 'wpcom_site_management_widget';

	/**
	 * Singleton instance of the widget, not to show more than once.
	 *
	 * @var WPCOM_Site_Management_Widget
	 */
	public static $instance = null;

	/**
	 * Gets the instance of this singleton class
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register widget with WordPress.
	 */
	public function __construct() {
		add_action( 'admin_head', array( $this, 'admin_head' ) );
		add_action( 'wp_dashboard_setup', array( $this, 'wp_dashboard_setup' ) );
	}

	/**
	 * JavaScript and CSS for the widget.
	 *
	 * @access public
	 * @return void
	 */
	public function admin_head() {
		?>
		<style type="text/css">
			#wpcom_site_management_widget {
				color: #1e1e1e;
			}

			#wpcom_site_management_widget .postbox-title-action {
				display: none;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__header {
				display: flex;
				align-items: center;
				gap: 12px;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-favicon {
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				width: 38px;
				height: 38px;
				overflow: hidden;
				font-size: 24px;
				color: #0073aa;
				background-color: #f5f7f7;
				border: 1px solid #eeeeee;
				border-radius: 4px;
				cursor: default;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-favicon img {
				width: 100%;
				height: auto;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-info {
				flex-grow: 1;
				overflow: hidden;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-name {
				font-size: 14px;
				font-weight: 500;
				line-height: 20px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-url {
				color: #3a434a;
				font-size: 12px;
				font-weight: 400;
				line-height: 16px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__site-actions {
				flex-shrink: 0;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__content p {
				margin: 12px 0;
				font-size: 13px;
				font-weight: 400;
				line-height: 18px;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__dev-tools-title {
				margin-bottom: 12px;
				font-size: 11px;
				font-weight: 600;
				line-height: 16px;
				text-transform: uppercase;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__dev-tools-content ul {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 12px;
				margin-bottom: 0;
				list-style: disc inside;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__dev-tools-content li {
				margin: 0 8px;
				color: #0073aa;
				font-size: 13px;
				font-weight: 400;
				line-height: 18px;
			}

			#wpcom_site_management_widget .wpcom_site_management_widget__dev-tools-content li::marker {
				margin-inline-end: 2px;
			}
		</style>
		<?php
	}

	/**
	 * Sets up the WPCOM site management widget in the WordPress admin dashboard.
	 */
	public function wp_dashboard_setup() {
		wp_add_dashboard_widget(
			self::WPCOM_SITE_MANAGEMENT_WIDGET_ID,
			__( 'Site Management Panel', 'jetpack-mu-wpcom' ),
			array( $this, 'render_wpcom_site_management_widget' ),
			function () {},
			array(),
			'normal',
			'high'
		);
	}

	/**
	 * Renders the widget.
	 */
	public function render_wpcom_site_management_widget() {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );

		?>
		<div id="wpcom_site_management_widget" class="wpcom_site_management_widget" style="min-height: 200px;">
			<div class="hide-if-js"><?php esc_html_e( 'Your Site management widget requires JavaScript to function properly.', 'jetpack-mu-wpcom' ); ?></div>
			<div class="hide-if-no-js" style="height: 100%">
				<div class="wpcom_site_management_widget__header">
					<div class="wpcom_site_management_widget__site-favicon">
						<?php $this->render_wpcom_site_management_widget_fav_icon(); ?>
					</div>
					<div class="wpcom_site_management_widget__site-info">
						<div class="wpcom_site_management_widget__site-name"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></div>
						<div class="wpcom_site_management_widget__site-url"><?php echo esc_html( $domain ); ?></div>
					</div>
					<div class="wpcom_site_management_widget__site-actions">
						<a class="button-primary" href="<?php echo esc_url( "https://wordpress.com/overview/$domain" ); ?>">
							<?php esc_html_e( 'Overview', 'jetpack-mu-wpcom' ); ?>
						</a>
					</div>
				</div>
				<div class="wpcom_site_management_widget__content">
					<p><?php esc_html_e( 'Get a quick overview of your plans, storage, and domains, or easily access your development tools using the links provided below:', 'jetpack-mu-wpcom' ); ?></p>
					<div class="wpcom_site_management_widget__dev-tools">
						<div class="wpcom_site_management_widget__dev-tools-title"><?php esc_html_e( 'DEV TOOLS:', 'jetpack-mu-wpcom' ); ?></div>
						<div class="wpcom_site_management_widget__dev-tools-content">
							<ul>
							<?php
								$dev_tools_items = array(
									array(
										'name' => __( 'Deployments', 'jetpack-mu-wpcom' ),
										'href' => "/github-deployments/$domain",
									),
									array(
										'name' => __( 'Monitoring', 'jetpack-mu-wpcom' ),
										'href' => "/site-monitoring/$domain",
									),
									array(
										'name' => __( 'Logs', 'jetpack-mu-wpcom' ),
										'href' => "/site-logs/$domain/php",
									),
									array(
										'name' => __( 'Staging Site', 'jetpack-mu-wpcom' ),
										'href' => "/staging-site/$domain",
									),
									array(
										'name' => __( 'Server Settings', 'jetpack-mu-wpcom' ),
										'href' => "/hosting-config/$domain",
									),
								);
								foreach ( $dev_tools_items as $item ) {
									printf( '<li><a href="https://wordpress.com%1$s">%2$s</a></li>', esc_url( $item['href'] ), esc_html( $item['name'] ) );
								}
								?>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the fav icon.
	 */
	public function render_wpcom_site_management_widget_fav_icon() {
		$site_icon_url = get_site_icon_url( 38 );

		// webclip.png is the default on WoA sites. Anything other than that means we have a custom site icon.
		if ( ! empty( $site_icon_url ) && $site_icon_url !== 'https://s0.wp.com/i/webclip.png' ) {
			printf( '<img src="%1$s" />', esc_url( $site_icon_url ) );
		} else {
			printf( '<span>%1$s</span>', esc_html( mb_substr( get_bloginfo( 'name' ), 0, 1 ) ) );
		}
	}
}

WPCOM_Site_Management_Widget::get_instance();
