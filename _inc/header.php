<?php $current = $_GET['page']; ?>
<div class="jp-content">
	<div class="jp-frame">
		<div class="header">
			<nav role="navigation" class="header-nav drawer-nav nav-horizontal">

				<ul class="main-nav">
					<li class="jetpack-logo"><span><?php esc_html_e( 'Jetpack', 'jetpack' ); ?></span></li>
					<li class="jetpack-page">
						<a href="<?php echo Jetpack::admin_url(); ?>" <?php if ( 'jetpack' == $current ) { echo 'class="current"'; } ?>><?php esc_html_e( 'Home', 'jetpack' ); ?></a>
					</li>
					<?php if ( Jetpack::is_active() || Jetpack::is_development_mode() ) : ?>
					<li class="jetpack-modules">
						<a href="<?php echo Jetpack::admin_url( 'page=jetpack_modules' ); ?>" <?php if ( 'jetpack_modules' == $current ) { echo 'class="current"'; } ?>><?php esc_html_e( 'Settings', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
				</ul>

			</nav>
		</div><!-- .header -->
		<div class="wrapper">