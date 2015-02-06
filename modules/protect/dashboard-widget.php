<div class="jetpack-security">
	<?php if ( empty( $this->api_key_error ) ) : ?>
		<div class="msg working">
			<!-- <a class="dashicons dashicons-no-alt"></a> -->
			<?php printf(
				__( "Jetpack Protect is installed &amp; working! <a href='%s' target='_blank' title='Learn more about Jetpack Protect'>Learn More</a>.", 'jetpack' ),
				'http://jetpack.me/support/protect/'
			); ?>
		</div>
	<?php else: ?>
		<div class="msg attn">
			<?php printf(
				__( "There's a problem with Jetpack Protect. <a href='%s' title='Learn more about Jetpack Protect'>Why?</a>", 'jetpack' ),
				Jetpack::module_configuration_url( 'protect' )
			); ?>
		</div>
	<?php endif; ?>

<?php $blocked_attacks = get_site_option( 'jetpack_protect_blocked_attempts', false ); ?>

<div class="blocked-attacks">
	<?php if ( $blocked_attacks ) : ?>

		<?php if ( ! wp_is_mobile() ) : // sharing url strings don't work for mobile due to twitter / facebook settings ?>
			<div class="jetpack-security-sharing">
				<?php $twitter_plug = sprintf( __( 'My WordPress site has been protected from %d malicious log in attempts. Thanks @jetpack! http://jetpack.me', 'jetpack' ), $blocked_attacks );
				$facebook_plug_title = sprintf( __( 'My WordPress site has been protected from %d malicious log in attempts.', 'jetpack' ), $blocked_attacks );
				$facebook_plug_summary = __( 'Protect your WordPress site with Jetpack.', 'jetpack' ) ?>
				<a class="dashicons dashicons-twitter" target="_blank" href="http://twitter.com/home?status=<?php echo urlencode( $twitter_plug ) ?>"></a>
				<a class="dashicons dashicons-facebook-alt" target="_blank" href="https://www.facebook.com/sharer/sharer.php?s=100&p[url]=http%3A%2F%2Fjetpack.me&amp;p[title]=<?php echo urlencode( $facebook_plug_title ) ?>&amp;p[summary]=<?php echo $facebook_plug_summary ?>"></a>
			</div>
		<?php endif; ?>

		<h2 title="<?php esc_attr_e( sprintf( __( 'Jetpack Security has blocked %d malicious login attempts on your site.', 'jetpack' ), $blocked_attacks ) ); ?>"><?php echo number_format( $blocked_attacks, 0 ); ?></h2>
		<h3><?php _e( 'Malicious login attempts have been blocked.', 'jetpack') ?></h3>
	<?php endif; ?>

</div><!-- /blocked-attacks -->


<?php $file_scanning = get_site_option( 'jetpack_file_scanning_enabled', false );
if( !$file_scanning ) :
?>
	<div class="file-scanning">

		<img src="<?php echo plugin_dir_url( JETPACK__PLUGIN_FILE );?>images/jetpack-protect-shield.svg" class="jetpack-protect-logo" alt="<?php esc_attr_e( 'Jetpack Protect Logo', 'jetpack' ); ?>" />

		<p><?php _e( 'With Jetpack Protect already effectively blocking brute force attacks, we want to help harden your site security by scanning your server for any malicious files that may exist.', 'jetpack' ); ?></p>

		<a href="https://wordpress.com/settings/security/<?php echo Jetpack::get_option( 'id' ); ?>" class="button-primary"><?php _e( 'Enable File Scanning', 'jetpack' ); ?></a>

		<p><small><?php _e( 'By providing us with your SSH credentials, you\'ll allow us to securely scan your files and make sure that your site stays secure.', 'jetpack' ); ?></small></p>

	</div><?php // .file-scanning ?>
<?php endif; ?>

</div> <?php // .jetpack security ?>
