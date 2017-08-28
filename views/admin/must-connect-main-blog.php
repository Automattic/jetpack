<div class="wrap">
	<div id="message" class="updated jetpack-message jp-connect" style="display:block !important;">
		<div class="jetpack-wrap-container">
			<div class="jetpack-text-container">
				<h1><?php _e( 'Get started with Jetpack Multisite', 'jetpack' ); ?></h1>
				<p>
					<?php _e( 'Get started managing your Multisite install of Jetpack by connecting.', 'jetpack' ) ?>
				</p>
			</div>
			<div class="jetpack-install-container">
				<p class="submit"><a href="<?php echo esc_url( $data['url'] ); ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a></p>
				<p class="jetpack-install-blurb">
					<?php jetpack_render_tos_blurb(); ?>
				</p>
			</div>
		</div>
	</div>
</div>
