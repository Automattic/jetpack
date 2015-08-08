<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data[ 'is_connected' ] ) : ?>

		<?php if ( $data[ 'show_jumpstart' ] && 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) && current_user_can( 'jetpack_manage_modules' ) && ! Jetpack::is_development_mode() ) : ?>

			<div id="jump-start-success"></div>
			<div id="jump-start-area" class="j-row">
				<h1 title="<?php esc_attr_e( 'Jump Start your site by activating these components', 'jetpack' ); ?>" class="jstart"><?php _e( 'Jump Start your site', 'jetpack' ); ?></h1>
				<div class="jumpstart-desc j-col j-sm-12 j-md-12 j-lrg-8">
					<div class="jumpstart-message">
						<p id="jumpstart-paragraph-before"><?php echo sprintf( __( 'To immediately boost performance, security, and engagement, we recommend activating <strong>%s</strong> and a few others. Click <strong>Jump Start</strong> to activate these modules.', 'jetpack' ), $data[ 'jumpstart_list' ] ); ?>
							<a class="pointer jp-config-list-btn"><?php _e( 'Learn more about Jump Start and what it adds to your site.', 'jetpack' ); ?></a>
						</p>
					</div><!-- /.jumpstart-message -->
				</div>
				<div class="jumpstart-message hide">
					<h1 title="<?php esc_attr_e( 'Your site has been sucessfully Jump Started.', 'jetpack' ); ?>" class="success"><?php _e( 'Success! You\'ve jump started your site.', 'jetpack' ); ?></h1>
					<p><?php echo sprintf( __( 'Check out other recommended features below, or go to the <a href="%s">settings</a> page to customize your Jetpack experience.', 'jetpack' ), admin_url( 'admin.php?page=jetpack_modules' ) ); ?></p>
				</div><!-- /.jumpstart-message -->
				<div id="jumpstart-cta" class="j-col j-sm-12 j-md-12 j-lrg-4">
					<img class="jumpstart-spinner" style="margin: 0 auto; padding: 49px 0 14px; display: none;" width="17" src="<?php echo esc_url( plugins_url( 'images/wpspin_light-2x.gif', JETPACK__PLUGIN_FILE) ); ?>" alt="Loading ..." />
					<a id="jump-start" class="button-primary" ><?php esc_html_e( 'Jump Start', 'jetpack' ); ?></a>
					<a class="dismiss-jumpstart pointer" ><?php esc_html_e( 'Dismiss', 'jetpack' ); ?></a>
				</div>
				<div id="jump-start-module-area">
					<div id="jp-config-list" class="clear j-row hide">
						<a class="pointer jp-config-list-btn close" ><span class="dashicons dashicons-no"></span></a>
					</div>
				</div>
			</div>

		<?php endif; ?>

		<div class="nux-intro jp-content" style="display: none;">

		<h1 title="<?php esc_attr_e( 'Improve your site with Jetpack', 'jetpack' ); ?>"><?php _e( 'Improve your site with Jetpack', 'jetpack' ); ?></h1>
		<p><?php _e( 'Jetpack can secure your site, increase performance &amp; traffic, and simplify how you interact and manage your site. Activate the features below to see how.', 'jetpack' ); ?></p>

		<div class="j-row">

		<?php // Performance & Security ?>
			<div class="j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php esc_attr_e( 'Performance &amp; Security', 'jetpack' ); ?>">
						<?php /* Leave out until better link is available
						<a class="dashicons dashicons-editor-help" href="http://jetpack.me/features/" title="<?php esc_attr_e( 'Learn more about Jetpack\'s Performance &amp; Security tools', 'jetpack' ); ?>" target="_blank"></a>
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
						<a class="dashicons dashicons-editor-help" href="http://jetpack.me/features/" title="<?php esc_attr_e( 'Learn more about Jetpack\'s Traffic Boosting tools', 'jetpack' ); ?>" target="_blank"></a>
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

					<h3 title="<?php esc_attr_e( 'WordPress.com Tools', 'jetpack' ); ?>"><a class="dashicons dashicons-editor-help" href="http://jetpack.me/support/site-management/" title="<?php esc_attr_e( 'Learn more about WordPress.com\'s free tools', 'jetpack' ); ?>" target="_blank"></a><?php _e( 'WordPress.com Tools', 'jetpack' ); ?></h3>

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

					<div class="j-row goto">
						<div class="feat j-col j-lrg-7 j-md-12 j-sm-7">
							<?php
							// Build site URL
							$url_parsed          = parse_url( get_home_url() );
							$home_url            = $url_parsed['host'];
							if ( isset( $url_parsed['path'] ) ) {
								$home_url    .=  $url_parsed['path'];
							}
							$normalized_site_url = str_replace( '/', '::', $home_url );
							?>
							<a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url ); ?>" class="button button-primary" target="_blank" title="<?php esc_attr_e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>"><?php _e( 'Go to WordPress.com', 'jetpack' ); ?></a>
						</div>
						<div class="act j-col j-lrg-5 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<?php $manage_active = Jetpack::is_module_active( 'manage' ); ?>
								<input class="is-compact form-toggle" type="checkbox" id="active-manage" <?php echo ( $manage_active ) ? 'checked' : ''; ?> />
									<label class="form-toggle__label" for="active-manage">
										<img class="module-spinner-manage" style="display: none;" width="16" height="16" src="<?php echo esc_url( plugins_url( 'images/wpspin_light-2x.gif', JETPACK__PLUGIN_FILE) ); ?>" alt="Loading ..." />
										<label class="plugin-action__label" for="active-manage">
											<?php ( $manage_active ) ? esc_html_e( 'Active' ) : esc_html_e( 'inactive' ); ?>
										</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
		<?php // END WordPress.com Tools ?>

	</div><?php // j-row ?>

		<p><?php _e( 'Jetpack includes many other features that you can use to customize how your site looks and functions. These include Contact Forms, Tiled Photo Galleries, Custom CSS, Image Carousel, and a lot more.', 'jetpack' ); ?></p>

		<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
			<p><a href="<?php echo admin_url( 'admin.php?page=jetpack_modules' ); ?>" class="button" ><?php echo sprintf( __( 'See the other %s Jetpack features', 'jetpack' ), count( Jetpack::get_available_modules() ) - count( $data[ 'recommended_list' ] ) ); ?></a></p>
		<?php endif; ?>

		<div class="nux-foot j-row">
			<div class="j-col j-lrg-9 j-md-9 j-sm-12">
			<?php
				// Get a list of Jetpack Happiness Engineers.
				$jetpack_hes = array(
					'724cd8eaaa1ef46e4c38c4213ee1d8b7',
					'623f42e878dbd146ddb30ebfafa1375b',
					'561be467af56cefa58e02782b7ac7510',
					'd8ad409290a6ae7b60f128a0b9a0c1c5',
					'790618302648bd80fa8a55497dfd8ac8',
					'6e238edcb0664c975ccb9e8e80abb307',
					'4e6c84eeab0a1338838a9a1e84629c1a',
					'9d4b77080c699629e846d3637b3a661c',
					'4626de7797aada973c1fb22dfe0e5109',
					'190cf13c9cd358521085af13615382d5',
				);

				// Pick a random HE.
				$jetpack_he = array_rand( $jetpack_hes, 1 );

				// Get a random profile URL.
				$default_he_img = plugins_url( 'images/jetpack-icon.jpg', JETPACK__PLUGIN_FILE );

				printf(
					'<a href="http://jetpack.me/support/" target="_blank"><img src="https://secure.gravatar.com/avatar/%1$s?s=75&d=%2$s" alt="Jetpack Happiness Engineer" /></a>',
					$jetpack_hes[ array_rand( $jetpack_hes ) ],
					urlencode( $default_he_img )
				);
			?>
			<p><?php _e( 'Need help? The Jetpack team is here for you!', 'jetpack' ); ?></p>
			<p><?php
				$jetpack_support_url = sprintf(
					'<a href="http://jetpack.me/support/" target="_blank" title="%1$s">%1$s</a>',
					esc_attr__( 'View our support page', 'jetpack' )
				);

				$jetpack_forum_url = sprintf(
					'<a href="https://wordpress.org/support/plugin/jetpack" target="_blank" title="%1$s">%1$s</a>',
					esc_attr__( 'check the forums for answers', 'jetpack' )
				);

				$jetpack_contact_url = sprintf(
					'<a href="http://jetpack.me/contact-support/" target="_blank" title="%1$s">%1$s</a>',
					esc_attr__( 'contact us directly', 'jetpack' )
				);

				printf(
					_x(
						'We offer free, full support to all of our Jetpack users. Our support team is always around to help you. %1$s, %2$s, or %3$s',
						'1: View our support page; 2: check the forums for answers, 3: contact us directly',
						'jetpack'
					),
					$jetpack_support_url,
					$jetpack_forum_url,
					$jetpack_contact_url
				);
			?></p>
			</div>
			<div class="j-col j-lrg-3 j-md-3 j-sm-12">
			<p><?php _e( 'Enjoying Jetpack? Got Feedback?', 'jetpack' ); ?></p>
			<ul>
				<li><?php _e( '- '); ?><a href="https://wordpress.org/support/view/plugin-reviews/jetpack" target="_blank" title="<?php esc_attr_e( 'Leave Jetpack a review', 'jetpack' ); ?>"><?php _e( 'Leave us a review', 'jetpack' ); ?></a></li>
				<li><?php
					$jetpack_twitter_url = sprintf(
						'<a href="http://twitter.com/jetpack" target="_blank" title="%1$s">%2$s</a>',
						esc_attr__( 'Jetpack on Twitter', 'jetpack' ),
						__( 'Twitter', 'jetpack' )
					);

					$jetpack_facebook_url = sprintf(
						'<a href="https://www.facebook.com/jetpackme" target="_blank" title="%1$s">%2$s</a>',
						esc_attr__( 'Jetpack on Facebook', 'jetpack' ),
						__( 'Facebook', 'jetpack' )
					);

					printf(
						_x( '- Follow us on %1$s or %2$s', '1: Twitter; 2: Facebook', 'jetpack' ),
						$jetpack_twitter_url,
						$jetpack_facebook_url
					);
				?></li>
			</ul>
			</div>
		</div><?php // nux-foot ?>

		</div><?php // nux-intro ?>

			<?php if ( $data[ 'is_connected' ] && ! $data[ 'is_user_connected' ] && current_user_can( 'jetpack_connect_user' ) ) : ?>
				<div class="link-button" style="width: 100%; text-align: center; margin-top: 15px;">
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
				</div>
			<?php endif; ?>

</div><!-- .landing -->

	<?php else : ?>
		<div class="wpcom-connect">
			<h1 title="<?php esc_attr_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?>"><?php esc_html_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?></h1>
			<div class="j-row">
				<div class="j-col j-sm-12 j-md-8 j-lrg-7 connect-desc">
					<p><?php _e( 'Jetpack connects your site to WordPress.com to give you traffic and customization tools, enhanced security, speed boosts, and more.', 'jetpack' ); ?></p>
					<p><?php _e( 'To start using Jetpack, connect to your WordPress.com account by clicking the button (if you don’t have an account you can create one quickly and for free).', 'jetpack' ); ?></p>
				</div>
				<div class="j-col j-sm-12 j-md-4 j-lrg-5 connect-btn">
					<?php if ( ! $data[ 'is_connected' ] && current_user_can( 'jetpack_connect' ) ) : ?>
						<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
					<?php elseif ( $data[ 'is_connected' ] && ! $data[ 'is_user_connected' ] && current_user_can( 'jetpack_connect_user' ) ) : ?>
						<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
					<?php endif; ?>
				</div>
			</div>
		</div>
	<?php endif; ?>
	<div id="miguels" class="flyby">
		<svg class="miguel" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="80px" height="87px" viewBox="0 0 80 87" enable-background="new 0 0 80 87" xml:space="preserve">
			<polygon class="eye" fill="#518d2a" points="41.187,17.081 46.769,11.292 50.984,15.306"/>
			<path class="body" fill="#518d2a" d="M38.032,47.3l4.973-5.157l7.597,1.996l0.878-0.91l0.761-0.789l-0.688-2.838l-0.972-0.926l-1.858,1.926 l-2.206-2.1l3.803-3.944l0.09-3.872L80,0L61.201,10.382L60.2,15.976l-5.674,1.145l-8.09-7.702L34.282,22.024l8.828-1.109 l2.068,2.929l-4.996,0.655l-3.467,3.595l0.166-4.469l-4.486,0.355L21.248,35.539l-0.441,4.206l-2.282,2.366l-2.04,6.961 L27.69,37.453l4.693,1.442l-2.223,2.306l-4.912,0.095l-7.39,22.292l-8.06,3.848l-2.408,9.811l-3.343-0.739L0,86.739l30.601-31.733 l8.867,2.507l-7.782,8.07l-1.496-0.616l-0.317-2.623l-7.197,7.463l11.445-2.604l16.413-7.999L38.032,47.3z M42.774,16.143 l3.774-3.914l2.85,2.713L42.774,16.143z"/>
		</svg>
		<svg class="miguel" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="80px" height="87px" viewBox="0 0 80 87" enable-background="new 0 0 80 87" xml:space="preserve">
			<polygon class="eye" fill="#518d2a" points="41.187,17.081 46.769,11.292 50.984,15.306   "/>
			<path class="body" fill="#518d2a" d="M38.032,47.3l4.973-5.157l7.597,1.996l0.878-0.91l0.761-0.789l-0.688-2.838l-0.972-0.926l-1.858,1.926 l-2.206-2.1l3.803-3.944l0.09-3.872L80,0L61.201,10.382L60.2,15.976l-5.674,1.145l-8.09-7.702L34.282,22.024l8.828-1.109 l2.068,2.929l-4.996,0.655l-3.467,3.595l0.166-4.469l-4.486,0.355L21.248,35.539l-0.441,4.206l-2.282,2.366l-2.04,6.961 L27.69,37.453l4.693,1.442l-2.223,2.306l-4.912,0.095l-7.39,22.292l-8.06,3.848l-2.408,9.811l-3.343-0.739L0,86.739l30.601-31.733 l8.867,2.507l-7.782,8.07l-1.496-0.616l-0.317-2.623l-7.197,7.463l11.445-2.604l16.413-7.999L38.032,47.3z M42.774,16.143 l3.774-3.914l2.85,2.713L42.774,16.143z"/>
		</svg>
		<svg class="miguel" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="80px" height="87px" viewBox="0 0 80 87" enable-background="new 0 0 80 87" xml:space="preserve">
			<polygon class="eye" fill="#518d2a" points="41.187,17.081 46.769,11.292 50.984,15.306   "/>
			<path class="body" fill="#518d2a" d="M38.032,47.3l4.973-5.157l7.597,1.996l0.878-0.91l0.761-0.789l-0.688-2.838l-0.972-0.926l-1.858,1.926 l-2.206-2.1l3.803-3.944l0.09-3.872L80,0L61.201,10.382L60.2,15.976l-5.674,1.145l-8.09-7.702L34.282,22.024l8.828-1.109 l2.068,2.929l-4.996,0.655l-3.467,3.595l0.166-4.469l-4.486,0.355L21.248,35.539l-0.441,4.206l-2.282,2.366l-2.04,6.961 L27.69,37.453l4.693,1.442l-2.223,2.306l-4.912,0.095l-7.39,22.292l-8.06,3.848l-2.408,9.811l-3.343-0.739L0,86.739l30.601-31.733 l8.867,2.507l-7.782,8.07l-1.496-0.616l-0.317-2.623l-7.197,7.463l11.445-2.604l16.413-7.999L38.032,47.3z M42.774,16.143 l3.774-3.914l2.85,2.713L42.774,16.143z"/>
		</svg>
	</div>
<div id="deactivate-success"></div>
<?php if ( Jetpack::is_development_version() ) { ?>
	<a id="jump-start-deactivate" style="cursor:pointer; display: block; text-align: center; margin-top: 25px;"><?php esc_html_e( 'RESET EVERYTHING (during testing only) - will reset modules to default as well', 'jetpack' ); ?></a>
<?php } // is_development_version ?>
