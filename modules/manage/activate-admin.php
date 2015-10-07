<?php

$activate_url = wp_nonce_url(
		Jetpack::admin_url(
			array(
				'page'   => 'jetpack',
				'action' => 'activate',
				'module' => 'manage',
			)
		),
		"jetpack_activate-manage"
	);

$section = isset( $_GET['section'] ) ? $_GET['section'] : null;

switch( $section ) {
	case 'plugins':
		$description = __( 'Just one more step before your plugins can be managed with WordPress.com. Click the button below and you\'ll be managing all of your plugins in one place.', 'jetpack' );
		$icon = "";
		break;

	case 'themes':
		$description = __( 'Just one more step before your themes can be managed with WordPress.com. Click the button below and you\'ll be managing your themes with our newly-redesigned user interface.Just one more step before your menus can be managed with WordPress.com. Click the button below and you\'ll be managing your menus with our newly-redesigned user interface.', 'jetpack' );
		$icon = "";
		break;

	case 'security-settings':
		$description = __( 'Just one more step before your site can be secured by Jetpack and WordPress.com. Click the button below and you\'ll be safe and secure.', 'jetpack' );
		$icon = "";
		break;

	case 'menus':
		$description = __( 'Just one more step before your menus can be managed with WordPress.com. Click the button below and you\'ll be managing your menus with our newly-redesigned user interface.', 'jetpack' );
		$icon = "";
		break;
	break;
	default:
		$description = __( 'Just one more step before your can manage your site from WordPress.com! Click the button below and you will be good to go.', 'jetpack' );
		$icon = "";
		break;
	break;
}
?>
<div class="page-content landing">
	<div class="" style="width:150px; height: 150px; border-radius: 75px; margin: 20px auto; background:#A9C4D9;">
		<?php echo $icon; ?>
	</div>
	<h1><?php esc_html_e( __( 'Enable Jetpack Manage', 'jetpack' ) ); ?></h1>
	<p style="max-width: 600px; text-align:center; font-size: 22px; color:#999; margin: 20px auto;">
		<?php esc_html_e( $description ); ?>
	</p>
	<p style="text-align: center;">	<?php printf( '<a class="button-primary" style="font-size:16px; padding: 0 20px; height:40px; line-height:40px;"  href="%1$s">%2$s</a>',
			$activate_url,
			__( 'Enable Jetpack Manage Now', 'jetpack' )
			); ?>
	</p>
</div>
