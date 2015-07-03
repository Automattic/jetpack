<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
		<div class="link-button" style="width: 100%; text-align: center; margin-top: 15px;">
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
		</div>
	<?php endif; ?>

	<?php if ( $data['is_connected'] ) : ?>

		<?php // Show some stuff for anyone but subscribers or admins ?>
		<div class="module-grid">
			<h2><?php _e( 'Get the most out of Jetpack with these features', 'jetpack' ); ?></h2>
			<div class="modules"></div>
		</div><!-- .module-grid -->

	<?php endif; ?>
</div><!-- .landing -->
