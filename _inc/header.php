<?php
global $current_user;
$current           = $_GET['page'];
$is_active         = Jetpack::is_active();
$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
$is_user_connected = $user_token && ! is_wp_error( $user_token );
$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
?>
<div class="jp-content">
	<div class="jp-frame">
		<div class="header">
			<nav role="navigation" class="header-nav drawer-nav nav-horizontal">

				<ul class="main-nav">
					<li class="jetpack-logo"><span><?php esc_html_e( 'Jetpack', 'jetpack' ); ?></span></li>
					<li class="jetpack-page">
						<a href="<?php echo Jetpack::admin_url(); ?>" <?php if ( 'jetpack' == $current ) { echo 'class="current"'; } ?>><?php esc_html_e( 'Home', 'jetpack' ); ?></a>
					</li>
					<?php if ( $is_active || Jetpack::is_development_mode() ) : ?>
					<li class="jetpack-modules">
						<a href="<?php echo Jetpack::admin_url( 'page=jetpack_modules' ); ?>" <?php if ( 'jetpack_modules' == $current ) { echo 'class="current"'; } ?>><?php esc_html_e( 'Modules', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
				</ul>

				<ul class="user-nav">
					<?php if ( $is_active && current_user_can( 'jetpack_disconnect' ) ) : ?>
					<li class="right disconnect-site">
						<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>"><?php esc_html_e( 'Disconnect Site', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
					<?php if ( $is_active && $is_user_connected && ! $is_master_user ) : ?>
					<li class="right disconnect-user">
						<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><?php esc_html_e( 'Unlink User', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
				</ul>

			</nav>
		</div><!-- .header -->
		<div class="wrapper">