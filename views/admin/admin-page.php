<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] ) : ?>

		<div class="nux-intro jp-content">

		<h1 title="<?php _e( 'Improve your site with Jetpack', 'jetpack' ); ?>"><?php _e( 'Improve your site with Jetpack', 'jetpack' ); ?></h1>
		<p><?php _e( 'Jetpack is connected and can help secure your site, increase performance &amp; traffic, and greatly improve how you interact and manage your site. Activate to the features below to see how!', 'jetpack' ); ?></p>

		<div class="j-row">

		<?php // Performance & Security ?>
			<div class="j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php _e( 'Performance &amp; Security', 'jetpack' ); ?>"><a class="dashicons dashicons-editor-help" href="http://jetpack.me/features/" target="_blank"></a><?php _e( 'Performance &amp; Security', 'jetpack' ); ?></h3>
					
					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Photon', 'jetpack' ); ?>"><?php _e( 'Photon', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Image speed performance', 'jetpack' ); ?>"><?php _e( 'Image speed performance.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-photon" />
									<label class="form-toggle__label active" for="active-photon">
										<label class="plugin-action__label" for="active-photon">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Protect', 'jetpack' ); ?>"><?php _e( 'Protect', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Prevent brute force attacks.', 'jetpack' ); ?>"><?php _e( 'Prevent brute force attacks.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-protect" />
									<label class="form-toggle__label active" for="active-protect">
										<label class="plugin-action__label" for="active-protect">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Monitor', 'jetpack' ); ?>"><?php _e( 'Monitor', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Site downtime checked &amp; reported.', 'jetpack' ); ?>"><?php _e( 'Site downtime checked &amp; reported.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-monitor" />
									<label class="form-toggle__label inactive" for="active-monitor">
										<label class="plugin-action__label" for="active-monitor">Inactive</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Single Sign On', 'jetpack' ); ?>"><?php _e( 'Single Sign On', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Secure user authentication.', 'jetpack' ); ?>"><?php _e( 'Secure user authentication.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-signon" />
									<label class="form-toggle__label active" for="active-signon">
										<label class="plugin-action__label" for="active-signon">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'VaultPress', 'jetpack' ); ?>"><?php _e( 'VaultPress', 'jetpack' ); ?><span class="paid">PAID</span></h4>
							<p title="<?php _e( 'Site backups.', 'jetpack' ); ?>"><?php _e( 'Site backups.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-vault" />
									<label class="form-toggle__label inactive" for="active-vault">
										<label class="plugin-action__label" for="active-vault">Inactive</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
	<?php // END Performance & Security ?>

	<?php // Traffic Boosting Tools ?>
			<div class="j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php _e( 'Traffic Boosting Tools', 'jetpack' ); ?>"><a class="dashicons dashicons-editor-help" href="http://jetpack.me/features/" target="_blank"></a><?php _e( 'Traffic Boosting Tools', 'jetpack' ); ?></h3>
					
					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Site Stats', 'jetpack' ); ?>"><?php _e( 'Site Stats', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Site Statistics', 'jetpack' ); ?>"><?php _e( 'Visitor insights &amp; stats.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-stats" />
									<label class="form-toggle__label active" for="active-stats">
										<label class="plugin-action__label" for="active-stats">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Publicize', 'jetpack' ); ?>"><?php _e( 'Publicize', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Automatically promote content.', 'jetpack' ); ?>"><?php _e( 'Automatically promote content.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-publicize" />
									<label class="form-toggle__label active" for="active-publicize">
										<label class="plugin-action__label" for="active-publicize">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Enhanced Distribution', 'jetpack' ); ?>"><?php _e( 'Enhanced Distribution', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Share content w/ Search Engines.', 'jetpack' ); ?>"><?php _e( 'Share content w/ Search Engines.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-distribution" />
									<label class="form-toggle__label inactive" for="active-distribution">
										<label class="plugin-action__label" for="active-distribution">Inactive</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Sharing', 'jetpack' ); ?>"><?php _e( 'Sharing', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Add social share buttons.', 'jetpack' ); ?>"><?php _e( 'Add social share buttons.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-sharing" />
									<label class="form-toggle__label active" for="active-sharing">
										<label class="plugin-action__label" for="active-sharing">Active</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="feat j-col j-lrg-8 j-md-12 j-sm-7">
							<h4 title="<?php _e( 'Related Posts', 'jetpack' ); ?>"><?php _e( 'Related Posts', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Similar posts displayed.', 'jetpack' ); ?>"><?php _e( 'Similar posts displayed.', 'jetpack' ); ?></p>
						</div>
						<div class="act j-col j-lrg-4 j-md-12 j-sm-5">
							<div class="module-action">
								<span>
								<input class="is-compact form-toggle" type="checkbox" id="active-related" />
									<label class="form-toggle__label inactive" for="active-related">
										<label class="plugin-action__label" for="active-related">Inactive</label>
										<span class="form-toggle__switch"></span>
									</label>
								</span>
							</div>
						</div>
					</div><?php // j-row ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
	<?php // END Traffic Tools ?>


	<?php // WordPress.com Tools ?>
			<div class="wpcom j-col j-lrg-4 main-col">
				<div class="nux-in">

					<h3 title="<?php _e( 'WordPress.com Tools', 'jetpack' ); ?>"><a class="dashicons dashicons-editor-help" href="http://jetpack.me/support/site-management/" target="_blank"></a><?php _e( 'WordPress.com Tools', 'jetpack' ); ?></h3>
					
					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php _e( 'Manage Multiple Sites', 'jetpack' ); ?>"><?php _e( 'Manage Multiple Sites', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'One dashboard for all your sites.', 'jetpack' ); ?>"><?php _e( 'One dashboard for all your sites.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php _e( 'Automatic Updates', 'jetpack' ); ?>"><?php _e( 'Automatic Updates', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Keep plugins auto updated.', 'jetpack' ); ?>"><?php _e( 'Keep plugins auto updated.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php _e( 'Centralized Posting', 'jetpack' ); ?>"><?php _e( 'Centralized Posting', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Edit / Post to your sites via mobile devices.', 'jetpack' ); ?>"><?php _e( 'Edit / Post to your sites via mobile devices.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php _e( 'Menu Management', 'jetpack' ); ?>"><?php _e( 'Menu Management', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'An enhanced UI for creating &amp; editing your menus.', 'jetpack' ); ?>"><?php _e( 'An enhanced UI for creating &amp; editing your menus.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<h4 title="<?php _e( 'More Statistics', 'jetpack' ); ?>"><?php _e( 'More Statistics', 'jetpack' ); ?></h4>
							<p title="<?php _e( 'Enhanced site stats &amp; insights.', 'jetpack' ); ?>"><?php _e( 'Enhanced site stats &amp; insights.', 'jetpack' ); ?></p>
						</div>
					</div><?php // j-row ?>

					<div class="j-row goto">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<a href="http://www.wordpress.com/plugins" title="<?php _e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>"><?php _e( 'Go to WordPress.com', 'jetpack' ); ?></a>
						</div>
					</div><?php // j-row ?>

				</div> <?php // nux-in ?>
			</div><?php // j-col ?>
	<?php // END WordPress.com Tools ?>

	</div><?php // j-row ?>

		<p><?php _e( 'Jetpack includes dozens of other amazing features that you can use to customize how your site looks and functions. Some of which are Contact Forms, Tiled Photo Galleries, Custom CSS options, Image Carousels, and a lot more!', 'jetpack' ); ?></p>

		<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
			<p><a href="<?php echo admin_url( 'admin.php?page=jetpack_modules' ); ?>" class="button" ><?php echo sprintf( __( 'See the other %s Jetpack features', 'jetpack' ), count( Jetpack::get_available_modules() ) - count( $data['recommended_list'] ) ); ?></a></p>
		<?php endif; ?>

		<div class="nux-foot j-row">
			<div class="j-col j-lrg-9 j-md-9 j-sm-12">
			<img src="<?php echo plugins_url( 'images/avatar-jeherve.jpg', JETPACK__PLUGIN_FILE ); ?>" alt="" />
			<p><?php _e( 'Need help? Jeremy and the team is here for you!'); ?></p>
			<p><?php _e( 'We offer free, full support to all of our Jetpack users. Our support team is always around to help you. '); ?><a href="http://jetpack.me/contact-support/" target="_blank" title="<?php _e( 'View our support page'); ?>"><?php _e( 'View our support page'); ?></a><?php _e( ', '); ?><a href="https://wordpress.org/support/plugin/jetpack" target="_blank" title="<?php _e( 'check the forums for answers'); ?>">check the forums for answers</a><?php _e( ', or '); ?><a href="http://jetpack.me/contact-support/" target="_blank" title="<?php _e( 'Contact us directly'); ?>"><?php _e( 'Contact us directly.'); ?></a></p>
			</div>
			<div class="j-col j-lrg-3 j-md-3 j-sm-12">
			<p><?php _e( 'Enjoying Jetpack? Got Feedback?'); ?></p>
			<ul>
				<li><?php _e( '- '); ?><a href="https://wordpress.org/support/view/plugin-reviews/jetpack" target="_blank" title="<?php _e( 'Leave Jetpack a review'); ?>"><?php _e( 'Leave us a review'); ?></a></li>
				<li><?php _e( '- '); ?><?php _e( 'Follow us on '); ?><a href="http://twitter.com/jetpack" target="_blank" title="<?php _e( 'Jetpack on Twitter'); ?>"><?php _e( 'Twitter'); ?></a><?php _e( ' or '); ?><a href="https://www.facebook.com/jetpackme" target="_blank" title="<?php _e( 'Jetpack on Facebook'); ?>"><?php _e( 'Facebook'); ?></a></li>
			</ul>
			</div>
		</div><?php // nux-foot ?>

		</div><?php // nux-intro ?>

			<?php if ( $data['show_jumpstart'] && 'new_connection' === Jetpack_Options::get_option( 'jumpstart' ) && current_user_can( 'jetpack_manage_modules' ) && ! Jetpack::is_development_mode() ) : ?>

				<div id="jump-start-success"></div>
				<div id="jump-start-area" class="j-row">
					<h1 title="Jump Start your site by activating these components" class="jstart"><?php _e( 'Jump Start your site', 'jetpack' ); ?></h1>
					<div class="jumpstart-desc j-col j-sm-12 j-md-12 j-lrg-8">
						<div class="jumpstart-message">
							<p id="jumpstart-paragraph-before"><?php echo sprintf( __( 'To immediately boost performance, security, and engagement, we recommend activating <strong>%s</strong> and a few others. Click <strong>Jump Start</strong> to activate these modules.', 'jetpack' ), $data['jumpstart_list'] ); ?>
								<a class="pointer jp-config-list-btn"><?php _e( 'Learn more about Jump Start and what it adds to your site.', 'jetpack' ); ?></a>
							</p>
						</div><!-- /.jumpstart-message -->
					</div>
						<div class="jumpstart-message hide">
							<h1 title="Your site has been sucessfully Jump Started." class="success"><?php _e( 'Success! You\'ve jump started your site.', 'jetpack' ); ?></h1>
							<p><?php echo sprintf( __( 'Check out other recommended features below, or go to the <a href="%s">settings</a> page to customize your Jetpack experience.', 'jetpack' ), admin_url( 'admin.php?page=jetpack_modules' ) ); ?></p>
						</div><!-- /.jumpstart-message -->
					<div id="jumpstart-cta" class="j-col j-sm-12 j-md-12 j-lrg-4">
						<a id="jump-start" class="button-primary" ><?php esc_html_e( 'Jump Start', 'jetpack' ); ?></a>
						<a class="dismiss-jumpstart pointer" ><?php esc_html_e( 'Dismiss', 'jetpack' ); ?></a>
						<span class="spinner" style="display: none;"></span>
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

			<?php // Recommended modules on the landing page ?>
			<div class="module-grid">
				<h2 title="Get the most out of Jetpack with these features"><?php _e( 'Get the most out of Jetpack with...', 'jetpack' ); ?></h2>
				<div class="modules"></div>
				<?php if ( current_user_can( 'jetpack_manage_modules' ) ) : ?>
				<a href="<?php echo admin_url( 'admin.php?page=jetpack_modules' ); ?>" class="button" ><?php echo sprintf( __( 'See the other %s Jetpack features', 'jetpack' ), count( Jetpack::get_available_modules() ) - count( $data['recommended_list'] ) ); ?></a>
				<?php endif; ?>
			</div><!-- .module-grid -->


</div><!-- .landing -->

	<?php else : ?>
		<div class="wpcom-connect">
			<h1 title="Boost traffic, enhance security, and improve performance."><?php esc_html_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?></h1>
			<div class="j-row">
				<div class="j-col j-sm-12 j-md-8 j-lrg-7 connect-desc">
					<p><?php _e('Jetpack connects your site to WordPress.com to give you traffic and customization tools, enhanced security, speed boosts, and more.', 'jetpack' ); ?></p>
					<p><?php _e('To start using Jetpack, connect to your WordPress.com account by clicking the button (if you don’t have an account you can create one quickly and for free).', 'jetpack' ); ?></p>
				</div>
				<div class="j-col j-sm-12 j-md-4 j-lrg-5 connect-btn">
					<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
						<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
					<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
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
