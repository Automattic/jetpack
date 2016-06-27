<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php
		/**
		 * Fires when a notice is displayed in the Jetpack menu.
		 *
		 * @since 3.0.0
		 */
		do_action( 'jetpack_notices' );
	?>

	<?php if ( $data['is_connected'] ) : ?>

		<?php if ( $data['show_jumpstart'] && 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) && current_user_can( 'jetpack_manage_modules' ) && ! Jetpack::is_development_mode() ) : ?>

			<div id="jump-start-success"></div>
			<div id="jump-start-area" class="jump-start-area j-row">
				<h1 title="<?php esc_attr_e( 'Jump Start your site by activating these components', 'jetpack' ); ?>" class="jstart"><?php _e( 'Jump Start your site', 'jetpack' ); ?></h1>
				<div class="jumpstart-desc j-col j-sm-12 j-md-12">
					<div class="jumpstart-message">
						<p id="jumpstart-paragraph-before"><?php
							if ( count( $data['jumpstart_list'] ) > 1 ) {
								$last_item = array_pop( $data['jumpstart_list'] );
								/* translators: %1$s is a comma-separated list of module names or a single module name, %2$s is the last item in the module list */
								echo sprintf( __( 'To quickly boost performance, security, and engagement we recommend activating <strong>%1$s and %2$s</strong>. Click <strong>Jump Start</strong> to activate these features or <a class="pointer jp-config-list-btn">learn more</a>', 'jetpack' ), implode( $data['jumpstart_list'], ', ' ), $last_item );

							} else {
								/* translators: %s is a module name */
								echo sprintf( __( 'To quickly boost performance, security, and engagement we recommend activating <strong>%s</strong>. Click <strong>Jump Start</strong> to activate this feature or <a class="pointer jp-config-list-btn">learn more</a>', 'jetpack' ), $data['jumpstart_list'][0] );
							}
						?></p>
					</div><!-- /.jumpstart-message -->
				</div>
				<div class="jumpstart-message hide">
					<h1 title="<?php esc_attr_e( 'Your site has been sucessfully Jump Started.', 'jetpack' ); ?>" class="success"><?php _e( 'Success! You\'ve jump started your site.', 'jetpack' ); ?></h1>
					<p><?php echo sprintf( __( 'Check out other recommended features below, or go to the <a href="%s">settings</a> page to customize your Jetpack experience.', 'jetpack' ), admin_url( 'admin.php?page=jetpack_modules' ) ); ?></p>
				</div><!-- /.jumpstart-message -->
				<div id="jumpstart-cta" class="j-col j-sm-12 j-md-12 j-lrg-4">
					<img class="jumpstart-spinner" style="margin: 50px auto 14px; display: none;" width="17" height="17" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="Loading ..." />
					<a id="jump-start" class="button-primary" ><?php esc_html_e( 'Jump Start', 'jetpack' ); ?></a>
					<a class="dismiss-jumpstart pointer" ><?php esc_html_e( 'Skip', 'jetpack' ); ?></a>
				</div>
				<div id="jump-start-module-area">
					<div id="jp-config-list" class="clear j-row hide">
						<a class="pointer jp-config-list-btn close" ><span class="dashicons dashicons-no"></span></a>
					</div>
				</div>
			</div>

		<?php endif; ?>

		<?php if ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
			<div class="link-button" style="width: 100%; text-align: center; margin-top: 15px;">
				<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
			</div>
		<?php endif; ?>

		<div class="nux-intro jp-content" style="display: none;">

		<h1 title="<?php esc_attr_e( 'Improve your site with Jetpack', 'jetpack' ); ?>"><?php _e( 'Improve your site with Jetpack', 'jetpack' ); ?></h1>
		<p><?php _e( 'Jetpack can help secure your site, increase performance &amp; traffic, and simplify how you manage your site.', 'jetpack' ); ?></p>

		<div class="j-row">

		<?php // Performance & Security ?>
			<div class="j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php esc_attr_e( 'Performance &amp; Security', 'jetpack' ); ?>">
						<?php /* Leave out until better link is available
						<a class="dashicons dashicons-editor-help" href="http://jetpack.com/features/" title="<?php esc_attr_e( 'Learn more about Jetpack\'s Performance &amp; Security tools', 'jetpack' ); ?>" target="_blank"></a>
                        */ ?>
						<?php _e( 'Performance &amp; Security', 'jetpack' ); ?>
					</h3>

					<?php // The template container from landing-page-templates.php ?>
					<div id="nux-performance-security"></div>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
		<?php // END Performance & Security ?>

		<?php // Traffic Boosting Tools ?>
			<div class="j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php esc_attr_e( 'Traffic Growth', 'jetpack' ); ?>">
						<?php /* Leave out until better link is available
						<a class="dashicons dashicons-editor-help" href="http://jetpack.com/features/" title="<?php esc_attr_e( 'Learn more about Jetpack\'s Traffic Boosting tools', 'jetpack' ); ?>" target="_blank"></a>
						*/ ?>
                        <?php _e( 'Traffic Growth', 'jetpack' ); ?>
					</h3>

					<?php // The template container from landing-page-templates.php ?>
					<div id="nux-traffic"></div>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
		<?php // END Traffic Tools ?>


		<?php // WordPress.com Tools ?>
			<div class="wpcom j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php esc_attr_e( 'WordPress.com Tools', 'jetpack' ); ?>"><a class="dashicons dashicons-editor-help" href="http://jetpack.com/support/site-management/" title="<?php esc_attr_e( 'Learn more about WordPress.com\'s free tools', 'jetpack' ); ?>" target="_blank"></a><?php _e( 'WordPress.com Tools', 'jetpack' ); ?></h3>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php esc_attr_e( 'Manage Multiple Sites', 'jetpack' ); ?>"><?php _e( 'Manage Multiple Sites', 'jetpack' ); ?></h4>
							<p title="<?php esc_attr_e( 'Bulk site management from one dashboard.', 'jetpack' ); ?>"><?php _e( 'Bulk site management from one dashboard.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php esc_attr_e( 'Automatic Updates', 'jetpack' ); ?>"><?php _e( 'Automatic Updates', 'jetpack' ); ?></h4>
							<p title="<?php esc_attr_e( 'Keep plugins auto-updated.', 'jetpack' ); ?>"><?php _e( 'Keep plugins auto-updated.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php esc_attr_e( 'Centralized Posting', 'jetpack' ); ?>"><?php _e( 'Centralized Posting', 'jetpack' ); ?></h4>
							<p title="<?php esc_attr_e( 'Post to your sites via mobile devices.', 'jetpack' ); ?>"><?php _e( 'Post to your sites via mobile devices.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php esc_attr_e( 'Menu Management', 'jetpack' ); ?>"><?php _e( 'Menu Management', 'jetpack' ); ?></h4>
							<p title="<?php esc_attr_e( 'A simpler UI for creating and editing menus.', 'jetpack' ); ?>"><?php _e( 'A simpler UI for creating and editing menus.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php esc_attr_e( 'More Statistics', 'jetpack' ); ?>"><?php _e( 'More Statistics', 'jetpack' ); ?></h4>
							<p title="<?php esc_attr_e( 'Enhanced site stats and insights.', 'jetpack' ); ?>"><?php _e( 'Enhanced site stats and insights.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<?php
						$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
						$manage_active = Jetpack::is_module_active( 'manage' );
					?>
					<?php if ( current_user_can( 'jetpack_manage_modules' ) && $data['is_user_connected'] && ! Jetpack::is_development_mode() ) : ?>
					<div id="manage-row" class="j-row goto <?php echo ( $manage_active ) ? 'activated' : ''; ?>">
						<div class="feat j-col <?php echo ( $manage_active ) ? '' : 'j-lrg-7 j-md-8 j-sm-7'; ?>">
							<a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url . '?from=jpnux' ); ?>" class="button button-primary manage-cta-active" target="_blank" style="display: <?php echo ( $manage_active ) ? 'inline-block' : 'none'; ?>;" title="<?php esc_attr_e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>"><?php _e( 'Go to WordPress.com', 'jetpack' ); ?></a>
							<label for="active-manage" class="button button-primary form-toggle manage-cta-inactive" style="display: <?php echo ( $manage_active ) ? 'none' : 'inline-block'; ?>" title="<?php esc_attr_e( 'Activate free WordPress.com features', 'jetpack' ); ?>"><?php _e( 'Activate features', 'jetpack' ); ?></label>
						</div>
						<?php if ( ! $manage_active ) : ?>
						<div class="act j-col j-lrg-5 j-md-4 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-manage" <?php echo ( $manage_active ) ? 'checked' : ''; ?> />
									<label class="form-toggle__label" for="active-manage">
										<img class="module-spinner-manage" style="display: none;" width="16" height="16" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="Loading ..." />
										<label class="plugin-action__label" for="active-manage">
											<?php ( $manage_active ) ? esc_html_e( 'Active', 'jetpack' ) : esc_html_e( 'Inactive', 'jetpack' ); ?>
										</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
						<?php endif; ?>
					</div><?php // j-row ?>
					<?php endif; ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
		<?php // END WordPress.com Tools ?>

	</div><?php // j-row ?>

		<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
			<p><?php _e( 'Jetpack includes many other features that you can use to customize how your site looks and functions. These include Contact Forms, Tiled Photo Galleries, Custom CSS, Image Carousel, and a lot more.', 'jetpack' ); ?></p>
			<p><a href="<?php echo admin_url( 'admin.php?page=jetpack_modules' ); ?>" class="button full-features-btn" ><?php echo sprintf( __( 'See the other %s Jetpack features', 'jetpack' ), count( Jetpack::get_available_modules() ) - count( $data['recommended_list'] ) ); ?></a></p>
		<?php endif; ?>

		<div class="nux-foot j-row">
			<div class="j-col j-lrg-8 j-md-8 j-sm-12">
			<?php
				// Get a list of Jetpack Happiness Engineers.
				$jetpack_hes = array(
					'623f42e878dbd146ddb30ebfafa1375b',
					'561be467af56cefa58e02782b7ac7510',
					'd8ad409290a6ae7b60f128a0b9a0c1c5',
					'790618302648bd80fa8a55497dfd8ac8',
					'6e238edcb0664c975ccb9e8e80abb307',
					'4e6c84eeab0a1338838a9a1e84629c1a',
					'9d4b77080c699629e846d3637b3a661c',
					'4626de7797aada973c1fb22dfe0e5109',
					'190cf13c9cd358521085af13615382d5',
					'f7006d10e9f7dd7bea89a001a2a2fd59',
					'16acbc88e7aa65104ed289d736cb9698',
					'4d5ad4219c6f676ea1e7d40d2e8860e8',
					'e301f7d01b09e7578fdfc1b1ec1bc08d',
					'42f4c73f5337486e199f6e3b3910f168',
					'e7b26de48e76498cff880abca1eed8da',
					'764fb02aaae2ff64c0625c763d82b74e',
					'4988305772319fb9bc8fce0a7acb3aa1',
					'5d8695c4b81592f1255721d2644627ca',
					'0e2249a7de3404bc6d5207a45e911187',
				);

				// Get a fallback profile image.
				$default_he_img = plugins_url( 'images/jetpack-icon.jpg', JETPACK__PLUGIN_FILE );

				printf(
					'<a href="http://jetpack.com/support/" target="_blank"><img src="https://secure.gravatar.com/avatar/%1$s?s=75&d=%2$s" alt="Jetpack Happiness Engineer" /></a>',
					$jetpack_hes[ array_rand( $jetpack_hes ) ],
					urlencode( $default_he_img )
				);
			?>
			<p><?php _e( 'Help and Support', 'jetpack' ); ?></p>
			<p><?php _e( 'We offer free, full support to all Jetpack users. Our support team is always around to help you.', 'jetpack' ); ?></p>
			<ul class="actions">
				<li><a href="http://jetpack.com/support/" target="_blank" class="button"><?php esc_html_e( 'Visit support site', 'jetpack' ); ?></a></li>
				<li><a href="https://wordpress.org/support/plugin/jetpack" target="_blank"><?php esc_html_e( 'Browse forums', 'jetpack' ); ?></a></li>
				<li><a href="http://jetpack.com/contact-support/" target="_blank"><?php esc_html_e( 'Contact us directly', 'jetpack' ); ?></a></li>
			</ul>
			</div>
			<div class="j-col j-lrg-4 j-md-4 j-sm-12">
				<p><?php _e( 'Premium Add-ons', 'jetpack' ); ?></p>
				<p><?php esc_html_e( 'Business site? Safeguard it with real-time backups, security scans, and anti-spam.', 'jetpack' ); ?></p>
				<p>&nbsp;</p>
				<?php $normalized_site_url = Jetpack::build_raw_urls( get_home_url() ); ?>
				<div class="actions jptracks" data-jptracks-name="nudge_click" data-jptracks-prop="nux-addons"><a href="<?php echo esc_url( 'https://wordpress.com/plans/' . $normalized_site_url ); ?>" target="_blank" class="button"><?php esc_html_e( 'Compare Options', 'jetpack' ); ?></a></div>
			</div>
		</div><?php // nux-foot ?>

		</div><?php // nux-intro ?>

</div><!-- .landing -->

	<?php else : ?>

		<div class="connection-landing">

		<div class="connect-card j-row">
			<h1 title="<?php esc_attr_e( 'Please Connect Jetpack', 'jetpack' ); ?>"><?php esc_html_e( 'Please Connect Jetpack', 'jetpack' ); ?></h1>
			<div class="connect-btn j-col j-sm-12 j-md-12">
				<p><?php echo wp_kses( __( 'Connecting Jetpack will show you <strong>stats</strong> about your traffic, <strong>protect</strong> you from brute force attacks, <strong>speed up</strong> your images and photos, and enable other <strong>traffic and security</strong> features.', 'jetpack' ), 'jetpack' ) ?></p>
				<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url( false, false, 'landing-page-top' ) ?>" class="download-jetpack"><?php esc_html_e( 'Connect Jetpack', 'jetpack' ); ?></a>
				<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url( false, false, 'landing-page-top' ) ?>" class="download-jetpack"><?php esc_html_e( 'Connect your account', 'jetpack' ); ?></a>
				<?php endif; ?>
			</div>
		</div> <?php // connect-card ?>

			<div class="j-traffic feature-container jp-card">
				<header class="first-header j-int">
					<h2 title="<?php esc_attr_e( 'Drive more traffic to your site', 'jetpack' ); ?>"><?php
						esc_html_e( 'Drive more traffic to your site', 'jetpack' );
					?></h2>
					<div class="j-header-img">
						<img src="<?php echo plugins_url( 'images/connection-landing/long-clouds.svg', JETPACK__PLUGIN_FILE ); ?>" width="1135" height="63" alt="<?php echo esc_attr_x( 'Jetpack clouds image', 'Image alternative text', 'jetpack' ); ?>" /> <?php // must define dimensions here for older IEs ?>
						<img src="<?php echo plugins_url( 'images/connection-landing/stat-bars.svg', JETPACK__PLUGIN_FILE ); ?>" width="400" alt="<?php echo esc_attr_x( 'Decorative graph image', 'Image alternative text', 'jetpack' ); ?>" />
					</div>
				</header>

				<div class="three-feature j-row">
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Automated social marketing', 'jetpack' ); ?>"><?php
							esc_html_e( 'Automated social marketing', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'Use Publicize to automatically share your posts with friends, followers, and the world.', 'jetpack' ); ?></p>
					</div>
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Build a community', 'jetpack' ); ?>"><?php
							esc_html_e( 'Build a community', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'Give visitors the tools to Share and Subscribe to your content.', 'jetpack' ); ?></p>
					</div>
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Increase page views', 'jetpack' ); ?>"><?php
							esc_html_e( 'Increase page views', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'Keep visitors engaged, by giving them more to share and read with Related Posts.', 'jetpack' ); ?></p>
					</div>
				</div><?php // three-feature ?>

				<header class="secondary-header j-int">
					<h2 title="<?php esc_attr_e( 'Track your growth', 'jetpack' ); ?>">
						<?php esc_html_e( 'Track your growth', 'jetpack' ); ?>
					</h2>
				</header>

				<div class="j-feature-img">
					<img src="<?php
							echo plugins_url( 'images/connection-landing/stats-example-med.png', JETPACK__PLUGIN_FILE );
						?>"
					srcset="<?php
							echo plugins_url( 'images/connection-landing/stats-example-sm.png', JETPACK__PLUGIN_FILE );
						?> 500w, <?php
							echo plugins_url( 'images/connection-landing/stats-example-med.png', JETPACK__PLUGIN_FILE );
						?> 600w, <?php
							echo plugins_url( 'images/connection-landing/stats-example-lrg.png', JETPACK__PLUGIN_FILE );
						?> 900w" alt="<?php esc_attr_e( 'View detailed insights and analytics about your site with Jetpack', 'jetpack' ); ?>" />
				</div>

			</div><?php // jp-card ?>


			<div class="j-security feature-container jp-card">
				<header class="first-header j-int">
					<h2 title="<?php esc_attr_e( 'Site Security and Peace of Mind', 'jetpack' ); ?>"><?php
						esc_html_e( 'Site Security and Peace of Mind', 'jetpack' );
					?></h2>
					<div class="j-header-img">
						<img src="<?php echo plugins_url( 'images/connection-landing/long-clouds.svg', JETPACK__PLUGIN_FILE ); ?>" width="1135" height="63" alt="<?php echo esc_attr_x( 'Decorative graph image', 'Image alternative text', 'jetpack' ); ?>" /> <?php // must define dimensions here for older IEs ?>
						<img src="<?php echo plugins_url( 'images/connection-landing/jp-shield.svg', JETPACK__PLUGIN_FILE ); ?>" width="180" alt="<?php echo esc_attr_x( 'Decorative shield image', 'Image alternative text', 'jetpack' ); ?>" />
					</div>
				</header>

				<div class="three-feature j-row">
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Block site attacks', 'jetpack' ); ?>"><?php
							esc_html_e( 'Block site attacks', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'Gain peace of mind with Protect, the tool that has blocked billions of login attacks on millions of sites.', 'jetpack' ); ?></p>
					</div>
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Live site monitoring​', 'jetpack' ); ?>"><?php
							esc_html_e( 'Live site monitoring​', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'Stress less. Monitor will send you real-time alerts if your site ever goes down.', 'jetpack' ); ?></p>
					</div>
					<div class="j-col j-sm-12 j-md-12 j-lrg-4">
						<h3 title="<?php esc_attr_e( 'Automatic Updates', 'jetpack' ); ?>"><?php
							esc_html_e( 'Automatic updates', 'jetpack' );
						?></h3>
						<p><?php esc_html_e( 'With Manage, you’ll never be behind on a security release or waste time updating multiple sites.', 'jetpack' ); ?></p>
					</div>
				</div><?php // three-feature ?>
			</div><?php // jp-card ?>

			<div class="j-security feature-container jp-card">
				<header class="secondary-header j-int">
					<h2 title="<?php esc_attr_e( 'Optimized Images, Lightning Fast', 'jetpack' ); ?>"><?php
						esc_html_e( 'Optimized Images, Lightning Fast', 'jetpack' );
					?></h2>
					<p><?php esc_html_e( 'Jetpack utilizes the state-of-the-art WordPress.com content delivery network to load your gorgeous images super fast optimized for any device, and it’s completely free.', 'jetpack' ); ?></p>
				</header>

				<div class="j-feature-img">
					<img src="<?php
							echo plugins_url( 'images/connection-landing/feature-photon-med.jpg', JETPACK__PLUGIN_FILE );
						 ?>"
						 srcset="<?php
							echo plugins_url( 'images/connection-landing/feature-photon-sm.jpg', JETPACK__PLUGIN_FILE );
						?> 500w, <?php
							echo plugins_url( 'images/connection-landing/feature-photon-med.jpg', JETPACK__PLUGIN_FILE );
						?> 600w, <?php
							echo plugins_url( 'images/connection-landing/feature-photon-lrg.jpg', JETPACK__PLUGIN_FILE );
						?> 900w" alt="<?php esc_attr_e( 'Have faster loading images with Jetpack Photon', 'jetpack' ); ?>" />
				</div>
			</div><?php // jp-card ?>

			<div class="j-security feature-container jp-card">
				<header class="secondary-header j-int">
					<h2 title="<?php esc_attr_e( 'Free professional support', 'jetpack' ); ?>"><?php
						esc_html_e( 'Free professional support', 'jetpack' );
					?></h2>
					<p><?php esc_html_e( 'Jetpack is supported by some of the most technical and passionate people in the community. Located around the globe and ready to help you.', 'jetpack' ); ?></p>
				</header>

				<div class="j-feature-img">
					<img src="<?php
							echo plugins_url( 'images/connection-landing/aurora-med.jpg', JETPACK__PLUGIN_FILE );
						?>"
						srcset="<?php
							echo plugins_url( 'images/connection-landing/aurora-sm.jpg', JETPACK__PLUGIN_FILE );
						?> 500w, <?php
							echo plugins_url( 'images/connection-landing/aurora-med.jpg', JETPACK__PLUGIN_FILE );
						?> 600w, <?php
							echo plugins_url( 'images/connection-landing/aurora-lrg.jpg', JETPACK__PLUGIN_FILE );
						?> 900w" alt="<?php esc_attr_e( 'Jetpack has an amazing free support team', 'jetpack' ); ?>" />
				</div>
			</div><?php // jp-card ?>


		<div class="connect-card j-row">
			<div class="connect-btn j-col j-sm-12 j-md-12">
				<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url( false, false, 'landing-page-bottom' ) ?>" class="download-jetpack"><?php esc_html_e( 'Connect Jetpack', 'jetpack' ); ?></a>
				<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect your account', 'jetpack' ); ?></a>
				<?php endif; ?>
			</div>
		</div> <?php // connect-card ?>


		</div> <?php // connection landing ?>


	<?php endif; ?>
<div id="deactivate-success"></div>
<?php if ( Jetpack::is_development_version() ) { ?>
	<a id="jump-start-deactivate" style="cursor:pointer; display: block; text-align: center; margin-top: 25px;"><?php esc_html_e( 'RESET EVERYTHING (during testing only) - will reset modules to default as well', 'jetpack' ); ?></a>
<?php } // is_development_version ?>
