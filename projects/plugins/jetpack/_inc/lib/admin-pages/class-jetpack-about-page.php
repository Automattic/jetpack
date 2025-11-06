<?php
/**
 * Class for the Jetpack About Page within the wp-admin.
 *
 * @package automattic/jetpack
 */

/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Builds the landing page and its menu.
 */
class Jetpack_About_Page extends Jetpack_Admin_Page {

	/**
	 * Show the settings page only when Jetpack is connected or in dev mode.
	 *
	 * @var bool If the page should be shown.
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Anonymous info about a12s. The method fetch_a8c_data() stores the response from wpcom here.
	 *
	 * @var array
	 */
	private $a8c_data = null;

	/**
	 * Add a submenu item to the Jetpack admin menu.
	 *
	 * @return string
	 */
	public function get_page_hook() {
		// Add the main admin Jetpack menu.
		return add_submenu_page(
			'',
			esc_html__( 'About Jetpack', 'jetpack' ),
			'',
			'jetpack_admin_page',
			'jetpack_about',
			array( $this, 'render' )
		);
	}

	/**
	 * Add page action
	 *
	 * @param string $hook Hook of current page.
	 */
	public function add_page_actions( $hook ) {
		if ( 'admin_page_jetpack_about' === $hook ) {
			$this->a8c_data = $this->fetch_a8c_data();
		}
	}

	/**
	 * Enqueues scripts and styles for the admin page.
	 */
	public function page_admin_scripts() {
		wp_enqueue_style( 'plugin-install' );
		wp_enqueue_script( 'plugin-install' );
		// required for plugin modal action button functionality.
		wp_enqueue_script( 'updates' );
		// required for modal popup JS and styling.
		wp_enqueue_style( 'thickbox' );
		wp_enqueue_script( 'thickbox' );
	}

	/**
	 * Load styles for static page.
	 */
	public function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Render the page with a common top and bottom part, and page specific content
	 */
	public function render() {
		Jetpack_Admin_Page::wrap_ui( array( $this, 'page_render' ), array( 'show-nav' => false ) );
	}

	/**
	 * Render the page content
	 */
	public function page_render() {
		?>
		<div class="jp-lower">
			<h1 class="screen-reader-text"><?php esc_html_e( 'About Jetpack', 'jetpack' ); ?></h1>
			<div class="jetpack-about__link-back">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack' ) ); ?>">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></g></svg>
					<?php esc_html_e( 'Back to Jetpack Dashboard', 'jetpack' ); ?>
				</a>
			</div>
			<div class="jetpack-about__main">
				<div class="jetpack-about__logo">
					<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 96" style="enable-background:new 0 0 800 96;" xml:space="preserve">
					<g>
						<path style="fill: #39c;" d="M292.922,78c-19.777,0-32.598-14.245-32.598-29.078V47.08c0-15.086,12.821-29.08,32.598-29.08
							c19.861,0,32.682,13.994,32.682,29.08v1.843C325.604,63.755,312.783,78,292.922,78z M315.044,47.245
							c0-10.808-7.877-20.447-22.122-20.447s-22.04,9.639-22.04,20.447v1.341c0,10.811,7.795,20.614,22.04,20.614
							s22.122-9.803,22.122-20.614V47.245z"/>
						<path d="M69.602,75.821l-7.374-13.826H29.463l-7.124,13.826H11.277l30.167-55.81h8.715l30.671,55.81H69.602z M45.552,30.906
							L33.401,54.369h24.72L45.552,30.906z"/>
						<path d="M128.427,78c-20.028,0-29.329-10.894-29.329-25.391V20.012h10.391v32.765c0,10.308,6.788,16.424,19.692,16.424
							c13.242,0,18.687-6.116,18.687-16.424V20.012h10.475v32.598C158.342,66.436,149.46,78,128.427,78z"/>
						<path d="M216.667,28.727v47.094h-10.475V28.727h-24.386v-8.715h59.245v8.715H216.667z"/>
						<path d="M418.955,75.821V31.659l-2.766,4.861l-23.379,39.301h-5.112L364.569,36.52l-2.765-4.861v44.162h-10.224v-55.81h14.497
							l22.038,38.296L390.713,63l2.599-4.692l21.786-38.296h14.331v55.81H418.955z"/>
						<path d="M508.619,75.821l-7.374-13.826H468.48l-7.123,13.826h-11.061l30.167-55.81h8.715l30.669,55.81H508.619z M484.569,30.906
							l-12.151,23.464h24.72L484.569,30.906z"/>
						<path d="M562.081,28.727v47.094h-10.474V28.727h-24.386v-8.715h59.245v8.715H562.081z"/>
						<path d="M638.924,28.727v47.094H628.45V28.727h-24.386v-8.715h59.245v8.715H638.924z"/>
						<path d="M689.118,75.821v-50.53c4.19,0,5.866-2.263,5.866-5.28h4.442v55.81H689.118z"/>
						<path d="M781.464,35.765c-5.028-4.609-12.402-8.967-22.374-8.967c-14.916,0-23.296,10.225-23.296,20.867v1.089
							c0,10.558,8.464,20.445,24.05,20.445c9.303,0,17.012-4.441,21.872-8.965L788,66.854C781.883,72.887,771.492,78,759.174,78
							c-21.118,0-33.939-13.743-33.939-28.828v-1.843c0-15.084,13.993-29.329,34.44-29.329c11.816,0,22.541,4.944,28.324,11.146
							L781.464,35.765z"/>
						<path d="M299.82,37.417c1.889,1.218,2.418,3.749,1.192,5.648l-9.553,14.797c-1.226,1.901-3.752,2.452-5.637,1.234l0,0
							c-1.886-1.22-2.421-3.745-1.192-5.647l9.553-14.797C295.41,36.753,297.935,36.201,299.82,37.417L299.82,37.417z"/>
					</g>
					</svg>
				</div>
				<div class="jetpack-about__content">
					<div class="jetpack-about__images">
						<ul class="jetpack-about__gravatars">
							<?php $this->display_gravatars(); ?>
						</ul>
						<p class="meet-the-team">
							<a href="https://automattic.com/about/" target="_blank" rel="noopener noreferrer" class="jptracks" data-jptracks-name="jetpack_about_meet_the_team"><?php esc_html_e( 'Meet the Automattic team', 'jetpack' ); ?></a>
							<svg class="gridicons-external" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path></g></svg>
						</p>
					</div>

					<div class="jetpack-about__text">
						<p>
							<?php esc_html_e( 'We are the people behind WordPress.com, WooCommerce, Jetpack, Simplenote, Longreads, VaultPress, Akismet, Gravatar, Crowdsignal, Cloudup, and more. We believe in making the web a better place.', 'jetpack' ); ?>
							<a href="https://automattic.com/" target="_blank" rel="noopener noreferrer" class="jptracks" data-jptracks-name="jetpack_about_learn_more">
								<?php esc_html_e( 'Learn more about us', 'jetpack' ); ?>
							</a>
							<svg class="gridicons-external" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path></g></svg>
						</p>
						<p>
							<?php
							echo esc_html(
								sprintf(
									/* translators: first placeholder is the number of Automattic employees. The second is the number of countries of origin*/
									__( 'We’re a distributed company with over %1$s Automatticians in more than %2$s countries speaking at least %3$s different languages. Our common goal is to democratize publishing so that anyone with a story can tell it, regardless of income, gender, politics, language, or where they live in the world.', 'jetpack' ),
									$this->a8c_data['a12s'],
									$this->a8c_data['countries'],
									$this->a8c_data['languages']
								)
							);
							?>
						</p>
						<p>
							<?php esc_html_e( 'We believe in Open Source and the vast majority of our work is available under the GPL.', 'jetpack' ); ?>
						</p>
						<p>
							<?php
								// Maybe use printf() because we'll want to escape the string but still allow for the link, so we can't use esc_html_e().
								echo wp_kses(
									__( 'We strive to live by the <a href="https://automattic.com/creed/" target="_blank" class="jptracks" data-jptracks-name="jetpack_about_creed" rel="noopener noreferrer">Automattic Creed</a><svg class="gridicons-external" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path></g></svg>', 'jetpack' ),
									array(
										'a'    => array(
											'href'   => array(),
											'class'  => array(),
											'target' => array(),
											'rel'    => array(),
											'data-jptracks-name' => array(),
										),
										'svg'  => array(
											'class'   => array(),
											'height'  => array(),
											'width'   => array(),
											'xmlns'   => array(),
											'viewbox' => array(),
										),
										'g'    => array(),
										'path' => array(
											'd' => array(),
										),
									)
								);
							?>
						</p>
						<p>
							<a href="https://automattic.com/work-with-us" target="_blank" rel="noopener noreferrer" class="jptracks" data-jptracks-name="jetpack_about_work_with_us"><?php esc_html_e( 'Come work with us', 'jetpack' ); ?>
							</a><svg class="gridicons-external" height="24" width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path></g></svg>
						</p>
					</div>
				</div>
			</div>

			<div class="jetpack-about__colophon">
				<h3><?php esc_html_e( 'Popular WordPress services by Automattic', 'jetpack' ); ?></h3>
				<ul class="jetpack-about__services">
				<?php $this->display_plugins(); ?>
				</ul>

				<p class="jetpack-about__services-more">
				<?php
				echo wp_kses(
					__( 'For even more of our WordPress plugins, please take a look at <a href="https://profiles.wordpress.org/automattic/#content-plugins" target="_blank" rel="noopener noreferrer" class="jptracks" data-jptracks-name="jetpack_about_wporg_profile">our WordPress.org profile</a>.', 'jetpack' ),
					array(
						'a' => array(
							'href'               => array(),
							'target'             => array(),
							'rel'                => array(),
							'class'              => array(),
							'data-jptracks-name' => array(),
						),
					)
				);
				?>
														</p>
			</div>
		</div>
		<?php
	}

	/**
	 * Add information cards for a8c plugins.
	 */
	public function display_plugins() {
		$plugins_allowedtags = array(
			'a'       => array(
				'href'   => array(),
				'title'  => array(),
				'target' => array(),
			),
			'abbr'    => array( 'title' => array() ),
			'acronym' => array( 'title' => array() ),
			'code'    => array(),
			'pre'     => array(),
			'em'      => array(),
			'strong'  => array(),
			'ul'      => array(),
			'ol'      => array(),
			'li'      => array(),
			'p'       => array(),
			'br'      => array(),
		);

		// slugs for plugins we want to display.
		$a8c_plugins = $this->a8c_data['featured_plugins'];

		// need this to access the plugins_api() function.
		include_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$plugins = array();
		foreach ( $a8c_plugins as $slug ) {
			$args = array(
				'slug'   => $slug,
				'fields' => array(
					'added'                    => false,
					'author'                   => false,
					'author_profile'           => false,
					'banners'                  => false,
					'contributors'             => false,
					'donate_link'              => false,
					'homepage'                 => false,
					'reviews'                  => false,
					'screenshots'              => false,
					'support_threads'          => false,
					'support_threads_resolved' => false,
					'sections'                 => false,
					'tags'                     => false,
					'versions'                 => false,

					'compatibility'            => true,
					'downloaded'               => true,
					'downloadlink'             => true,
					'icons'                    => true,
					'last_updated'             => true,
					'num_ratings'              => true,
					'rating'                   => true,
					'requires'                 => true,
					'requires_php'             => true,
					'short_description'        => true,
					'tested'                   => true,
				),
			);

			// should probably add some error checking here too.
			$api       = plugins_api( 'plugin_information', $args );
			$plugins[] = $api;
		}

		foreach ( $plugins as $plugin ) {
			if ( is_object( $plugin ) ) {
				$plugin = (array) $plugin;
			}

			$title   = wp_kses( $plugin['name'], $plugins_allowedtags );
			$version = wp_kses( $plugin['version'], $plugins_allowedtags );

			$name = wp_strip_all_tags( $title . ' ' . $version );

			// Remove any HTML from the description.
			$description = wp_strip_all_tags( $plugin['short_description'] );

			$wp_version = get_bloginfo( 'version' );

			$compatible_php = ( empty( $plugin['requires_php'] ) || version_compare( phpversion(), $plugin['requires_php'], '>=' ) );
			$compatible_wp  = ( empty( $plugin['requires'] ) || version_compare( $wp_version, $plugin['requires'], '>=' ) );

			$action_links = array();

			// install button.
			if ( current_user_can( 'install_plugins' ) || current_user_can( 'update_plugins' ) ) {
				$status = install_plugin_install_status( $plugin );
				switch ( $status['status'] ) {
					case 'install':
						if ( $status['url'] ) {
							if ( $compatible_php && $compatible_wp ) {
								$action_links[] = sprintf(
									'<a class="install-now button jptracks is-rna" data-slug="%1$s" href="%2$s" aria-label="%3$s" data-name="%4$s" data-jptracks-name="jetpack_about_install_button" data-jptracks-prop="%4$s">%5$s</a>',
									esc_attr( $plugin['slug'] ),
									esc_url( $status['url'] ),
									/* translators: %s: plugin name and version */
									esc_attr( sprintf( __( 'Install %s now', 'jetpack' ), $name ) ),
									esc_attr( $name ),
									esc_html__( 'Install Now', 'jetpack' )
								);
							} else {
								$action_links[] = sprintf(
									'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
									_x( 'Cannot Install', 'plugin', 'jetpack' )
								);
							}
						}
						break;

					case 'update_available':
						if ( $status['url'] ) {
							$action_links[] = sprintf(
								'<a class="update-now button aria-button-if-js jptracks" data-plugin="%1$s" data-slug="%2$s" href="%3$s" aria-label="%4$s" data-name="%5$s" data-jptracks-name="jetpack_about_update_button" data-jptracks-prop="%5$s">%6$s</a>',
								esc_attr( $status['file'] ),
								esc_attr( $plugin['slug'] ),
								esc_url( $status['url'] ),
								/* translators: %s: plugin name and version */
								esc_attr( sprintf( __( 'Update %s now', 'jetpack' ), $name ) ),
								esc_attr( $name ),
								__( 'Update Now', 'jetpack' )
							);
						}
						break;

					case 'latest_installed':
					case 'newer_installed':
						if ( is_plugin_active( $status['file'] ) ) {
							$action_links[] = sprintf(
								'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
								_x( 'Active', 'plugin', 'jetpack' )
							);
						} elseif ( current_user_can( 'activate_plugin', $status['file'] ) ) {
							$button_text = __( 'Activate', 'jetpack' );
							/* translators: %s: plugin name */
							$button_label = _x( 'Activate %s', 'plugin', 'jetpack' );
							$activate_url = add_query_arg(
								array(
									'_wpnonce' => wp_create_nonce( 'activate-plugin_' . $status['file'] ),
									'action'   => 'activate',
									'plugin'   => $status['file'],
								),
								network_admin_url( 'plugins.php' )
							);

							if ( is_network_admin() ) {
								$button_text = __( 'Network Activate', 'jetpack' );
								/* translators: %s: plugin name */
								$button_label = _x( 'Network Activate %s', 'plugin', 'jetpack' );
								$activate_url = add_query_arg( array( 'networkwide' => 1 ), $activate_url );
							}

							$action_links[] = sprintf(
								'<a href="%1$s" class="button activate-now" aria-label="%2$s" data-jptracks-name="jetpack_about_activate_button" data-jptracks-prop="%3$s">%4$s</a>',
								esc_url( $activate_url ),
								esc_attr( sprintf( $button_label, $plugin['name'] ) ),
								esc_attr( $plugin['name'] ),
								$button_text
							);
						} else {
							$action_links[] = sprintf(
								'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
								_x( 'Installed', 'plugin', 'jetpack' )
							);
						}
						break;
				}
			}

			$plugin_install = "plugin-install.php?tab=plugin-information&amp;plugin={$plugin['slug']}&amp;TB_iframe=true&amp;width=600&amp;height=550";
			$details_link   = is_multisite()
				? network_admin_url( $plugin_install )
				: admin_url( $plugin_install );

			if ( ! empty( $plugin['icons']['svg'] ) ) {
				$plugin_icon_url = $plugin['icons']['svg'];
			} elseif ( ! empty( $plugin['icons']['2x'] ) ) {
				$plugin_icon_url = $plugin['icons']['2x'];
			} elseif ( ! empty( $plugin['icons']['1x'] ) ) {
				$plugin_icon_url = $plugin['icons']['1x'];
			} else {
				$plugin_icon_url = $plugin['icons']['default'];
			}
			?>

		<li class="jetpack-about__plugin plugin-card-<?php echo sanitize_html_class( $plugin['slug'] ); ?>">
			<?php
			if ( ! $compatible_php || ! $compatible_wp ) {
				echo '<div class="notice inline notice-error notice-alt"><p>';
				if ( ! $compatible_php && ! $compatible_wp ) {
					esc_html_e( 'This plugin doesn&#8217;t work with your versions of WordPress and PHP.', 'jetpack' );
					if ( current_user_can( 'update_core' ) && current_user_can( 'update_php' ) ) {
						printf(
							/* translators: 1: "Update WordPress" screen URL, 2: "Update PHP" page URL */
							' ' . wp_kses( __( '<a href="%1$s">Please update WordPress</a>, and then <a href="%2$s">learn more about updating PHP</a>.', 'jetpack' ), array( 'a' => array( 'href' => true ) ) ),
							esc_url( self_admin_url( 'update-core.php' ) ),
							esc_url( wp_get_update_php_url() )
						);
						wp_update_php_annotation();
					} elseif ( current_user_can( 'update_core' ) ) {
						printf(
							/* translators: %s: "Update WordPress" screen URL */
							' ' . wp_kses( __( '<a href="%s">Please update WordPress</a>.', 'jetpack' ), array( 'a' => array( 'href' => true ) ) ),
							esc_url( self_admin_url( 'update-core.php' ) )
						);
					} elseif ( current_user_can( 'update_php' ) ) {
						printf(
							/* translators: %s: "Update PHP" page URL */
							' ' . wp_kses( __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack' ), array( 'a' => array( 'href' => true ) ) ),
							esc_url( wp_get_update_php_url() )
						);
						wp_update_php_annotation();
					}
				} elseif ( ! $compatible_wp ) {
					esc_html_e( 'This plugin doesn&#8217;t work with your version of WordPress.', 'jetpack' );
					if ( current_user_can( 'update_core' ) ) {
						printf(
							/* translators: %s: "Update WordPress" screen URL */
							' ' . wp_kses( __( '<a href="%s">Please update WordPress</a>.', 'jetpack' ), array( 'a' => array( 'href' => true ) ) ),
							esc_url( self_admin_url( 'update-core.php' ) )
						);
					}
				} elseif ( ! $compatible_php ) {
					esc_html_e( 'This plugin doesn&#8217;t work with your version of PHP.', 'jetpack' );
					if ( current_user_can( 'update_php' ) ) {
						printf(
							/* translators: %s: "Update PHP" page URL */
							' ' . wp_kses( __( '<a href="%s">Learn more about updating PHP</a>.', 'jetpack' ), array( 'a' => array( 'href' => true ) ) ),
							esc_url( wp_get_update_php_url() )
						);
						wp_update_php_annotation();
					}
				}
				echo '</p></div>';
			}
			?>

			<div class="plugin-card-top">
				<div class="name column-name">
					<h3>
						<a href="<?php echo esc_url( $details_link ); ?>" class="jptracks thickbox open-plugin-details-modal" data-jptracks-name="jetpack_about_plugin_modal" data-jptracks-prop="<?php echo esc_attr( $plugin['slug'] ); ?>">
						<?php echo esc_html( $title ); ?>
						<img src="<?php echo esc_url( $plugin_icon_url ); ?>" class="plugin-icon" alt="<?php esc_attr_e( 'Plugin icon', 'jetpack' ); ?>" aria-hidden="true">
						</a>
					</h3>
				</div>
				<div class="desc column-description">
					<p><?php echo esc_html( $description ); ?></p>
				</div>

				<div class="details-link">
					<a class="jptracks thickbox open-plugin-details-modal" href="<?php echo esc_url( $details_link ); ?>" data-jptracks-name="jetpack_about_plugin_details_modal" data-jptracks-prop="<?php echo esc_attr( $plugin['slug'] ); ?>"><?php esc_html_e( 'More Details', 'jetpack' ); ?></a>
				</div>
			</div>

			<div class="plugin-card-bottom">
				<div class="meta">
					<?php
					wp_star_rating(
						array(
							'rating' => $plugin['rating'],
							'type'   => 'percent',
							'number' => $plugin['num_ratings'],
						)
					);
					?>
					<span class="num-ratings" aria-hidden="true">(<?php echo esc_html( number_format_i18n( $plugin['num_ratings'] ) ); ?> <?php esc_html_e( 'ratings', 'jetpack' ); ?>)</span>
					<div class="downloaded">
						<?php
						if ( $plugin['active_installs'] >= 1000000 ) {
							$active_installs_millions = floor( $plugin['active_installs'] / 1000000 );
							$active_installs_text     = sprintf(
								/* translators: number of millions of installs. */
								_nx( '%s+ Million', '%s+ Million', $active_installs_millions, 'Active plugin installations', 'jetpack' ),
								number_format_i18n( $active_installs_millions )
							);
						} elseif ( 0 === $plugin['active_installs'] ) {
							$active_installs_text = _x( 'Less Than 10', 'Active plugin installations', 'jetpack' );
						} else {
							$active_installs_text = number_format_i18n( $plugin['active_installs'] ) . '+';
						}
						/* translators: number of active installs */
						printf( esc_html__( '%s Active Installations', 'jetpack' ), esc_html( $active_installs_text ) );
						?>
					</div>
				</div>

				<div class="action-links">
					<?php
					if ( $action_links ) {
						// The var simply collects strings that have already been sanitized.
						// phpcs:ignore WordPress.Security.EscapeOutput
						echo '<ul class="action-buttons"><li>' . implode( '</li><li>', $action_links ) . '</li></ul>';
					}
					?>
				</div>
			</div>
		</li>
			<?php

		}
	}

	/**
	 * Fetch anonymous data about A12s from wpcom: total count, number of countries, languages spoken.
	 *
	 * @since 7.4
	 *
	 * @return array $data
	 */
	private function fetch_a8c_data() {
		$data = get_transient( 'jetpack_a8c_data' );
		if ( false === $data ) {
			$data = json_decode(
				wp_remote_retrieve_body(
					wp_remote_get( 'https://public-api.wordpress.com/wpcom/v2/jetpack-about' )
				),
				true
			);
			if ( ! empty( $data ) && is_array( $data ) ) {
				set_transient( 'jetpack_a8c_data', $data, WEEK_IN_SECONDS );
			} else {
				// Fallback if everything fails.
				$data = array(
					'a12s'             => 888,
					'countries'        => 69,
					'languages'        => 83,
					'featured_plugins' => array(
						'woocommerce',
						'activitypub',
						'wp-job-manager',
						'wp-super-cache',
					),
				);
			}
		}
		return $data;
	}

	/**
	 * Compile and display a list of avatars for A12s that gave their permission.
	 *
	 * @since 7.3
	 */
	public function display_gravatars() {
		$hashes = array(
			'https://1.gravatar.com/avatar/d2ab03dbab0c97740be75f290a2e3190',
			'https://2.gravatar.com/avatar/b0b357b291ac72bc7da81b4d74430fe6',
			'https://2.gravatar.com/avatar/9e149207a0e0818abed0edbb1fb2d0bf',
			'https://2.gravatar.com/avatar/9f376366854d750124dffe057dda99c9',
			'https://1.gravatar.com/avatar/1c75d26ad0d38624f02b15accc1f20cd',
			'https://1.gravatar.com/avatar/c510e69d83c7d10be4df64feeff4e46a',
			'https://0.gravatar.com/avatar/88ec0dcadea38adf5f30a17e54e9b248',
			'https://1.gravatar.com/avatar/1ec3571e0201a990ceca5e365e780efa',
			'https://0.gravatar.com/avatar/0619d4de8aef78c81b2194ff1d164d85',
			'https://0.gravatar.com/avatar/7fdcad31a04def0ab9583af475c9036c',
			'https://0.gravatar.com/avatar/b3618d70c63bbc5cc7caee0beded5ff0',
			'https://1.gravatar.com/avatar/4d346581a3340e32cf93703c9ce46bd4',
			'https://2.gravatar.com/avatar/9c2f6b95a00dfccfadc6a912a2b859ba',
			'https://1.gravatar.com/avatar/1a33e7a69df4f675fcd799edca088ac2',
			'https://2.gravatar.com/avatar/d5dc443845c134f365519568d5d80e62',
			'https://0.gravatar.com/avatar/c0ccdd53794779bcc07fcae7b79c4d80',
		);
		$output = '';
		foreach ( $hashes as $hash ) {
			$output .= '<li><img src="' . esc_url( $hash ) . '?s=150"></li>' . "\n";
		}
		echo wp_kses(
			$output,
			array(
				'li'  => true,
				'img' => array(
					'src' => true,
				),
			)
		);
	}
}
