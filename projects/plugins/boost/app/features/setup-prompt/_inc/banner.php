<div class="boost-banner">
	<div class="boost-almost-done">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" fill="none" width="24" height="24"></rect><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path></g></svg>
		<?php esc_html_e( 'You are almost done. Set up Jetpack Boost and generate your sites critical CSS to see the impact on your pagespeed scores.', 'jetpack-boost' ); ?>
	</div>
	<div class="boost-banner-inner">
		<div class="boost-banner-content">
			<img style="width:176px" src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/jetpack-logo.svg' ); ?>" height="32" />

			<h1>
				<?php esc_html_e( 'The easiest speed optimization plugin for WordPress', 'jetpack-boost' ); ?>
			</h1>

			<p>
				<?php esc_html_e( 'You are almost done. Set up Jetpack Boost and generate your sites critical CSS to see the impact on your pagespeed scores.', 'jetpack-boost' ); ?>
			</p>
            <?php // phpcs:disable ?>
            <a href="<?php echo admin_url( 'admin.php?page=jetpack-boost' ); ?>" class="button button-primary">
            <?php // phpcs:enable ?>
			<?php esc_html_e( 'Set up Jetpack Boost', 'jetpack-boost' ); ?>
			</a>
		</div>

		<div class="boost-banner-image-container">
			<img
				src="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . 'app/assets/static/images/boost-performance.png' ); ?>"
				title="<?php esc_attr_e( 'Check how your web site performance scores for desktop and mobile.', 'jetpack-boost' ); ?>"
				alt="<?php esc_attr_e( 'An image showing a web site with a photo of a time-lapsed watch face. In the foreground is a graph showing a speed score for mobile and desktop in yellow and green with an overall score of B', 'jetpack-boost' ); ?>"
				srcset="<?php echo esc_url( JETPACK_BOOST_PLUGINS_DIR_URL . '/app/assets/static/images/boost-performance.png' ); ?> 650w <?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance-2x.png' ); ?> 1306w"
				sizes="(max-width: 782px) 654px, 1306px"
			>
		</div>
	</div>

	<span class="boost-dismiss dashicons dashicons-dismiss"></span>
</div>

