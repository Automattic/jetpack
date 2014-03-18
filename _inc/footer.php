			<div class="footer">
				<?php /* if ( ! $is_connected || ! $is_user_connected ) : ?>
				<div class="fly">
					<a href="<?php echo $this->build_connect_url() ?>" class="download-jetpack"><?php _e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
				</div>
				<?php endif; */?>

				<nav class="primary nav-horizontal">
					<div class="a8c-attribution">
						<span>
							<?php sprintf( __( 'An <a href="%s" class="a8c-logo">Automattic</a> Airline', 'jetpack' ),
							'http://automattic.com/'
							); ?>
						</span>
					</div>
				</nav><!-- .primary -->

				<nav class="secondary nav-horizontal">
					<div class="secondary-footer">
						<a href="http://jetpack.me">Jetpack <?php echo JETPACK__VERSION; ?></a>
						<a href="http://wordpress.com/tos/"><?php _e( 'Terms', 'jetpack' ); ?></a>
						<a href="http://automattic.com/privacy/"><?php _e( 'Privacy', 'jetpack' ); ?></a>
						<a href="admin.php?page=jetpack-debugger" title="<?php esc_attr_e( 'Test your site's compatibility with Jetpack.', 'jetpack' ); ?>">Debug</a>
						<a href="/support/" title="<?php esc_attr_e( 'Contact the Jetpack Happiness Squad.', 'jetpack' ); ?>"><?php _e( 'Support', 'jetpack' ); ?></a>
						<a href="http://jetpack.me/survey/?rel=<?php echo JETPACK__VERSION; ?>" title="<?php esc_attr_e( 'Take a survey.  Tell us how we're doing.', 'jetpack' ); ?>"><?php _e( 'Give Us Feedback', 'jetpack' ); ?></a>
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

<script type="text/javascript">
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-52447-43']);
	_gaq.push(['_trackPageview']);

	(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();
</script>
