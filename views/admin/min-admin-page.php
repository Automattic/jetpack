<div class="clouds-sm"></div>
<div class="page-content landing">
<div class="masthead-new <?php if ( ! $data['is_connected'] || ! $data['is_user_connected'] ) echo 'hasbutton'; ?>">
	<!-- needs to get rendered as SCSS -->
	<style>

		.landing { max-width: 992px !important; margin: 0 auto; min-height: 400px; }
		.masthead-new h1 { font: 300 2.57143em/1.4em "proxima-nova","Open Sans",Helvetica,Arial,sans-serif !important;  position: relative;  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.12);  z-index: 3; text-align: center;}
		/*.jp-content .masthead { text-align:left!important; }*/
		/*.jp-content .masthead h1 { margin:0!important; padding: 0 0 .5em .5em!important; font-size: 2.2em!important; min-width: 100%!important; }*/
		.jp-content .subhead { padding: .8em 1.5em; margin: 0!important; }
		.footer { padding-top: 4em; padding-bottom: 14em; }
		.jp-content .subhead:after, .footer:before { background: none!important; }
		/*.jp-content .subhead p { font-size: 1.2em; }*/
		/*.jp-content .subhead a.download-jetpack { margin: 1em 0!important; background: #1E8CBE!important; box-shadow: 0 6px 0 #0074A2,0 6px 3px rgba(0,0,0,0.4)!important; }*/
		/*.jp-content .footer { padding-top: 0!important; background-image: none!important; }*/
		/*.jp-content .footer:before { height: inherit!important; }*/
	</style>
	<!-- /needs to get rendered as SCSS -->
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( $data['is_connected'] ) : ?>
		<h1><?php esc_html_e( 'Get the most out of Jetpack with...', 'jetpack' ); ?></h1>
	<?php else : ?>
		<h1><?php esc_html_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?></h1>
	<?php endif; ?>

	<div class="subhead">
		<?php if ( Jetpack::is_development_mode() ) : ?>
		<h2><?php _e('Jetpack is in local development mode.', 'jetpack' ); ?></h2>
		<?php elseif ( $data['is_connected'] ) : ?>
			<div class="module-grid">

				<div class="modules"></div>

				<a href="<?php echo Jetpack::admin_url( 'page=jetpack_modules' ); ?>" class="jp-button"><?php esc_html_e( 'Checkout all 35 features...', 'jetpack' ); ?></a>
			</div><!-- .module-grid --></div><!-- .page -->
		<?php else : ?>
		<p><?php _e('Jetpack connects your site to WordPress.com for traffic and customization tools, enhanced security, speed boosts, and more.', 'jetpack' ); ?></p>
		<p><?php _e('To start using Jetpack please connect to your WordPress.com account by clicking the button below <br>(don’t worry if you don’t have one - it’s free).', 'jetpack' ); ?></p>
		<?php endif; ?>

		<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
		<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
			<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link to your account to WordPress.com', 'jetpack' ); ?></a>
		<?php endif; ?>
	</div><!-- .subhead -->
</div><!-- .masthead -->
</div>
