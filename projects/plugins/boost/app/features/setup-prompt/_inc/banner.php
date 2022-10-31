<div class="jb-setup-banner">
	<div class="jb-setup-banner__content-top-text">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"></rect><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path></g></svg>
		<span><?php esc_html_e( "You're almost done. Set up Jetpack Boost and generate your site's Critical CSS to see the impact on your PageSpeed scores.", 'jetpack-boost' ); ?></span>
	</div>
	<span class="notice-dismiss jb-setup-banner__dismiss" title="Dismiss this notice"></span>
	<div class="jb-setup-banner__inner">
		<div class="jb-setup-banner__content">
			<img class="jb-setup-banner__logo" src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/jetpack-logo.svg' ); ?>" />

			<h2 class="jb-setup-banner__title">
				<?php esc_html_e( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ); ?>
			</h1>

			<p class="jb-setup-banner__text">
				<?php esc_html_e( "You're almost done. Set up Jetpack Boost and generate your site's Critical CSS to see the impact on your PageSpeed scores.", 'jetpack-boost' ); ?>
			</p>

			<footer class="jb-setup-banner__footer">
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack-boost' ) ); ?>" class="jb-setup-banner__cta-button">
					<?php esc_html_e( 'Set up Jetpack Boost', 'jetpack-boost' ); ?>
				</a>
			</footer>
		</div>

		<div class="jb-setup-banner__image-container">
			<img
				src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/boost-performance.png' ); ?>"
				title="<?php esc_attr_e( 'Check how your web site performance scores for desktop and mobile.', 'jetpack-boost' ); ?>"
				alt="<?php esc_attr_e( 'An image showing a web site with a photo of a time-lapsed watch face. In the foreground is a graph showing a speed score for mobile and desktop in yellow and green with an overall score of B', 'jetpack-boost' ); ?>"
				srcset="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . '/app/assets/static/images/boost-performance.png' ); ?> 650w <?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance-2x.png' ); ?> 1306w"
				sizes="(max-width: 782px) 654px, 1306px"
			>
		</div>
	</div>
</div>

