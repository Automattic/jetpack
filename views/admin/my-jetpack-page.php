<div class="clouds-sm"></div>

<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<div id="my-jetpack-page-template"></div>

	<script id="tmpl-connection-page" type="text/html">
		<div class="content-container">
			<div id="my-jetpack-content" class="content">
				<h2><?php _e( 'Jetpack Connection Status', 'jetpack' ); ?></h2>

				<?php
				/*
				 * Special row if there is only one admin on the site
				 */
				?>
				<# if ( ! data.showPrimaryUserRow && data.currentUser.isMasterUser ) { #>
					<div class="connection-details local-user j-row">
						<?php // left col ?>
						<div class="j-col j-lrg-6 j-md-6 j-sm-12 jp-user">
							<h3 title="<?php esc_attr_e( 'Username', 'jetpack' ); ?>"><?php _e( 'Site Username', 'jetpack' ); ?></h3>
							<div class="user-01">
								{{{ data.currentUser.userGrav }}} {{{ data.currentUser.adminUsername }}}
							</div>
						</div>

						<?php // right col ?>
						<div class="j-col j-lrg-6 j-md-6 j-sm-12 wp-user">
							<h3 title="<?php esc_attr_e( 'WordPress.com Username', 'jetpack' ); ?>"><?php _e( 'WordPress.com Username', 'jetpack' ); ?></h3>
							<div class="wpuser-02">
								{{{ data.currentUser.userComData.login }}}
							</div>
						</div>
					</div>
				<# } #>

				<?php
				/*
				 * Local user row: Shown to all users,
				 * unless the current user is the master
				 */
				?>
				<# if ( ! data.currentUser.isMasterUser || ( ! data.currentUser.isMasterUser && data.isMasterHere ) ) { #>
					<div class="connection-details local-user j-row">
						<?php // left col ?>
						<div class="j-col j-lrg-4 j-md-6 j-sm-12 jp-user">
							<h3 title="<?php esc_attr_e( 'Username', 'jetpack' ); ?>"><?php _e( 'Site Username', 'jetpack' ); ?></h3>
							<div class="user-01">
								{{{ data.currentUser.gravatar }}} {{{ data.currentUser.adminUsername }}}
							</div>
						</div>

						<?php // middle col ?>
						<div class="j-col j-lrg-4 j-md-6 j-sm-12 wp-user">
							<h3 title="<?php esc_attr_e( 'WordPress.com Username', 'jetpack' ); ?>"><?php _e( 'WordPress.com Username', 'jetpack' ); ?></h3>
							<div class="wpuser-02">
								<# if ( data.currentUser.isUserConnected ) { #>
									{{{ data.currentUser.userComData.login }}}
								<# } else { #>
									<span><em><?php _e( 'Not connected', 'jetpack' ); ?></em></span>
								<# } #>
							</div> 
						</div>

						<?php // right col ( Link/Unlink my account ) ?>
						<div class="j-col j-lrg-4 j-md-12 j-sm-12 wp-action">
							<h3 title="<?php esc_attr_e( 'Account Actions', 'jetpack' ); ?>"><?php _e( 'Account Actions', 'jetpack' ); ?></h3>
							<div class="action-btns">
								<# if ( data.currentUser.isUserConnected ) { #>
									<a class="button" title="<?php esc_attr_e( 'Disconnect your WordPress.com account from Jetpack', 'jetpack' ); ?>" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><?php esc_html_e( 'Unlink my account ', 'jetpack' ); ?></a>
								<# } else { #>
									<a class="button button-primary" href="<?php echo Jetpack::init()->build_connect_url() ?>" ><?php esc_html_e( 'Link your account', 'jetpack' ); ?></a>
								<# } #>
							</div>
						</div>
					</div>
				<# } #><?php // End if not master user ?>

				<?php
				/*
				 * Master user row & Disconnect button
				 * Only shown to admins.
				 * Only shown if there are other as well, because if there aren't it's obvious who is primary.
				 */
				?>
				<# if ( data.showPrimaryUserRow && data.isMasterHere ) { #>
					<div class="connection-details master-user j-row">
						<?php // Master User Row, Left col ?>
						<div class="j-col j-lrg-4 j-md-6 j-sm-12 jp-user">
							<h3 title="<?php esc_attr_e( 'Primary User', 'jetpack' ); ?>"><?php _e( 'Primary User', 'jetpack' ); ?></h3>
							<div class="user-01">
								{{{ data.masterUser.gravatar }}} {{{ data.masterUser.masterUser.data.user_login }}}
							</div>
						</div>

						<?php // middle col ?>
						<div class="j-col j-lrg-4 j-md-6 j-sm-12 wp-user">
							<h3 title="<?php esc_attr_e( 'WordPress.com Username', 'jetpack' ); ?>"><?php _e( 'WordPress.com Username', 'jetpack' ); ?></h3>
							<div class="wpuser-02">
								<span>{{{ data.masterUser.masterDataCom.login }}}</span>
							</div> 
						</div>

						<?php // right col ( Change primary user ) ?>
						<div class="j-col j-lrg-4 j-md-12 j-sm-12 wp-action">
							<h3 title="<?php esc_attr_e( 'Account Actions', 'jetpack' ); ?>"><?php _e( 'Change Primary User', 'jetpack' ); ?></h3>
							<div class="action-btns">
								<a class="button" title="<?php esc_attr_e( 'Change the primary account holder', 'jetpack' ); ?>" id="change-primary-btn"><?php esc_html_e( 'Change Primary', 'jetpack' ); ?></a>

								<form action="" method="post">
									<select name="jetpack-new-master" id="user-list">
										<?php
										$all_users = get_users();
										foreach ( $all_users as $user ) {
											if ( $user->ID != Jetpack_Options::get_option( 'master_user' ) && Jetpack::is_user_connected( $user->ID ) && $user->caps['administrator'] ) {
												echo "<option value='{$user->ID}'>$user->display_name</option>";
											}
										}
										?>
									</select>
									<?php wp_nonce_field( 'jetpack_change_primary_user', '_my_jetpack_nonce' ); ?>
									<input type="submit" name="jetpack-set-master-user" id="save-primary-btn" class="button button-primary" value="Save" title="<?php esc_attr_e( 'Set the primary account holder', 'jetpack' ); ?>"/>
								</form>
							</div>
						</div>
					</div>
				<# } #><?php // End if show primary ?>
			</div><?php // my-jetpack-content ?>

			<?php // Disconnect Site Button ?>
			<?php if ( current_user_can( 'jetpack_configure_modules' ) ) : ?>
				<div class="j-row disconnect">
					<div class="j-col j-lrg-12 j-md-12 j-sm-12">
						<a class="button" id="jetpack-disconnect" href="#"><?php esc_html_e( 'Disconnect site from WordPress.com', 'jetpack' ); ?></a>
					</div>
				</div>

				<div id="jetpack-disconnect-content">
					<h2><?php _e( 'Disconnecting Jetpack', 'jetpack' ); ?></h2>
					<p><?php _e( 'Before you completely disconnect Jetpack is there anything we can do to help?', 'jetpack' ); ?></p>
					<a class="button" title="<?php esc_attr_e( 'Disconnect Jetpack', 'jetpack' ); ?>" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>">Confirm Disconnect</a>
					<a class="button primary" target="_blank" title="<?php esc_attr_e( 'Jetpack Support', 'jetpack' ); ?>" href="http://jetpack.me/contact-support/"><?php esc_html_e( 'I Need Support', 'jetpack' ); ?></a>
				</div>
			<?php endif;?>
		</div><?php // div.content-container ?>
	</script>
</div><?php // div.page-content ?>

<style>
	#user-list, #save-primary-btn {
		display: none;
	}
</style>
