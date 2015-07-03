<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
		<div class="link-button" style="width: 100%; text-align: center; margin-top: 15px;">
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
		</div>
	<?php endif; ?>

	<?php if ( $data['is_connected'] && 'subscriber' !== $data['user_role'][0] ) : ?>

		<?php // Show some stuff for anyone but subscribers or admins ?>
		<div class="module-grid">
			<h2 title="all roles except admin and subscriberss"><?php _e( 'all roles except admin and subscribers', 'jetpack' ); ?></h2>
			<div class="modules"></div>
		</div><!-- .module-grid -->

	<?php else : ?>

		<?php // Show some stuff for just subscriber roles ?>
		<div class="module-grid">
			<h2 title="Subscriber Headline"><?php _e( 'Subscriber Headline', 'jetpack' ); ?></h2>
			<div class="modules"></div>
		</div><!-- .module-grid -->

	<?php endif; ?>
</div><!-- .landing -->
