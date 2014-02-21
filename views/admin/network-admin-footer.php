		<div id="survey" class="jp-survey">
				<div class="jp-survey-container">
					<div class="jp-survey-text">
						<h4><?php _e( 'Have feedback on Jetpack?', 'jetpack' ); ?></h4>
						<br />
						<?php _e( 'Answer a short survey to let us know how we&#8217;re doing and what to add in the future.', 'jetpack' ); ?>
					</div>
					<div class="jp-survey-button-container">
						<p class="submit"><?php printf( '<a id="jp-survey-button" class="button-primary" target="_blank" href="%1$s">%2$s</a>', 'http://jetpack.me/survey/?rel=' . JETPACK__VERSION, __( 'Take Survey', 'jetpack' ) ); ?></p>
					</div>
				</div>
			</div>

			<div id="jp-footer">
				<p class="automattic"><?php _e( 'An <span>Automattic</span> Airline', 'jetpack' ) ?></p>
				<p class="small">
					<a href="http://jetpack.me/" target="_blank">Jetpack <?php echo esc_html( JETPACK__VERSION ); ?></a> |
					<a href="http://automattic.com/privacy/" target="_blank"><?php _e( 'Privacy Policy', 'jetpack' ); ?></a> |
					<a href="http://wordpress.com/tos/" target="_blank"><?php _e( 'Terms of Service', 'jetpack' ); ?></a> |
<?php if ( current_user_can( 'manage_options' ) ) : ?>
					<a href="<?php echo Jetpack::admin_url( array(	'page' => 'jetpack-debugger' ) ); ?>"><?php _e( 'Debug', 'jetpack' ); ?></a> |
<?php endif; ?>
					<a href="http://jetpack.me/support/" target="_blank"><?php _e( 'Support', 'jetpack' ); ?></a>
				</p>
			</div>
		</div>
