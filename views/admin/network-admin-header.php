	<div class="wrap" id="jetpack-settings">

			<div id="jp-header"<?php if ( $data['is_connected'] ) : ?> class="small"<?php endif; ?>>
				<div id="jp-clouds">
					<h3><?php _e( 'Jetpack by WordPress.com', 'jetpack' ) ?></h3>
				</div>
			</div>

			<h2 style="display: none"></h2> <!-- For WP JS message relocation -->

			<?php 
				Jetpack::init()->load_view( 'admin/network-activated-notice.php' );
				do_action( 'jetpack_notices' ); 
