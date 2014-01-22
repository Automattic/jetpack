<div class="jp-content">
	<div class="jp-frame">
		<div class="header">
			<nav role="navigation" class="header-nav drawer-nav nav-horizontal">
				<span>
					<?php /* ?>
					<?php if ( $is_connected ) : ?>
					<div id="jp-disconnectors">
						<?php if ( current_user_can( 'jetpack_disconnect' ) ) : ?>
						<div id="jp-disconnect" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>"><div class="deftext"><?php _e( 'Connected to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Disconnect from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
						<?php if ( $is_user_connected && ! $is_master_user ) : ?>
						<div id="jp-unlink" class="jp-disconnect">
							<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><div class="deftext"><?php _e( 'User linked to WordPress.com', 'jetpack' ); ?></div><div class="hovertext"><?php _e( 'Unlink user from WordPress.com', 'jetpack' ) ?></div></a>
						</div>
						<?php endif; ?>
					</div>
					<?php endif; */ ?>
				</span>
				<ul class="main-nav">
					<?php
					$current = 'about';
					$uri = $_SERVER['REQUEST_URI']; //Needs esc_url(  );
					
					if ( strpos( $uri, 'jetpack_modules' ) )
						$current = 'configure';
					?>
					<li class="jetpack-logo"><span>Jetpack</span></li>
					<li><a href="<?php echo admin_url('admin.php?page=jetpack'); ?>" <?php if ( 'about' == $current ) { echo 'class="current"'; } ?>>Home</a></li>
					<li><a href="<?php echo admin_url('admin.php?page=jetpack_modules'); ?>" <?php if ( 'configure' == $current ) { echo 'class="current"'; } ?>>Modules</a></li>
				</ul>
			</nav>
		</div><!-- .header -->
		<div class="wrapper">