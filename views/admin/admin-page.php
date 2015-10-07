<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] ) : ?>

		<?php if ( $data['show_jumpstart'] && 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) && current_user_can( 'jetpack_manage_modules' ) && ! Jetpack::is_development_mode() ) : ?>

			<div id="jump-start-success"></div>
			<div id="jump-start-area" class="j-row">
				<h1 title="<?php esc_attr_e( 'Jump Start your site by activating these components', 'jetpack' ); ?>" class="jstart"><?php _e( 'Jump Start your site', 'jetpack' ); ?></h1>
				<div class="jumpstart-desc j-col j-sm-12 j-md-12">
					<div class="jumpstart-message">
						<p id="jumpstart-paragraph-before"><?php echo sprintf( __( 'To quickly boost performance, security, and engagement we recommend activating <strong>%s</strong>. Click <strong>Jump Start</strong> to activate these features or ', 'jetpack' ), $data['jumpstart_list'] ); ?>
							<a class="pointer jp-config-list-btn"><?php _e( 'learn more.', 'jetpack' ); ?></a>
						</p>
					</div><!-- /.jumpstart-message -->
				</div>
				<div class="jumpstart-message hide">
					<h1 title="<?php esc_attr_e( 'Your site has been sucessfully Jump Started.', 'jetpack' ); ?>" class="success"><?php _e( 'Success! You\'ve jump started your site.', 'jetpack' ); ?></h1>
					<p><?php echo sprintf( __( 'Check out other recommended features below, or go to the <a href="%s">settings</a> page to customize your Jetpack experience.', 'jetpack' ), admin_url( 'admin.php?page=jetpack_modules' ) ); ?></p>
				</div><!-- /.jumpstart-message -->
				<div id="jumpstart-cta" class="j-col j-sm-12 j-md-12 j-lrg-4">
					<img class="jumpstart-spinner" style="margin: 49px auto 14px; display: none;" width="17" height="17" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="Loading ..." />
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

					<?php
						$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
						$manage_active = Jetpack::is_module_active( 'manage' );
					?>
					<?php if ( current_user_can( 'jetpack_manage_modules' ) && $data['is_user_connected'] && ! Jetpack::is_development_mode() ) : ?>
					<div id="manage-row" class="j-row goto <?php echo ( $manage_active ) ? 'activated' : ''; ?>">
						<div class="feat j-col j-lrg-7 j-md-8 j-sm-7">
							<a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url . '?from=jpnux' ); ?>" class="button button-primary manage-cta-active" target="_blank" style="display: <?php echo ( $manage_active ) ? 'inline-block' : 'none'; ?>;" title="<?php esc_attr_e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>"><?php _e( 'Go to WordPress.com', 'jetpack' ); ?></a>
							<label for="active-manage" class="button button-primary form-toggle manage-cta-inactive" style="display: <?php echo ( $manage_active ) ? 'none' : 'inline-block'; ?>" title="<?php esc_attr_e( 'Activate free WordPress.com features', 'jetpack' ); ?>"><?php _e( 'Activate features', 'jetpack' ); ?></label>
						</div>
						<div class="act j-col j-lrg-5 j-md-4 j-sm-5">
							<div class="module-action">
								<span>
								<?php $manage_active = Jetpack::is_module_active( 'manage' ); ?>
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
					</div><?php // j-row ?>
					<?php endif; ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
		<?php // END WordPress.com Tools ?>

	</div><?php // j-row ?>

		<p><?php _e( 'Jetpack includes many other features that you can use to customize how your site looks and functions. These include Contact Forms, Tiled Photo Galleries, Custom CSS, Image Carousel, and a lot more.', 'jetpack' ); ?></p>

		<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
			<p><a href="<?php echo admin_url( 'admin.php?page=jetpack_modules' ); ?>" class="button full-features-btn" ><?php echo sprintf( __( 'See the other %s Jetpack features', 'jetpack' ), count( Jetpack::get_available_modules() ) - count( $data['recommended_list'] ) ); ?></a></p>
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

				// Get a fallack profile image.
				$default_he_img = plugins_url( 'images/jetpack-icon.jpg', JETPACK__PLUGIN_FILE );

				printf(
					'<a href="http://jetpack.me/support/" target="_blank"><img src="https://secure.gravatar.com/avatar/%1$s?s=75&d=%2$s" alt="Jetpack Happiness Engineer" /></a>',
					$jetpack_hes[ array_rand( $jetpack_hes ) ],
					urlencode( $default_he_img )
				);
			?>
			<p><?php _e( 'Need help? The Jetpack team is here for you!', 'jetpack' ); ?></p>
			<p><?php _e( 'We offer free, full support to all of our Jetpack users. Our support team is always around to help you.', 'jetpack' );
				echo ' ';
				printf(
					__(
						'<a href="%1$s" target="_blank">View our support page</a>, <a href="%2$s" target="_blank">check the forums for answers</a>, or <a href="%3$s" target="_blank">contact us directly</a>',
						'jetpack'
					),
					'http://jetpack.me/support/',
					'https://wordpress.org/support/plugin/jetpack',
					'http://jetpack.me/contact-support/'
				);
			?></p>
			</div>
			<div class="j-col j-lrg-3 j-md-3 j-sm-12">
			<p><?php _e( 'Enjoying Jetpack? Got Feedback?', 'jetpack' ); ?></p>
			<ul>
				<li><?php _e( '- ', 'jetpack'); ?><a href="https://wordpress.org/support/view/plugin-reviews/jetpack" target="_blank" title="<?php esc_attr_e( 'Leave Jetpack a review', 'jetpack' ); ?>"><?php _e( 'Leave us a review', 'jetpack' ); ?></a></li>
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

</div><!-- .landing -->

	<?php else : ?>
		<div id="jump-start-area" class="j-row">
			<h1 title="<?php esc_attr_e( 'Please Connect Jetpack', 'jetpack' ); ?>"><?php esc_html_e( 'Please Connect Jetpack', 'jetpack' ); ?></h1>
			<div class="connect-btn j-col j-sm-12 j-md-12">
				<p><?php echo wp_kses( __( 'Connecting Jetpack will show you <strong>stats</strong> about your traffic, <strong>protect</strong> you from brute force attacks, <strong>speed up</strong> your images and photos, and enable other <strong>traffic and security</strong> features.', 'jetpack' ), 'jetpack' ) ?></p>
				<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect Jetpack', 'jetpack' ); ?></a>
				<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect your account', 'jetpack' ); ?></a>
				<?php endif; ?>
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
