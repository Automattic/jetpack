<div class="clouds-sm"></div>

<<<<<<< HEAD
	<style>
	#jetpack-disconnect-content {
		display: none;
	}

	#my-connection-page-template {
		/*max-width: 500px;*/
	}
	.connection-details {
		border: 1px #ddd solid;
	}

	.connection-details .jp-user div,
	.connection-details .wp-user div {
		display: inline-block;
		width: 100%;
	}

	.connection-details .j-col.jp-user, 
	.connection-details .j-col.wp-user {
		padding: 0;
	}

	.jp-user {
		border-right: 1px #ddd solid;
	}

	.user-01, .wpuser-02 {
		padding: 12px;
	}

	.connection-details .disconnect {
		border-top: 1px #ddd solid;
	}

	.j-actions .button:nth-child(3) {
		margin-right: 5px;
	}

	.connection-details h3 {
		padding: 10px;
		margin: 0;
		background: #eee;
		border-bottom: 1px #ddd solid;
		font-size: 14px;
	}

		@media (max-width: 500px) {
			.connection-details {
				font-size: 11px;
			}
			.connection-details h3 {
				font-size: 12px;
				padding: 5px;
			}
			.user-01, .wpuser-02 {
				padding: 6px;
			}
		}

		@media (max-width: 450px) {
			.j-actions .button {
				width: 100%;
				margin-bottom: 5px;
				text-align: center;
			}
			.j-actions .button.alignright {
				float: none;
			}
		}
	</style>

=======
>>>>>>> 8b7016b... moving css into scss partial
<div class="page-content landing">
	<?php Jetpack::init()->load_view( 'admin/network-activated-notice.php' ); ?>

	<?php do_action( 'jetpack_notices' ) ?>

	<?php if ( Jetpack::is_active() ) : ?>
		<div id="my-connection-page-template"></div>

		<script id="tmpl-connection-page" type="text/html">
			<div class="content-container <# if ( data.available) { #>modal-footer<# } #>">

				<div id="my-connection-content" class="content">
					<h2><?php _e( 'Jetpack Connection Status' ); ?></h2>

					<div class="connection-details local-user">
						<?php
						/*
						 * Local user row: Shown to all users
						 */
						?>
						<div class="j-row">

							<!-- left col -->
							<div class="j-col j-lrg-4 j-md-6 j-sm-6 jp-user">
								<h3 title="<?php _e( 'Username', 'jetpack' ); ?>"><?php _e( 'Site Username', 'jetpack' ); ?></h3>
								<div class="user-01">
									{{{ data.userGrav }}} {{{ data.connectionLogic.adminUsername }}}
								</div>
							</div>

							<!-- middle col -->
							<div class="j-col j-lrg-4 j-md-6 j-sm-6 wp-user">
								<h3 title="<?php _e( 'WordPress.com Username', 'jetpack' ); ?>"><?php _e( 'WordPress.com Username', 'jetpack' ); ?></h3>
								<div class="wpuser-02">
									<# if ( data.connectionLogic.isUserConnected ) { #>
										{{{ data.userComData.login }}}
									<# } else { #>
										<a class="button button-primary" href="<?php echo Jetpack::init()->build_connect_url() ?>" ><?php esc_html_e( 'Link your account', 'jetpack' ); ?></a>
									<# } #>
								</div> 
							</div>

							<!-- right col ( Link/Unlink my account ) -->
							<div class="j-col j-lrg-4 j-md-12 j-sm-12 wp-action">
								<h3 title="<?php _e( 'Account Actions', 'jetpack' ); ?>"><?php _e( 'Account Actions', 'jetpack' ); ?></h3>
								<div class="action-btns">
									<# if ( data.connectionLogic.isUserConnected ) { #>
										<a class="button" title="Disconnect your WordPress.com account from Jetpack" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"><?php esc_html_e( 'Unlink my account ', 'jetpack' ); ?></a>
									<# } #>
										<a class="button alignright" id="jetpack-disconnect" title="Disconnect Jetpack"><?php esc_html_e( 'Disconnect Jetpack', 'jetpack' ); ?></a>
										<# if ( !data.connectionLogic.isMasterUser && data.connectionLogic.isUserConnected ) { #>
											<a class="button alignright" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=unlink' ), 'jetpack-unlink' ); ?>"  title="Disconnect your WordPress.com account from Jetpack" onclick="return confirm('<?php echo htmlspecialchars( __( 'Are you sure you want to disconnect your WordPress.com account?', 'jetpack' ), ENT_QUOTES ); ?>');" ><?php esc_html_e( 'Unlink my account ', 'jetpack' ); ?></a>
											<# } #>
							</div>
						</div><?php // j-row ?>
						</div>
						</div><?php // connection details ?>

						<div class="connection-details master-user">
						<?php
						/*
						 * Master user row & Disconnect button
						 * Only shown to admins.
						 */
						?>
						<# if ( data.showPrimaryUserRow ) { #>
							<?php // Master User Row ?>
							<div class="j-row">

								<!-- left col -->
								<div class="j-col j-lrg-4 j-md-6 j-sm-6 jp-user">
									<h3 title="<?php _e( 'Primary User', 'jetpack' ); ?>"><?php _e( 'Primary User', 'jetpack' ); ?></h3>
									<div class="user-01">
										{{{ data.masterUserGrav }}} {{{ data.connectionLogic.masterUserLink }}}
									</div>
								</div>

								<!-- middle col -->
								<div class="j-col j-lrg-4 j-md-6 j-sm-6 wp-user">
									<h3 title="<?php _e( 'WordPress.com Username', 'jetpack' ); ?>"><?php _e( 'WordPress.com Username', 'jetpack' ); ?></h3>
									<div class="wpuser-02">
										<span>{{{ data.masterComData.login }}}</span>
									</div> 
								</div>

								<!-- right col ( Change primary user ) -->
								<div class="j-col j-lrg-4 j-md-12 j-sm-12 wp-action">
									<h3 title="<?php _e( 'Account Actions', 'jetpack' ); ?>"><?php _e( 'Change Primary User', 'jetpack' ); ?></h3>
									<div class="action-btns">
										<a class="button" title="Change the primary account holder" id="change-primary-btn"><?php esc_html_e( 'Change Primary', 'jetpack' ); ?></a>

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
											<?php wp_nonce_field( 'jetpack_change_primary_user', '_my_connect_nonce' ); ?>
											<input type="submit" name="jetpack-set-master-user" id="save-primary-btn" class="button button-primary" value="Save" title="Set the primary account holder"/>
										</form>
									</div>
								</div>
							</div>
					</div>
				</div>

				<?php // Disconnect Site Button ?>
					<div class="j-row disconnect">
						<div class="j-col j-lrg-12 j-md-12 j-sm-12">
							<a class="button" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>" onclick="return confirm('<?php echo htmlspecialchars( __( 'Are you sure you want to disconnect from WordPress.com?', 'jetpack' ), ENT_QUOTES ); ?>');"><?php esc_html_e( 'Disconnect site from WordPress.com', 'jetpack' ); ?></a>
						</div>
					</div>
				<# } #><?php /* end if admin */ ?>

				<div id="jetpack-disconnect-content">
					<h2>Disconnecting Jetpack</h2>
					<p>Before you completely disconnect Jetpack is there anything we can do to help?</p>
					<a class="button" title="Disconnect Jetpack" href="<?php echo wp_nonce_url( Jetpack::admin_url( 'action=disconnect' ), 'jetpack-disconnect' ); ?>">Confirm Disconnect</a>
					<a class="button primary" target="_blank" title="Jetpack Support" href="http://jetpack.me/contact-support/">I Need Support</a>
				</div>
			</div>

		</script>

		<script id="tmpl-connection-page-loading" type="text/html">
			<p>Loading...</p>
		</script>

<?php else : ?>
	<div class="wpcom-connect">
		<h1 title="Boost traffic, enhance security, and improve performance."><?php esc_html_e( 'Boost traffic, enhance security, and improve performance.', 'jetpack' ); ?></h1>
		<div class="j-row">
			<div class="j-col j-sm-12 j-md-8 j-lrg-7 connect-desc">
				<p><?php _e('Jetpack connects your site to WordPress.com to give you traffic and customization tools, enhanced security, speed boosts, and more.', 'jetpack' ); ?></p>
				<p><?php _e('To start using Jetpack, connect to your WordPress.com account by clicking the button (if you don’t have an account you can create one quickly and for free).', 'jetpack' ); ?></p>
			</div>
			<div class="j-col j-sm-12 j-md-4 j-lrg-5 connect-btn">
				<?php if ( ! $data['is_connected'] && current_user_can( 'jetpack_connect' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Connect to WordPress.com', 'jetpack' ); ?></a>
				<?php elseif ( $data['is_connected'] && ! $data['is_user_connected'] && current_user_can( 'jetpack_connect_user' ) ) : ?>
					<a href="<?php echo Jetpack::init()->build_connect_url() ?>" class="download-jetpack"><?php esc_html_e( 'Link your account to WordPress.com', 'jetpack' ); ?></a>
				<?php endif; ?>
			</div>
		</div>
	</div>
<?php endif; ?>