<?php

function wp_supercache_badbehaviour( $file ) {
	global $cache_badbehaviour;

	if ( 1 !== $cache_badbehaviour ) {
		return $file;
	}
	wp_supercache_badbehaviour_include();
	return $file;
}
add_cacheaction( 'wp_cache_served_cache_file', 'wp_supercache_badbehaviour' );

function wp_supercache_badbehaviour_include() {
	$bbfile = get_bb_file_loc();
	if ( ! $bbfile ) {
		require_once $bbfile;
	}
}

function get_bb_file_loc() {
	global $cache_badbehaviour_file;
	if ( $cache_badbehaviour_file ) {
		return $cache_badbehaviour_file;
	}

	if ( file_exists( WP_CONTENT_DIR . '/plugins/bad-behavior/bad-behavior-generic.php' ) ) {
		$bbfile = WP_CONTENT_DIR . '/plugins/bad-behavior/bad-behavior-generic.php';
	} elseif ( file_exists( WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php' ) ) {
		$bbfile = WP_CONTENT_DIR . '/plugins/Bad-Behavior/bad-behavior-generic.php';
	} else {
		$bbfile = false;
	}
	return $bbfile;
}

function wp_supercache_badbehaviour_admin() {
	global $cache_badbehaviour, $wp_cache_config_file, $valid_nonce;

	$cache_badbehaviour = '' === $cache_badbehaviour ? 0 : $cache_badbehaviour;
	if ( 'no' === $cache_badbehaviour ) {
		$cache_badbehaviour = 0;
	}

	$err = false;

	// Nonce has been verified before this method is called.
	// phpcs:disable WordPress.Security.NonceVerification.Missing

	if ( isset( $_POST['cache_badbehaviour'] ) && $valid_nonce ) {
		$bbfile = get_bb_file_loc();
		if ( ! $bbfile ) {
			$_POST['cache_badbehaviour'] = 0;
			$err                         = __( 'Bad Behaviour not found. Please check your install.', 'wp-super-cache' );
		}
		if ( $cache_badbehaviour === (int) $_POST['cache_badbehaviour'] ) {
			$changed = false;
		} else {
			$changed = true;
		}
		$cache_badbehaviour = (int) $_POST['cache_badbehaviour'];
		wp_cache_replace_line( '^ *\$cache_compression', '$cache_compression = 0;', $wp_cache_config_file );
		wp_cache_replace_line( '^ *\$cache_badbehaviour', "\$cache_badbehaviour = $cache_badbehaviour;", $wp_cache_config_file );
		wp_cache_replace_line( '^ *\$cache_badbehaviour_file', "\$cache_badbehaviour_file = '$bbfile';", $wp_cache_config_file );
		$changed = true;
	}
	$id = 'badbehavior-section';
	?>
		<fieldset id="<?php echo esc_attr( $id ); ?>" class="options">
			<h4><?php esc_html_e( 'Bad Behavior', 'wp-super-cache' ); ?></h4>
			<form name="wp_manager" action="" method="post">
				<label>
					<input type="radio" name="cache_badbehaviour" value="1" 
						<?php
						if ( $cache_badbehaviour ) {
							echo 'checked="checked" ';
						}
						?>
					/>
					<?php esc_html_e( 'Enabled', 'wp-super-cache' ); ?>
				</label>
				<label>
					<input type="radio" name="cache_badbehaviour" value="0"
						<?php
						if ( ! $cache_badbehaviour ) {
							echo 'checked="checked" ';
						}
						?>
					/>
						<?php esc_html_e( 'Disabled', 'wp-super-cache' ); ?>
				</label>

				<p>
					<?php
						echo wp_kses(
							sprintf(
								/* translators: %s: URL to Bad Behavior plugin page. */
								__( '(Only WPCache caching supported, disabled compression and requires <a href="http://www.bad-behavior.ioerror.us/">Bad Behavior</a> in "%s/plugins/bad-behavior/") ', 'wp-super-cache' ),
								WP_CONTENT_DIR
							),
							array(
								'a' => array(
									'href' => array(),
								),
							)
						);
					?>
				</p>

				<?php
				if ( isset( $changed ) && $changed ) {
					if ( $cache_badbehaviour ) {
						$status = __( 'enabled', 'wp-super-cache' );
					} else {
						$status = __( 'disabled', 'wp-super-cache' );
					}

					?>
						<p>
							<strong>
								<?php
								// TODO: This kind of sentence construction is not appropriate for translation.
								// translators: %s refers to the status of the Bad Behaviour module.
								esc_html( sprintf( __( 'Bad Behavior support is now %s', 'wp-super-cache' ), $status ) );
								?>
							</strong>
						</p>
					<?php
				}
				?>

				<div class="submit">
					<input class="button-primary" <?php echo wp_kses( SUBMITDISABLED, array() ); ?> type="submit" value="<?php echo esc_attr( __( 'Update', 'wp-super-cache' ) ); ?>" />
				</div>

				<?php
					wp_nonce_field( 'wp-cache' );
				?>
			</form>
		</fieldset>
	<?php

	if ( $err ) {
		?>
			<p>
				<strong>
					<?php esc_html_e( 'Warning!', 'wp-super-cache' ); ?>
				</strong>
				<?php echo esc_html( $err ); ?>
			</p>
		<?php
	}

	// phpcs:enable WordPress.Security.NonceVerification.Missing

}
add_cacheaction( 'cache_admin_page', 'wp_supercache_badbehaviour_admin' );

function wpsc_badbehaviour_list( $list ) {
	$list['badbehaviour'] = array(
		'key'   => 'badbehaviour',
		'url'   => 'http://www.bad-behavior.ioerror.us/',
		'title' => __( 'Bad Behavior', 'wp-super-cache' ),
		/* translators: %s: URL to Bad Behavior plugin page. */
		'desc'  => sprintf( __( 'Support for Bad Behavior. (Only WPCache caching supported, disabled compression and requires Bad Behavior in "%s/plugins/bad-behavior/") ', 'wp-super-cache' ), WP_CONTENT_DIR ),
	);
	return $list;
}
add_cacheaction( 'wpsc_filter_list', 'wpsc_badbehaviour_list' );
