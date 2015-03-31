<?php
global $current_user;
$is_active         = Jetpack::is_active();
$user_token        = Jetpack_Data::get_access_token( $current_user->ID );
$is_user_connected = $user_token && ! is_wp_error( $user_token );
$is_master_user    = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
?>

		</div><!-- .wrapper -->
		<div class="footer">

			<nav class="primary nav-horizontal">
				<div class="a8c-attribution">
					<span>
						<?php echo sprintf( __( 'An %s Airline', 'jetpack' ),
						'<a href="http://automattic.com/" class="a8c-logo">Automattic</a>'
						); ?>
					</span>
				</div>
			</nav><!-- .primary -->

			<nav class="secondary nav-horizontal">
				<div class="secondary-footer">
					<a href="http://jetpack.me">Jetpack <?php echo JETPACK__VERSION; ?></a>
					<a href="http://wordpress.com/tos/"><?php esc_html_e( 'Terms', 'jetpack' ); ?></a>
					<a href="http://automattic.com/privacy/"><?php esc_html_e( 'Privacy', 'jetpack' ); ?></a>
					<a href="<?php echo esc_url( Jetpack::admin_url( 'page=jetpack-debugger' ) ); ?>" title="<?php esc_attr_e( 'Test your site&#8217;s compatibility with Jetpack.', 'jetpack' ); ?>"><?php _e( 'Debug', 'jetpack' ); ?></a>
					<a href="http://jetpack.me/contact-support/" title="<?php esc_attr_e( 'Contact the Jetpack Happiness Squad.', 'jetpack' ); ?>"><?php _e( 'Support', 'jetpack' ); ?></a>
					<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" title="<?php esc_attr_e( 'Take a survey.  Tell us how we&#8217;re doing.', 'jetpack' ); ?>"><?php _e( 'Give Us Feedback', 'jetpack' ); ?></a>

					<?php if ( $is_active && current_user_can( 'jetpack_disconnect' ) ) : ?>
						<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>" onclick="return confirm('<?php echo htmlspecialchars( __('Are you sure you want to disconnect from WordPress.com?', 'jetpack'), ENT_QUOTES ); ?>');"><?php esc_html_e( 'Disconnect from WordPress.com', 'jetpack' ); ?></a>
					<?php endif; ?>
					<?php if ( $is_active && $is_user_connected && ! $is_master_user ) : ?>
						<a href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><?php esc_html_e( 'Unlink your user account', 'jetpack' ); ?></a>
					<?php endif; ?>

				</div>
			</nav><!-- .secondary -->
		</div><!-- .footer -->

		<div class="modal" aria-labelledby="modal-label">
			<header>
				<a href="#" class="close">&times;</a>
				<ul>
					<li class="learn-more"><a href="javascript:;" data-tab="learn-more"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a></li>
					<li class="config"><a href="javascript:;" data-tab="config"><?php esc_html_e( 'Config', 'jetpack' ); ?></a></li>
				</ul>
			</header>
			<div class="content-container"><div class="content"></div></div>
		</div>
		<div class="shade"></div>

	</div><!-- .jp-frame -->
</div><!-- .jp-content -->

<?php if ( 'jetpack_modules' == $_GET['page'] ) return; ?>
