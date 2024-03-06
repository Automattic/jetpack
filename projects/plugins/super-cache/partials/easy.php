<div class="wpsc-settings-inner">
<?php
global $wpsc_promo_links;
echo '<div class="wpsc-card">';
echo '<form name="wp_manager" action="' . esc_url_raw( add_query_arg( 'tab', 'easy', $admin_url ) ) . '" method="post">';
echo '<input type="hidden" name="action" value="easysetup" />';
wp_nonce_field( 'wp-cache' );
?>
<table class="form-table">
	<tr valign="top">
	<th scope="row"><label for="wp_cache_status"><?php esc_html_e( 'Caching', 'wp-super-cache' ); ?></label></th>
	<td>
	<fieldset>
	<label><input type='radio' name='wp_cache_easy_on' value='1' <?php checked( $cache_enabled ); ?> ><?php echo esc_html__( 'Caching On', 'wp-super-cache' ) . ' <em>(' . esc_html__( 'Recommended', 'wp-super-cache' ) . ')</em>'; ?></label><br />
	<label><input type='radio' name='wp_cache_easy_on' value='0' <?php checked( ! $cache_enabled ); ?> ><?php esc_html_e( 'Caching Off', 'wp-super-cache' ); ?></label><br />
	</fieldset>
	</td>
	</tr>
</table>
<p><?php _e( 'The following recommended settings will be enabled:', 'wp-super-cache' ); ?></p>
<ol>
<li><?php _e( 'Caching disabled for logged in visitors.', 'wp-super-cache' ); ?></li>
<li><?php _e( 'Simple caching.', 'wp-super-cache' ); ?></li>
<li><?php _e( 'Cache Rebuild.', 'wp-super-cache' ); ?></li>
<li><?php _e( 'Interval garbage collection every 10 minutes with a cache lifetime of 30 minutes (if not configured already).', 'wp-super-cache' ); ?></li>
</ol>
<p><?php _e( 'These settings can be modified on the Advanced Settings page.', 'wp-super-cache' ); ?></p>
<?php
if ( ! $is_nginx && $cache_enabled && ! $wp_cache_mod_rewrite ) {
	$scrules = trim( implode( "\n", extract_from_markers( trailingslashit( get_home_path() ) . '.htaccess', 'WPSuperCache' ) ) );
	if ( ! empty( $scrules ) ) {
		echo '<p><strong>' . esc_html__( 'Notice: Simple caching enabled but Supercache mod_rewrite rules from expert mode detected. Cached files will be served using those rules. If your site is working ok, please ignore this message. Otherwise, you can edit the .htaccess file in the root of your install and remove the SuperCache rules.', 'wp-super-cache' ) . '</strong></p>';
	}
}
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . ' value="' . esc_html__( 'Update Status', 'wp-super-cache' ) . '" /></div></form>';
echo '</div>';
if ( $cache_enabled ) {
	echo '<div class="wpsc-card">';
	echo '<h4>' . esc_html__( 'Cache Tester', 'wp-super-cache' ) . '</h4>';
	echo '<p>' . esc_html__( 'Test your cached website by clicking the test button below.', 'wp-super-cache' ) . '</p>';
	echo '<p>' . __( 'Note: if you use Cloudflare or other transparent front-end proxy service this test may fail.<ol><li> If you have Cloudflare minification enabled this plugin may detect differences in the pages and report an error.</li><li> Try using the development mode of Cloudflare to perform the test. You can disable development mode afterwards if the test succeeds.</li></ol>', 'wp-super-cache' ) . '</p>';
	if ( array_key_exists( 'action', $_POST ) && 'test' === $_POST['action'] && $valid_nonce ) {
		$url = trailingslashit( get_bloginfo( 'url' ) );
		if ( isset( $_POST['httponly'] ) ) {
			$url = str_replace( 'https://', 'http://', $url );
		}
		$test_messages    = array( esc_html__( 'Fetching %s to prime cache: ', 'wp-super-cache' ), esc_html__( 'Fetching first copy of %s: ', 'wp-super-cache' ), esc_html__( 'Fetching second copy of %s: ', 'wp-super-cache' ) );
		$c                = 0;
		$cache_test_error = false;
		$page             = array();
		foreach ( $test_messages as $message ) {
			echo '<p>' . sprintf( $message, $url );
			$page[ $c ] = wp_remote_get( $url, array( 'timeout' => 60, 'blocking' => true ) );
			if ( ! is_wp_error( $page[ $c ] ) ) {
				$fp = fopen( $cache_path . $c . '.html', 'w' );
				fwrite( $fp, $page[ $c ]['body'] );
				fclose( $fp );
				echo '<span style="color: #0a0; font-weight: bold;">' . esc_html__( 'OK', 'wp-super-cache' ) . "</span> (<a href='" . esc_url_raw( WP_CONTENT_URL . '/cache/' . $c . '.html' ) . "'>" . $c . '.html</a>)</p>';
				sleep( 1 );
			} else {
				$cache_test_error = true;
				echo '<span style="color: #a00; font-weight: bold;">' . esc_html__( 'FAILED', 'wp-super-cache' ) . '</span></p>';
				$errors   = '';
				$messages = '';
				foreach ( $page[ $c ]->get_error_codes() as $code ) {
					$severity = $page[ $c ]->get_error_data( $code );
					foreach ( $page[ $c ]->get_error_messages( $code ) as $err ) {
						$errors .= $severity . ': ' . $err . "<br />\n";
					}
				}
				if ( ! empty( $errors ) ) {
					echo '<p>' . sprintf( __( '<strong>Errors:</strong> %s', 'wp-super-cache' ), $errors ) . '</p>';
				}
			}
			++$c;
		}

		if ( false == $cache_test_error ) {
			echo '<ul><li>' . sprintf( esc_html__( 'Page %d: %d (%s)', 'wp-super-cache' ), 1, intval( $page[1]['response']['code'] ), esc_attr( $page[1]['response']['message'] ) ) . '</li>';
			echo '<li>' . sprintf( esc_html__( 'Page %d: %d (%s)', 'wp-super-cache' ), 2, intval( $page[2]['response']['code'] ), esc_attr( $page[2]['response']['message'] ) ) . '</li></ul>';
		}

		if ( false == $cache_test_error && preg_match( '/(Cached page generated by WP-Super-Cache on) ([0-9]*-[0-9]*-[0-9]* [0-9]*:[0-9]*:[0-9]*)/', $page[1]['body'], $matches1 ) &&
				preg_match( '/(Cached page generated by WP-Super-Cache on) ([0-9]*-[0-9]*-[0-9]* [0-9]*:[0-9]*:[0-9]*)/', $page[2]['body'], $matches2 ) && $matches1[2] == $matches2[2]
		) {
			echo '<p>' . sprintf( esc_html__( 'Page 1: %s', 'wp-super-cache' ), $matches1[2] ) . '</p>';
			echo '<p>' . sprintf( esc_html__( 'Page 2: %s', 'wp-super-cache' ), $matches2[2] ) . '</p>';
			echo '<p><span style="color: #0a0; font-weight: bold;">' . esc_html__( 'The timestamps on both pages match!', 'wp-super-cache' ) . '</span></p>';
		} else {
			echo '<p><strong>' . esc_html__( 'The pages do not match! Timestamps differ or were not found!', 'wp-super-cache' ) . '</strong></p>';
			echo '<p>' . esc_html__( 'Things you can do:', 'wp-super-cache' ) . '</p>';
			echo '<ol><li>' . esc_html__( 'Load your homepage in a logged out browser, check the timestamp at the end of the html source. Load the page again and compare the timestamp. Caching is working if the timestamps match.', 'wp-super-cache' ) . '</li>';
			echo '<li>' . esc_html__( 'Enable logging on the Debug page here. That should help you track down the problem.', 'wp-super-cache' ) . '</li>';
			echo '<li>' . esc_html__( 'You should check Page 1 and Page 2 above for errors. Your local server configuration may not allow your website to access itself.', 'wp-super-cache' ) . '</li>';
			echo '</ol>';
		}
	}
	echo '<form name="cache_tester" action="' . esc_url_raw( add_query_arg( 'tab', 'easy', $admin_url ) ) . '" method="post">';
	echo '<input type="hidden" name="action" value="test" />';
	if ( ! empty( $_SERVER['HTTPS'] ) && 'on' === strtolower( $_SERVER['HTTPS'] ) ) {
		echo '<input type="checkbox" name="httponly" checked="checked" value="1" /> ' . esc_html__( 'Send non-secure (non https) request for homepage', 'wp-super-cache' );
	}

	if ( isset( $wp_super_cache_comments ) && $wp_super_cache_comments == 0 ) {
		echo '<p>' . __( '<strong>Warning!</strong> Cache comments are currently disabled. Please go to the Debug page and enable Cache Status Messages there. You should clear the cache before testing.', 'wp-super-cache' ) . '</p>';
		echo '<div class="submit"><input disabled style="color: #aaa" class="button-secondary" type="submit" name="test" value="' . esc_html__( 'Test Cache', 'wp-super-cache' ) . '" /></div>';
	} else {
		echo '<div class="submit"><input class="button-secondary" type="submit" name="test" value="' . __( 'Test Cache', 'wp-super-cache' ) . '" /></div>';
	}

	wp_nonce_field( 'wp-cache' );
	echo '</form>';
	echo '</div>';
}
echo '<div class="wpsc-card">';
echo '<h4>' . esc_html__( 'Delete Cached Pages', 'wp-super-cache' ) . '</h4>';
echo '<p>' . esc_html__( 'Cached pages are stored on your server as html and PHP files. If you need to delete them, use the button below.', 'wp-super-cache' ) . '</p>';
echo '<form name="wp_cache_content_delete" action="' . esc_url_raw( add_query_arg( 'tab', 'contents', $admin_url ) ) . '" method="post">';
echo '<input type="hidden" name="wp_delete_cache" />';
echo '<div class="submit"><input id="deletepost" class="button-secondary" type="submit" ' . SUBMITDISABLED . 'value="' . esc_html__( 'Delete Cache', 'wp-super-cache' ) . ' " /></div>';
wp_nonce_field( 'wp-cache' );
echo "</form>\n";
echo '</div>';

if ( is_multisite() && wpsupercache_site_admin() ) {
	echo '<div class="wpsc-card">';
	echo '<form name="wp_cache_content_delete" action="' . esc_url_raw( add_query_arg( 'tab', 'contents', $admin_url ) . '#listfiles' ) . '" method="post">';
	echo '<input type="hidden" name="wp_delete_all_cache" />';
	echo '<div class="submit"><input id="deleteallpost" class="button-secondary" type="submit" ' . SUBMITDISABLED . 'value="' . esc_html__( 'Delete Cache On All Blogs', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field( 'wp-cache' );
	echo "</form><br />\n";
	echo '</div>';
}
?>
<div class="wpsc-card">
<h4 class="clear"><?php esc_html_e( 'Recommended Links and Plugins', 'wp-super-cache' ); ?></h4>
<p><?php esc_html_e( 'Caching is only one part of making a website faster. Here are some other plugins that will help:', 'wp-super-cache' ); ?></p>

<ul style="list-style: square; margin-left: 2em;">
	<li>
		<?php
			echo \wp_kses(
				\sprintf(
					/* translators: %s: Link URL for Jetpack Boost. */
					__( '<a href="%s">Jetpack Boost</a> helps speed up your website by generating critical CSS, defering Javascript and much more.', 'wp-super-cache' ),
					$wpsc_promo_links['boost']
				),
				'a'
			);
			?>
	</li>

	<li>
		<?php
		printf(
			/* translators: %s: HTML Link to Jetpack website. */
			esc_html__( '%s provides everything you need to build a successful WordPress website including an image/photo CDN (free) and a video hosting service (paid).', 'wp-super-cache' ),
			'<a href="' . esc_url( $wpsc_promo_links['jetpack'] ) . '">Jetpack</a>'
		);
		?>
	</li>

<?php // translators: this is a html link to the GTMetrix website. ?>
<li><?php printf( esc_html__( 'See how your site performs by doing a %s analysis of it.', 'wp-super-cache' ), '<a href="https://gtmetrix.com/">GTMetrix</a>' ); ?></li>
<?php // translators: this is a html link to the Memcached plugin. ?>
<li><?php printf( esc_html__( 'Advanced users only: Install an object cache like %s.', 'wp-super-cache' ), '<a href="https://wordpress.org/plugins/memcached/">Memcached</a>' ); ?></li>
<li><?php printf( __( '<a href="%s">WP Crontrol</a> is a useful plugin to use when trying to debug garbage collection and preload problems.', 'wp-super-cache' ), 'https://wordpress.org/plugins/wp-crontrol/' ); ?></li>
</ul>
<p><?php esc_html_e( "* The links above (apart from Jetpack and Jetpack Boost) go to websites outside the author's control. Caution is advised when testing any new software.", 'wp-super-cache' ); ?></p>
</div>
</div>
