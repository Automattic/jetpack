<?php
/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

include_once( 'class.jetpack-admin-page.php' );

// Builds the landing page and its menu
class Jetpack_About_Page extends Jetpack_Admin_Page {

	// Show the settings page only when Jetpack is connected or in dev mode
	protected $dont_show_if_not_active = true;

	/**
	 * Add a submenu item to the Jetpack admin menu.
	 *
	 * @return string
	 */
	function get_page_hook() {
		// Add the main admin Jetpack menu
		return add_submenu_page(
			'jetpack',
			esc_html__( 'About Jetpack', 'jetpack' ),
			esc_html__( 'About Jetpack', 'jetpack' ),
			'jetpack_admin_page',
			'jetpack_about',
			array( $this, 'render' )
		);
	}

	function add_page_actions( $hook ) {}
	function page_admin_scripts() {
		wp_enqueue_style( 'plugin-install' );
		wp_enqueue_script( 'plugin-install' );

		wp_enqueue_style( 'thickbox' );
		wp_enqueue_script( 'thickbox' );
	}

	/**
	 * Load styles for static page.
	 */
	function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Render the page with a common top and bottom part, and page specific content
	 */
	function render() {
		Jetpack_Admin_Page::wrap_ui( array( $this, 'page_render' ), array( 'show-nav' => false ) );
	}

	/**
	 * Render the page content
	 */
	function page_render() {
		?>
		<div class="page-content configure">
			<div class="frame top">
				<div class="jetpack-about__link-back">
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack' ) ); ?>">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"/><g><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></g></svg>
						<?php esc_html_e( 'Back to Jetpack Dashboard', 'jetpack' ); ?>
					</a>
				</div>
				<div class="jetpack-about__main">
					<div class="jetpack-about__logo">
						<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
							 viewBox="0 0 800 96" style="enable-background:new 0 0 800 96;" xml:space="preserve">
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
							<div class="gravatars"><?php $this->display_gravatars(); ?></div>
							<a href="https://automattic.com/about/" target="_blank"><?php esc_html_e( 'Meet the team', 'jetpack' ); ?></a>
						</div>

						<div class="jetpack-about__text">
							<p>
								<?php esc_html_e( 'We are the people behind WordPress.com, WooCommerce, Jetpack, Simplenote, Longreads, VaultPress, Akismet, Gravatar, Crowdsignal, Cloudup, and more. We believe in making the web a better place.', 'jetpack' ); ?>
								<a href="https://automattic.com/" target="_blank">
									<?php esc_html_e( 'Learn more about us.', 'jetpack' ); ?>
								</a>
							</p>
							<p>
								<?php esc_html_e( 'We’re a distributed company with 864 Automatticians in 68 countries speaking 84 different languages. Our common goal is to democratize publishing so that anyone with a story can tell it, regardless of income, gender, politics, language, or where they live in the world.', 'jetpack' ); ?>
							</p>
							<p>
								<?php esc_html_e( 'We believe in Open Source and the vast majority of our work is available under the GPL.', 'jetpack' ); ?>
							</p>
							<p>
								<?php
									// Maybe use printf() because we'll want to escape the string but still allow for the link, so we can't use esc_html_e()
									echo wp_kses( __( 'We strive to live by the <a href="https://automattic.com/creed/" target="_blank">Automattic Creed</a>.', 'jetpack' ), array( 'a' => array( 'href' => array(), 'target' => array() ) ) ); ?>
							</p>
							<p>
								<a href="https://automattic.com/jobs" target="_blank">
									<?php esc_html_e( 'Come work with us', 'jetpack' ); ?>
								</a>
							</p>
						</div>
					</div>
				</div>

				<div class="jetpack-about__colophon">
					<h3><?php esc_html_e( 'Popular WordPress services by Automattic', 'jetpack' ); ?></h3>
					<ul class="jetpack-about__services">
					<?php $this->display_plugins(); ?>
					</ul>

					<p class="more"><?php echo wp_kses( __( 'For even more of our WordPress plugins, please <a href="https://profiles.wordpress.org/automattic/" target="_blank">take a look at our WordPress.org profile</a>.', 'jetpack' ), array( 'a' => array( 'href' => array(), 'target' => array() ) ) ); ?></p>
				</div>
			</div>
		</div>
		<?php
	}

	function display_plugins() {
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

		// slugs for plugins we want to display
		$a8c_plugins = array(
			'akismet',
			'wp-super-cache',
			'vaultpress',
			'polldaddy',
		);

		// need this to access the plugins_api() function
		include_once( ABSPATH . 'wp-admin/includes/plugin-install.php' );

		foreach ( $a8c_plugins as $slug ){
			$args = array(
				'slug'	=> $slug,
				'fields'	=> array(
					'added'						=> false,
					'author'						=> false,
					'author_profile'				=> false,
					'banners'					=> false,
					'contributors'				=> false,
					'donate_link'				=> false,
					'homepage'					=> false,
					'reviews'					=> false,
					'screenshots'				=> false,
					'support_threads'			=> false,
					'support_threads_resolved'	=> false,
					'sections'					=> false,
					'tags'						=> false,
					'versions'					=> false,

					'compatibility'				=> true,
					'downloaded'					=> true,
					'downloadlink'				=> true,
					'icons'						=> true,
					'last_updated'				=> true,
					'num_ratings'				=> true,
					'rating'						=> true,
					'requires'					=> true,
					'requires_php'				=> true,
					'short_description'			=> true,
					'tested'						=> true,
				),
			);

			// should probably add some error checking here too
			$api = plugins_api( 'plugin_information', $args );
			$plugins[] = $api;
		}

		foreach ( $plugins as $plugin ) {
			if ( is_object( $plugin ) ) {
				$plugin = (array) $plugin;
			}

			$title = wp_kses( $plugin['name'], $plugins_allowedtags );
			$version     = wp_kses( $plugin['version'], $plugins_allowedtags );

			$name = strip_tags( $title . ' ' . $version );

			// Remove any HTML from the description.
			$description = strip_tags( $plugin['short_description'] );

			$wp_version = get_bloginfo( 'version' );

			$compatible_php = ( empty( $plugin['requires_php'] ) || version_compare( phpversion(), $plugin['requires_php'], '>=' ) );
			$tested_wp      = ( empty( $plugin['tested'] ) || version_compare( $wp_version, $plugin['tested'], '<=' ) );
			$compatible_wp  = ( empty( $plugin['requires'] ) || version_compare( $wp_version, $plugin['requires'], '>=' ) );

			$action_links = array();

			// install button
			if ( current_user_can( 'install_plugins' ) || current_user_can( 'update_plugins' ) ) {
				$status = install_plugin_install_status( $plugin );
				switch ( $status['status'] ) {
					case 'install':
						if ( $status['url'] ) {
							if ( $compatible_php && $compatible_wp ) {
								$action_links[] = sprintf(
									'<a class="install-now button" data-slug="%s" href="%s" aria-label="%s" data-name="%s">%s</a>',
									esc_attr( $plugin['slug'] ),
									esc_url( $status['url'] ),
									/* translators: %s: plugin name and version */
									esc_attr( sprintf( __( 'Install %s now' ), $name ) ),
									esc_attr( $name ),
									__( 'Install Now' )
								);
							} else {
								$action_links[] = sprintf(
									'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
									_x( 'Cannot Install', 'plugin' )
								);
							}
						}
						break;

					case 'update_available':
						if ( $status['url'] ) {
							$action_links[] = sprintf(
								'<a class="update-now button aria-button-if-js" data-plugin="%s" data-slug="%s" href="%s" aria-label="%s" data-name="%s">%s</a>',
								esc_attr( $status['file'] ),
								esc_attr( $plugin['slug'] ),
								esc_url( $status['url'] ),
								/* translators: %s: plugin name and version */
								esc_attr( sprintf( __( 'Update %s now' ), $name ) ),
								esc_attr( $name ),
								__( 'Update Now' )
							);
						}
						break;

					case 'latest_installed':
					case 'newer_installed':
						if ( is_plugin_active( $status['file'] ) ) {
							$action_links[] = sprintf(
								'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
								_x( 'Active', 'plugin' )
							);
						} elseif ( current_user_can( 'activate_plugin', $status['file'] ) ) {
							$button_text = __( 'Activate' );
							/* translators: %s: plugin name */
							$button_label = _x( 'Activate %s', 'plugin' );
							$activate_url = add_query_arg(
								array(
									'_wpnonce' => wp_create_nonce( 'activate-plugin_' . $status['file'] ),
									'action'   => 'activate',
									'plugin'   => $status['file'],
								),
								network_admin_url( 'plugins.php' )
							);

							if ( is_network_admin() ) {
								$button_text = __( 'Network Activate' );
								/* translators: %s: plugin name */
								$button_label = _x( 'Network Activate %s', 'plugin' );
								$activate_url = add_query_arg( array( 'networkwide' => 1 ), $activate_url );
							}

							$action_links[] = sprintf(
								'<a href="%1$s" class="button activate-now" aria-label="%2$s">%3$s</a>',
								esc_url( $activate_url ),
								esc_attr( sprintf( $button_label, $plugin['name'] ) ),
								$button_text
							);
						} else {
							$action_links[] = sprintf(
								'<button type="button" class="button button-disabled" disabled="disabled">%s</button>',
								_x( 'Installed', 'plugin' )
							);
						}
						break;
				}
			}

			$details_link = self_admin_url(
				'plugin-install.php?tab=plugin-information&amp;plugin=' . $plugin['slug'] .
				'&amp;TB_iframe=true&amp;width=600&amp;height=550'
			);

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
					_e( 'This plugin doesn&#8217;t work with your versions of WordPress and PHP.' );
					if ( current_user_can( 'update_core' ) && current_user_can( 'update_php' ) ) {
						printf(
							/* translators: 1: "Update WordPress" screen URL, 2: "Update PHP" page URL */
							' ' . __( '<a href="%1$s">Please update WordPress</a>, and then <a href="%2$s">learn more about updating PHP</a>.' ),
							self_admin_url( 'update-core.php' ),
							esc_url( wp_get_update_php_url() )
						);
						wp_update_php_annotation();
					} elseif ( current_user_can( 'update_core' ) ) {
						printf(
							/* translators: %s: "Update WordPress" screen URL */
							' ' . __( '<a href="%s">Please update WordPress</a>.' ),
							self_admin_url( 'update-core.php' )
						);
					} elseif ( current_user_can( 'update_php' ) ) {
						printf(
							/* translators: %s: "Update PHP" page URL */
							' ' . __( '<a href="%s">Learn more about updating PHP</a>.' ),
							esc_url( wp_get_update_php_url() )
						);
						wp_update_php_annotation();
					}
				} elseif ( ! $compatible_wp ) {
					_e( 'This plugin doesn&#8217;t work with your version of WordPress.' );
					if ( current_user_can( 'update_core' ) ) {
						printf(
							/* translators: %s: "Update WordPress" screen URL */
							' ' . __( '<a href="%s">Please update WordPress</a>.' ),
							self_admin_url( 'update-core.php' )
						);
					}
				} elseif ( ! $compatible_php ) {
					_e( 'This plugin doesn&#8217;t work with your version of PHP.' );
					if ( current_user_can( 'update_php' ) ) {
						printf(
							/* translators: %s: "Update PHP" page URL */
							' ' . __( '<a href="%s">Learn more about updating PHP</a>.' ),
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
						<a href="<?php echo esc_url( $details_link ); ?>" class="thickbox open-plugin-details-modal">
						<?php echo $title; ?>
						<img src="<?php echo esc_attr( $plugin_icon_url ); ?>" class="plugin-icon" alt="">
						</a>
					</h3>
				</div>
				<div class="desc column-description">
					<p><?php echo $description; ?></p>
				</div>

				<div class="details-link">
					<a class="thickbox open-plugin-details-modal" href="<?php echo $details_link; ?>"><?php _e( 'More Details', 'jetpack' ); ?></a>
				</div>
			</div>

			<div class="plugin-card-bottom">
				<div class="action-links">
					<?php
					if ( $action_links ) {
						echo '<ul class="plugin-action-buttons"><li>' . implode( '</li><li>', $action_links ) . '</li></ul>';
					}
					?>
				</div>
				<div class="vers column-rating">
					<?php
					wp_star_rating(
						array(
							'rating' => $plugin['rating'],
							'type'   => 'percent',
							'number' => $plugin['num_ratings'],
						)
					);
					?>
					<span class="num-ratings" aria-hidden="true">(<?php echo number_format_i18n( $plugin['num_ratings'] ); ?> <?php esc_html_e( 'ratings', 'jetpack' ); ?>)</span>
				</div>
				<div class="column-downloaded">
					<?php
					if ( $plugin['active_installs'] >= 1000000 ) {
						$active_installs_millions = floor( $plugin['active_installs'] / 1000000 );
						$active_installs_text     = sprintf(
							_nx( '%s+ Million', '%s+ Million', $active_installs_millions, 'Active plugin installations' ),
							number_format_i18n( $active_installs_millions )
						);
					} elseif ( 0 == $plugin['active_installs'] ) {
						$active_installs_text = _x( 'Less Than 10', 'Active plugin installations' );
					} else {
						$active_installs_text = number_format_i18n( $plugin['active_installs'] ) . '+';
					}
					printf( __( '%s Active Installations' ), $active_installs_text );
					?>
				</div>
			</div>
		</li>
			<?php

		}

	}

	function display_gravatars() {
		$output = '';

		// just placeholders for now, ideally we nab these from a8c servers
		$gravatars = array(
			'https://2.gravatar.com/avatar/5ef318426c941cbef6db5342c1356231',
			'https://0.gravatar.com/avatar/07adca4279691873f594d48dd7c657e1',
			'https://2.gravatar.com/avatar/b0b357b291ac72bc7da81b4d74430fe6',
			'https://1.gravatar.com/avatar/ab1f64abf81653d5a60d78a86a26bec1',
			'https://2.gravatar.com/avatar/eecc887dff6e1e42103590c76f215d87',
			'https://0.gravatar.com/avatar/987da1e668e6eb5cde64b52a477764ec',
			'https://1.gravatar.com/avatar/4ac90c7bc18ab89a243e6ca93bda983a',
			'https://1.gravatar.com/avatar/4d346581a3340e32cf93703c9ce46bd4',
			'https://1.gravatar.com/avatar/78c17142720e599ad7919c541124749e',
			'https://0.gravatar.com/avatar/9f376366854d750124dffe057dda99c9',
			'https://1.gravatar.com/avatar/1a33e7a69df4f675fcd799edca088ac2',
			'https://0.gravatar.com/avatar/30cf08c478da339285e39b5e8feb6a3f',
			'https://1.gravatar.com/avatar/d212b7b6c54f0ccb2c848d23440b33ba',
			'https://0.gravatar.com/avatar/c0ccdd53794779bcc07fcae7b79c4d80',
			'https://2.gravatar.com/avatar/8e6e7e85e416fd569d0f821f6fbc4c2f',
			'https://2.gravatar.com/avatar/ebdbd8f65be345e43b11e4487e9fc445',
			'https://2.gravatar.com/avatar/22bd03ace6f176bfe0c593650bcf45d8',
			'https://0.gravatar.com/avatar/00542b20e199a94a9c5da3b773996296',
			'https://0.gravatar.com/avatar/3cc1bb1db348a73c6db9aa806df16c36',
			'https://0.gravatar.com/avatar/fe9a6432e7e9d541ce8fe9574b1637ca',
			'https://2.gravatar.com/avatar/b7359fc511ec1e733b749cf93a1108a8',
			'https://1.gravatar.com/avatar/19045a8e6cd135276b62fdd7c5a8e6c2',
			'https://2.gravatar.com/avatar/82879e72da41bc26a7724a276cf14fe0',
			'https://1.gravatar.com/avatar/76701f9a6394b36ce9236beb22b87beb',
			'https://2.gravatar.com/avatar/5915fd742d0c26f6a584f9d21f991b9c',
			'https://1.gravatar.com/avatar/198723e26f9350d9bbe8d4f35a8b0bb7',
			'https://1.gravatar.com/avatar/709977fc8f4496966d454a01eab615f6',
			'https://0.gravatar.com/avatar/6cf147a5459184fdd93a2328d03ebcb4',
			'https://1.gravatar.com/avatar/40266b37e9174a660f33bb21b809d751',
			'https://0.gravatar.com/avatar/f1568367297d076f566ef695d5304300',
			'https://0.gravatar.com/avatar/970fe9a9c489b4c343b186b0c6b017ad',
			'https://2.gravatar.com/avatar/e6389004daf6cd236a6fd5a82069b426',
			'https://1.gravatar.com/avatar/a12ebf4391c6b20fe4cab62e60a8db0d',
			'https://2.gravatar.com/avatar/b0be4235dbf38547a7c26ef8ec94934b',
			'https://1.gravatar.com/avatar/190cf13c9cd358521085af13615382d5',
			'https://0.gravatar.com/avatar/f2ad3d5d58caa9fdf62303e6bc56d09b',
			'https://0.gravatar.com/avatar/caaa4d366031d73ddbd0ea5e4c725ad5',
			'https://0.gravatar.com/avatar/00e1dd94340133b9daf6e291fb766266',
			'https://1.gravatar.com/avatar/d9f75324595bf8eb19a6b7b13eb9db0b',
			'https://0.gravatar.com/avatar/664e5a9a9a4e9f17390932951c4085f1',
			'https://2.gravatar.com/avatar/e813016d247963553f447125e406851b',
			'https://2.gravatar.com/avatar/2c5af1e485742ba78010f073d5933750',
			'https://1.gravatar.com/avatar/1747354c1a3d3b4edb2a7f247d94cfb0',
			'https://2.gravatar.com/avatar/84403426e6221e7ae534afcecc30f576',
			'https://0.gravatar.com/avatar/ca021af91df7c161d5586fdd6a46834d',
			'https://1.gravatar.com/avatar/a4d9571e63c4acfb7cf9f3656e3ab1e8',
			'https://2.gravatar.com/avatar/ef0040d706cbc048d83e41b9e34a56b8',
			'https://0.gravatar.com/avatar/39d69f56617c472f02a9b3b16067d390',
		);

		$random = array_rand( $gravatars, 16 );

		foreach ( $random as $key ) {
			$url =
			$output .= '<li><img src="' . $gravatars[$key] . '"></li>' . "\n";
		}

		echo '<ul>' . $output . '</ul>';
	}

}
