<?php $current = $_GET['page']; ?>
<div class="jp-content">
	<div class="jp-frame">
		<div class="header">
			<nav role="navigation" class="header-nav drawer-nav nav-horizontal">

				<ul class="main-nav">
					<li class="jetpack-logo"><a href="<?php echo Jetpack::admin_url(); ?>" title="<?php esc_attr_e( 'Home', 'jetpack' ); ?>" <?php if ( 'jetpack' == $current ) { echo 'class="current"'; } ?>><span><?php esc_html_e( 'Jetpack', 'jetpack' ); ?></span></a></li>
					<?php if ( ( Jetpack::is_active() || Jetpack::is_development_mode() )
						&& current_user_can( 'jetpack_manage_modules' )
					 ) : ?>
					<li class="jetpack-modules">
						<a href="<?php echo Jetpack::admin_url( 'page=jetpack_modules' ); ?>" class="jp-button--settings <?php if ( 'jetpack_modules' == $current ) { echo 'current'; } ?>"><?php esc_html_e( 'Settings', 'jetpack' ); ?></a>
					</li>
					<li class="jetpack-modules" style="margin-left:15px">
						<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" class="jp-button--settings"><?php esc_html_e( 'Feedback', 'jetpack' ); ?></a>
					</li>
					<?php endif; ?>
				</ul>

			</nav>
		</div><!-- .header -->
		<div class="wrapper">
