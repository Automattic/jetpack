<?php $current = $_GET['page']; ?>
<div class="jp-content">
	<div class="jp-frame">
		<div class="header">
			<nav role="navigation" class="header-nav drawer-nav nav-horizontal">

				<ul class="main-nav">
					<li class="jetpack-logo"><a href="<?php echo Jetpack_Network::network_admin_url(); ?>" title="<?php esc_attr_e( 'Home', 'jetpack' ); ?>" <?php if ( 'jetpack' == $current ) { echo 'class="current"'; } ?>><span><?php esc_html_e( 'Jetpack', 'jetpack' ); ?></span></a></li>
					<?php if ( Jetpack::is_active() || Jetpack::is_development_mode() ) : ?>
					<li class="jetpack-settings">
						<a href="<?php echo Jetpack_Network::network_admin_url( 'page=jetpack-settings' ); ?>" class="jp-button--settings <?php if ( 'jetpack-settings' == $current ) { echo 'current'; } ?>"><?php esc_html_e( 'Settings', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
				</ul>

			</nav>
		</div><!-- .header -->
		<div class="wrapper">
