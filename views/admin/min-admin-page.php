<div class="clouds-sm"></div>
<div class="page-content landing">
	<!-- needs to get rendered as SCSS -->
	<style>
		.center { text-align: center; }
		.hide { display: none; }
		.pointer { cursor: pointer; }
		.landing { max-width: 992px !important; margin: 0 auto; min-height: 400px; }
		.jp-content h1 { font: 300 2.57143em/1em "proxima-nova","Open Sans",Helvetica,Arial,sans-serif !important;  position: relative;  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.12);  z-index: 3; }
		.jp-cta { text-align: center; }
		.jp-cta .button, .jp-cta .button-primary { margin: 1em; font-size: 18px; height: 45px!important; padding: 8px 15px 1px!important; }
		.jp-content .footer { padding-top: 2em!important; background-image: none!important; }
		.jp-content .footer:before { height: inherit!important; }
		.jp-content .wrapper { padding-bottom: 6em; }
		#jp-config-list li { border-bottom: 1px solid #ccc; padding-bottom: 1em; margin-bottom: 1em; }
	</style>
	<!-- /needs to get rendered as SCSS -->
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] ) : ?>
		<div class="j-row">
			<div class="j-col j-lrg-8">
				<h1><?php _e( 'Jump-start your site', 'jetpack' ); ?></h1>
				<p><?php _e( 'Jetpack recommends activating <strong>Photon</strong> for performance, <strong>Related Posts</strong>, <strong>Subscriptions</strong> and <strong>Sharing</strong> to increase traffic and engagement, <strong>Carousel</strong> for beautiful galleries, and <strong>Single Sign On</strong> for better security, and more. Click <strong>Jump-Start</strong> to turn these on.', 'jetpack' ); ?> <a class="pointer" id="jp-config-list-btn"><?php _e( 'Learn more and see a list of changes here.' ); ?></a></p>
			</div>
			<div class="j-col j-lrg-4">
				<p class="jp-cta">
					<a id="jump-start" class="button-primary" ><?php esc_html_e( 'Jump-start', 'jetpack' ); ?></a><span class="spinner" style="display: none;"></span><br>
					<a href="<?php echo Jetpack::admin_url( 'page=jetpack_modules' ); ?>" ><?php esc_html_e( 'Dismiss', 'jetpack' ); ?></a><br>
					<a id="jump-start-deactivate" style="cursor:pointer;"><?php esc_html_e( 'deactivate (for testing only)', 'jetpack' ); ?></a><br>
				</p>
			</div>

			<?php // Jump start modules ?>
			<div id="jump-start-module-area">
				<div id="jp-config-list" class="clear j-row hide"></div>
			</div>
		</div>

		<?php if ( Jetpack::is_development_mode() ) : ?>
			<h2 class="center"><?php _e('Jetpack is in local development mode.', 'jetpack' ); ?></h2>
		<?php else : ?>

		<h1 class="center"><?php _e( 'Get the most out of Jetpack with...', 'jetpack' ); ?></h1>

		<?php // Recommended modules on the landing page ?>
		<div class="module-grid">
			<div class="modules"></div>
			<a href="#" class="button" ><?php esc_html_e( 'See the other 25 Jetpack features', 'jetpack' ); ?></a>
		</div><!-- .module-grid --></div><!-- .page -->
		<?php endif; ?>

	<?php else : ?>
		<h1><?php esc_html_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?></h1>

		<p><?php _e('Jetpack connects your site to WordPress.com for traffic and customization tools, enhanced security, speed boosts, and more.', 'jetpack' ); ?></p>
		<p><?php _e('To start using Jetpack please connect to your WordPress.com account by clicking the button below <br>(don’t worry if you don’t have one - it’s free).', 'jetpack' ); ?></p>

		<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
		<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link to your account to WordPress.com', 'jetpack' ); ?></a>
		<?php endif; ?>
	<?php endif; ?>

</div>
