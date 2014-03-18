			<div class="footer">
				<?php $is_connected = Jetpack::is_active(); ?>
				<?php if ( ! $is_connected && current_user_can( 'jetpack_connect' ) ) : ?>
					<a href="<?php echo $this->jetpack->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to Get Started', 'jetpack' ); ?></a>
				<?php elseif ( ! $is_connected && current_user_can( 'jetpack_connect_user' ) ) : ?>
					<a href="<?php echo $this->jetpack->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
				<?php endif; ?>

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
						<a href="http://wordpress.com/tos/"><?php _e( 'Terms', 'jetpack' ); ?></a>
						<a href="http://automattic.com/privacy/"><?php _e( 'Privacy', 'jetpack' ); ?></a>
						<a href="admin.php?page=jetpack-debugger" title="<?php esc_attr_e( 'Test your site&#8217;s compatibility with Jetpack.', 'jetpack' ); ?>"><?php _e( 'Debug', 'jetpack' ); ?></a>
						<a href="/support/" title="<?php esc_attr_e( 'Contact the Jetpack Happiness Squad.', 'jetpack' ); ?>"><?php _e( 'Support', 'jetpack' ); ?></a>
						<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" title="<?php esc_attr_e( 'Take a survey.  Tell us how we&#8217;re doing.', 'jetpack' ); ?>"><?php _e( 'Give Us Feedback', 'jetpack' ); ?></a>
					</div>
				</nav><!-- .secondary -->
			</div><!-- .footer -->
		</div><!-- .wrapper -->
		<div class="modal">
			<header>
				<a href="#" class="close">&times;</a>
				<ul>
					<li class="learn-more"><a href="javascript:;" data-tab="learn-more"><?php esc_html_e( 'Learn More', 'jetpack' ); ?></a></li>
					<li class="config"><a href="javascript:;" data-tab="config"><?php esc_html_e( 'Config', 'jetpack' ); ?></a></li>
				</ul>
			</header>
			<div class="content-container"><div class="content"></div></div>
		</div>
		<div class="shade" />
	</div><!-- .jp-frame -->
</div><!-- .jp-content -->

<?php if ( 'jetpack_modules' == $_GET['page'] ) return; ?>
