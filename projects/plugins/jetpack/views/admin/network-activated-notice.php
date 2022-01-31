<?php if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] ) : ?>
	<div id="message" class="error">
		<p><?php _e( 'Jetpack is network activated and notices can not be dismissed.', 'jetpack' ); ?></p>
	</div>
<?php endif; ?>
