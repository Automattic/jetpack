	<div class="wrap" id="jetpack-settings">

			<div id="jp-header"<?php if ( $is_connected ) : ?> class="small"<?php endif; ?>>
				<div id="jp-clouds">
					<h3><?php _e( 'Jetpack by WordPress.com', 'jetpack' ) ?></h3>
				</div>
			</div>

			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<?php if ( isset( $_GET['jetpack-notice'] ) && 'dismiss' == $_GET['jetpack-notice'] ) : ?>
				<div id="message" class="error">
					<p><?php _e( 'Jetpack is network activated and notices can not be dismissed.', 'jetpack' ); ?></p>
				</div>
			<?php endif; ?>

			<?php do_action( 'jetpack_notices' ); 
