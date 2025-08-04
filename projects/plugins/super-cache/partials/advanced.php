<div class="wpsc-settings-inner">
<?php
global $wp_cache_mod_rewrite, $wp_cache_mfunc_enabled, $wp_cache_mobile_enabled, $cache_enabled, $cache_path, $cache_time_interval, $cache_schedule_type;

$faq_url          = 'https://jetpack.com/support/wp-super-cache/wp-super-cache-faq/';
$kses_allow_links = array( 'a' => array( 'href' => array() ) ); // Arguments for wp_kses to allow links.

if ( isset( $wp_cache_front_page_checks ) == false ) {
	$wp_cache_front_page_checks = true;
}
echo '<div class="wpsc-card">';
echo '<form name="wp_manager" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) ) . '" method="post">';
wp_nonce_field( 'wp-cache' );
echo '<input type="hidden" name="action" value="scupdates" />';
?>
<table class="form-table">
<tr valign="top">
	<th scope="row"><label for="wp_cache_enabled"><?php _e( 'Caching', 'wp-super-cache' ); ?></label></th>
	<td>
		<fieldset>
		<legend class="hidden"><?php _e( 'Caching', 'wp-super-cache' ); ?></legend>
		<label><input type='checkbox' name='wp_cache_enabled' id='wp_cache_enabled' value='1' <?php checked( $cache_enabled, true ); ?>> <?php esc_html_e( 'Enable Caching', 'wp-super-cache' ); ?><br />
		</fieldset>
	</td>
</tr>
<tr valign="top">
	<th scope="row"><?php esc_html_e( 'Cache Delivery Method', 'wp-super-cache' ); ?></th>
	<td>
		<fieldset>
		<label><input type='radio' name='wp_cache_mod_rewrite' <?php if ( $wp_cache_mod_rewrite == 0 ) echo "checked"; ?> value='0'> <?php _e( '<acronym title="Use PHP to serve cached files">Simple</acronym>', 'wp-super-cache' ); echo " <em>(" . __( "Recommended", "wp-super-cache" ) . ")</em>"; ?></label><br />
		<label><input type='radio' name='wp_cache_mod_rewrite' <?php if ( $wp_cache_mod_rewrite == 1 ) echo "checked"; ?> value='1'> <?php _e( '<acronym title="Use mod_rewrite to serve cached files">Expert</acronym>', 'wp-super-cache' ); ?></label><br />
		<em><small class='description'><?php _e( 'Expert caching requires changes to important server files and may require manual intervention if enabled.', 'wp-super-cache' ); ?></small></em>
		<?php if ( $is_nginx ) { ?>
			<em><small class='description'>
				<?php
				echo wp_kses(
					sprintf(
						/* Translators: placeholder is a link to a support document. */
						__( 'Nginx rules can be found <a href="%s">here</a> but are not officially supported.', 'wp-super-cache' ),
						'https://wordpress.org/documentation/article/nginx/#wp-super-cache-rules'
					),
					array(
						'a' => array(
							'href' => array(),
						),
					)
				);
				?>
			</small></em>
		<?php } ?>
		</fieldset>
	</td>
</tr>
<tr valign="top">
	<th scope="row"><?php esc_html_e( 'Miscellaneous', 'wp-super-cache' ); ?></th>
	<td>
		<fieldset>
		<legend class="hidden">Miscellaneous</legend>
		<strong><?php echo __( 'Cache Restrictions', 'wp-super-cache' ); ?></strong><br />
		<label><input type='radio' name='wp_cache_not_logged_in' <?php checked( $wp_cache_not_logged_in, 0 ); ?> value='0'> <?php echo __( 'Enable caching for all visitors.', 'wp-super-cache' ); ?></label><br />
		<label><input type='radio' name='wp_cache_not_logged_in' <?php checked( $wp_cache_not_logged_in, 1 ); ?> value='1'> <?php echo __( 'Disable caching for visitors who have a cookie set in their browser.', 'wp-super-cache' ); ?></label><br />
		<label><input type='radio' name='wp_cache_not_logged_in' <?php checked( $wp_cache_not_logged_in, 2 ); ?> value='2'> <?php echo __( 'Disable caching for logged in visitors.', 'wp-super-cache' ) . ' <em>(' . esc_html__( 'Recommended', 'wp-super-cache' ) . ')</em>'; ?></label><br /><br />
		<label><input type='checkbox' name='wp_cache_no_cache_for_get' <?php checked( $wp_cache_no_cache_for_get ); ?> value='1'> <?php _e( 'Don&#8217;t cache pages with GET parameters. (?x=y at the end of a url)', 'wp-super-cache' ); ?></label><br />
		<?php if ( ! defined( 'WPSC_DISABLE_COMPRESSION' ) ) : ?>
			<?php if ( ! function_exists( 'gzencode' ) ) : ?>
				<em><?php esc_html_e( 'Warning! Compression is disabled as gzencode() function was not found.', 'wp-super-cache' ); ?></em><br />
			<?php else : ?>
				<label><input type='checkbox' name='cache_compression' <?php checked( $cache_compression ); ?> value='1'> <?php echo __( 'Compress pages so they&#8217;re served more quickly to visitors.', 'wp-super-cache' ) . ' <em>(' . esc_html__( 'Recommended', 'wp-super-cache' ) . ')</em>'; ?></label><br />
				<em><?php esc_html_e( 'Compression is disabled by default because some hosts have problems with compressed files. Switching it on and off clears the cache.', 'wp-super-cache' ); ?></em><br />
			<?php endif; ?>
		<?php endif; ?>
		<label><input type='checkbox' name='cache_rebuild_files' <?php checked( $cache_rebuild_files ); ?> value='1'> <?php echo esc_html__( 'Cache rebuild. Serve a supercache file to anonymous users while a new file is being generated.', 'wp-super-cache' ) . ' <em>(' . esc_html__( 'Recommended', 'wp-super-cache' ) . ')</em>'; ?></label><br />
		<?php if ( $wp_cache_mod_rewrite ) { ?>
			<br />
			<p><strong><?php esc_html_e( 'Warning! The following settings are disabled because Expert caching is enabled.', 'wp-super-cache' ); ?></strong></p>
			<br />
		<?php } ?>
		<label><input <?php disabled( $wp_cache_mod_rewrite ); ?> type='checkbox' name='wpsc_save_headers' <?php checked( $wpsc_save_headers ); ?> value='1' /> <?php esc_html_e( 'Cache HTTP headers with page content.', 'wp-super-cache' ); ?></label><br />
		<label><input <?php disabled( $wp_cache_mod_rewrite ); ?> type='checkbox' name='wp_supercache_304' <?php checked( $wp_supercache_304 ); ?> value='1'> <?php echo esc_html__( '304 Browser caching. Improves site performance by checking if the page has changed since the browser last requested it.', 'wp-super-cache' ) . ' <em>(' . esc_html__( 'Recommended', 'wp-super-cache' ) . ')</em>'; ?></label><br />
		<?php echo '<em>' . esc_html__( '304 support is disabled by default because some hosts have had problems with the headers used in the past.', 'wp-super-cache' ) . '</em><br />'; ?>
		<label><input <?php disabled( $wp_cache_mod_rewrite ); ?> type='checkbox' name='wp_cache_make_known_anon' <?php checked( $wp_cache_make_known_anon ); ?> value='1'> <?php _e( 'Make known users anonymous so they&#8217;re served supercached static files.', 'wp-super-cache' ); ?></label><br />
		</legend>
		</fieldset>
	</td>
</tr>
<tr valign="top">
	<th scope="row"><?php esc_html_e( 'Advanced', 'wp-super-cache' ); ?></th>
	<td>
		<fieldset>
		<legend class="hidden">Advanced</legend>

		<label>
			<input
				type='checkbox'
				name='wp_cache_mfunc_enabled'
				value='1'
				<?php disabled( $wp_cache_mod_rewrite ); ?>
				<?php checked( $wp_cache_mfunc_enabled ); ?>
			>
			<?php
				echo wp_kses(
					sprintf(
						/* translators: %s is the URL of the FAQ */
						__(
							'Enable dynamic caching. (See <a href="%s">FAQ</a> or wp-super-cache/plugins/dynamic-cache-test.php for example code.)',
							'wp-super-cache'
						),
						$faq_url
					),
					$kses_allow_links
				);
				?>
		</label>
		<br />

		<label>
			<input
				type='checkbox'
				name='wp_cache_mobile_enabled'
				value='1'
				<?php checked( $wp_cache_mobile_enabled ); ?>
			>
			<?php
				echo wp_kses(
					sprintf(
						/* translators: %s is the URL of the FAQ */
						__(
							'Mobile device support. (External plugin or theme required. See the <a href="https://jetpack.com/support/wp-super-cache/wp-super-cache-faq/">FAQ</a> for further details.)',
							'wp-super-cache'
						),
						$faq_url
					),
					$kses_allow_links
				);
				?>
		</label>
		<br />

<?php if ( $wp_cache_mobile_enabled ) {
echo '<blockquote><h5>' . __( 'Mobile Browsers', 'wp-super-cache' ) . '</h5>' . esc_html( $wp_cache_mobile_browsers ) . "<br /><h5>" . __( 'Mobile Prefixes', 'wp-super-cache' ) . "</h5>" . esc_html( $wp_cache_mobile_prefixes ) . "<br /></blockquote>";
			} ?>
		<label><input type='checkbox' name='wp_cache_disable_utf8' <?php if( $wp_cache_disable_utf8 ) echo "checked"; ?> value='1'> <?php _e( 'Remove UTF8/blog charset support from .htaccess file. Only necessary if you see odd characters or punctuation looks incorrect. Requires rewrite rules update.', 'wp-super-cache' ); ?></label><br />
		<label><input type='checkbox' name='wp_cache_clear_on_post_edit' <?php if( $wp_cache_clear_on_post_edit ) echo "checked"; ?> value='1'> <?php _e( 'Clear all cache files when a post or page is published or updated.', 'wp-super-cache' ); ?></label><br />
		<label><input type='checkbox' name='wp_cache_front_page_checks' <?php if( $wp_cache_front_page_checks ) echo "checked"; ?> value='1'> <?php _e( 'Extra homepage checks. (Very occasionally stops homepage caching)', 'wp-super-cache' ); ?></label><?php echo " <em>(" . __( "Recommended", "wp-super-cache" ) . ")</em>"; ?><br />
		<label><input type='checkbox' name='wp_cache_refresh_single_only' <?php if( $wp_cache_refresh_single_only ) echo "checked"; ?> value='1'> <?php _e( 'Only refresh current page when comments made.', 'wp-super-cache' ); ?></label><br />
		<label><input type='checkbox' name='wp_supercache_cache_list' <?php if( $wp_supercache_cache_list ) echo "checked"; ?> value='1'> <?php _e( 'List the newest cached pages on this page.', 'wp-super-cache' ); ?></label><br />
	<?php if( false == defined( 'WPSC_DISABLE_LOCKING' ) ) { ?>
		<label><input type='checkbox' name='wp_cache_mutex_disabled' <?php if( !$wp_cache_mutex_disabled ) echo "checked"; ?> value='0'> <?php _e( 'Coarse file locking. You do not need this as it will slow down your website.', 'wp-super-cache' ); ?></label><br />
	<?php } ?>
		<label><input type='checkbox' name='wp_super_cache_late_init' <?php if( $wp_super_cache_late_init ) echo "checked"; ?> value='1'> <?php _e( 'Late init. Display cached files after WordPress has loaded.', 'wp-super-cache' ); ?></label><br />
	<?php printf( __( '<strong>DO NOT CACHE PAGE</strong> secret key: <a href="%s">%s</a>', 'wp-super-cache' ), trailingslashit( get_bloginfo( 'url' ) ) . "?donotcachepage={$cache_page_secret}", $cache_page_secret ); ?>
		</fieldset>
	</td>
</tr>
<tr valign="top">
	<th scope="row"><label for="wp_cache_location"><?php _e( 'Cache Location', 'wp-super-cache' ); ?></label></th>
	<td>
		<fieldset>
			<legend class="hidden">Cache Location</legend>
			<input type='text' size=80 name='wp_cache_location' id='wp_cache_location' value='<?php echo esc_attr( $cache_path ); ?>' />
			<p><?php printf( __( 'Change the location of your cache files. The default is WP_CONTENT_DIR . /cache/ which translates to %s.', 'wp-super-cache' ), WP_CONTENT_DIR . '/cache/' ); ?></p>
			<ol>
				<li><?php _e( 'Warning: do not use a shared directory like /tmp/ where other users on this server can modify files. Your cache files could be modified to deface your website.', 'wp-super-cache' ); ?></li>
				<li><?php _e( 'You must give the full path to the directory.', 'wp-super-cache' ); ?></li>
				<li><?php _e( 'If the directory does not exist, it will be created. Please make sure your web server user has write access to the parent directory. The parent directory must exist.', 'wp-super-cache' ); ?></li>
				<li><?php _e( 'If the new cache directory does not exist, it will be created and the contents of the old cache directory will be moved there. Otherwise, the old cache directory will be left where it is.', 'wp-super-cache' ); ?></li>
				<li><?php _e( 'Submit a blank entry to set it to the default directory, WP_CONTENT_DIR . /cache/.', 'wp-super-cache' ); ?></li>
<?php
	if ( get_site_option( 'wp_super_cache_index_detected' ) && strlen( $cache_path ) > strlen( ABSPATH ) && ABSPATH == substr( $cache_path, 0, strlen( ABSPATH ) ) ) {
		$msg = __( 'The plugin detected a bare directory index in your cache directory, which would let visitors see your cache files directly and might expose private posts.', 'wp-super-cache' );
		if ( ! $is_nginx && $super_cache_enabled && $wp_cache_mod_rewrite == 1 ) {
			$msg .= ' ' . __( 'You are using expert mode to serve cache files so the plugin has added <q>Options -Indexes</q> to the .htaccess file in the cache directory to disable indexes. However, if that does not work, you should contact your system administrator or support and ask for them to be disabled, or use simple mode and move the cache outside of the web root.', 'wp-super-cache' );
		} else {
			$msg .= ' <strong>' . sprintf( __( 'index.html files have been added in key directories, but unless directory indexes are disabled, it is probably better to store the cache files outside of the web root of %s', 'wp-super-cache' ), ABSPATH ) . '</strong>';
		}
		echo "<li>$msg</li>";
	}
?>

<?php if ( $super_cache_enabled && $wp_cache_mod_rewrite == 1 ) { ?>
				<li><?php printf( __( 'Since you are using mod_rewrite to serve cache files, you must choose a directory in your web root which is <q>%s</q> and update the mod_rewrite rules in the .htaccess file.', 'wp-super-cache' ), ABSPATH ); ?></li>
<?php } ?>
			</ol>
		</fieldset>
	</td>
</tr>
</table>
<h4><?php esc_html_e( 'Note:', 'wp-super-cache' ); ?></h4>
<ol>
	<li><?php esc_html_e( 'Uninstall this plugin on the plugins page. It will automatically clean up after itself. If manual intervention is required, then simple instructions are provided.', 'wp-super-cache' ); ?></li>
	<li><?php printf( __( 'If uninstalling this plugin, make sure the directory <em>%s</em> is writeable by the webserver so the files <em>advanced-cache.php</em> and <em>cache-config.php</em> can be deleted automatically. (Making sure those files are writeable is probably a good idea!)', 'wp-super-cache' ), esc_attr( WP_CONTENT_DIR ) ); ?></li>
	<li><?php printf( __( 'Please see the <a href="%1$s/wp-super-cache/readme.txt">readme.txt</a> for instructions on uninstalling this script. Look for the heading, "How to uninstall WP Super Cache".', 'wp-super-cache' ), plugins_url() ); ?></li>
	<li>
		<em>
			<?php
				echo wp_kses(
					sprintf(
						/* translators: %1$s is the URL for the documentation, %2$s is a link to the support forums. */
						__(
							'Need help? Check out <a href="%1$s">the documentation</a>. It includes installation documentation, a FAQ, and Troubleshooting tips. The <a href="%2$s">support forum</a> is also available. Your question may already have been answered.',
							'wp-super-cache'
						),
						'https://jetpack.com/support/wp-super-cache/',
						'https://wordpress.org/support/plugin/wp-super-cache/'
					),
					$kses_allow_links
				);
				?>
		</em>
	</li>
	<li><?php _e( 'The location of the plugin configuration file can be changed by defining the WPCACHECONFIGPATH constant in wp-config.php. If not defined it will be set to WP_CONTENT_DIR.', 'wp-super-cache' ); ?></li>
</ol>

<?php
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . ' value="' . esc_html__( 'Update Status', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field( 'wp-cache' );
?>
</form>
</div>
<?php

if ( ! $GLOBALS['is_nginx'] && ! defined( 'WPSC_DISABLE_HTACCESS_UPDATE' ) && $GLOBALS['cache_enabled'] === true && $GLOBALS['wp_cache_mod_rewrite'] === 1 ) {
	?>
	<a name="modrewrite"></a><fieldset class="options">
	<h4><?php _e( 'Mod Rewrite Rules', 'wp-super-cache' ); ?></h4>
	<p><?php _e( 'When Expert cache delivery is enabled a file called <em>.htaccess</em> is modified. It should probably be in the same directory as your wp-config.php. This file has special rules that serve the cached files very quickly to visitors without ever executing PHP. The .htaccess file can be updated automatically, but if that fails, the rules will be displayed here and it can be edited by you. You will not need to update the rules unless a warning shows here.', 'wp-super-cache' ); ?></p>

	<?php
	extract( wpsc_get_htaccess_info() ); // $document_root, $apache_root, $home_path, $home_root, $home_root_lc, $inst_root, $wprules, $scrules, $condition_rules, $rules, $gziprules

	if ( strpos( $wprules, 'wordpressuser' ) ) { // Need to clear out old mod_rewrite rules
		echo "<p><strong>" . __( 'Thank you for upgrading.', 'wp-super-cache' ) . "</strong> " . sprintf( __( 'The mod_rewrite rules changed since you last installed this plugin. Unfortunately, you must remove the old supercache rules before the new ones are updated. Refresh this page when you have edited your .htaccess file. If you wish to manually upgrade, change the following line: %1$s so it looks like this: %2$s The only changes are "HTTP_COOKIE" becomes "HTTP:Cookie" and "wordpressuser" becomes "wordpress". This is a WordPress 2.5 change but it&#8217;s backwards compatible with older versions if you&#8217;re brave enough to use them.', 'wp-super-cache' ), '<blockquote><code>RewriteCond %{HTTP_COOKIE} !^.*wordpressuser.*$</code></blockquote>', '<blockquote><code>RewriteCond %{HTTP:Cookie} !^.*wordpress.*$</code></blockquote>' ) . "</p>";
	} else {

		global $valid_nonce;
		if ( ! isset( $_POST['updatehtaccess'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( $scrules == '' ) {
				wpsc_update_htaccess_form( 0 ); // don't hide the update htaccess form
			} else {
				wpsc_update_htaccess_form();
			}
		} elseif ( $valid_nonce && isset( $_POST[ 'updatehtaccess' ] ) ) {
			if ( add_mod_rewrite_rules() ) {
				echo "<h5>" . __( 'Mod Rewrite rules updated!', 'wp-super-cache' ) . "</h5>";
				echo "<p><strong>" . sprintf( __( '%s.htaccess has been updated with the necessary mod_rewrite rules. Please verify they are correct. They should look like this:', 'wp-super-cache' ), $home_path ) . "</strong></p>\n";
			} else {
				global $update_mod_rewrite_rules_error;
				echo "<h5>" . __( 'Mod Rewrite rules must be updated!', 'wp-super-cache' ) . "</h5>";
				echo "<p>" . sprintf( __( 'The plugin could not update %1$s.htaccess file: %2$s.<br /> The new rules go above the regular WordPress rules as shown in the code below:', 'wp-super-cache' ), $home_path, "<strong>" . $update_mod_rewrite_rules_error . "</strong>" ) . "</p>\n";
			}
			echo "<div style='overflow: auto; width: 800px; height: 400px; padding:0 8px;color:#4f8a10;background-color:#dff2bf;border:1px solid #4f8a10;'>";
			echo "<p><pre>" . esc_html( $rules ) . "</pre></p>\n</div>";
		} else {
			?>
			<p><?php printf( __( 'WP Super Cache mod rewrite rules were detected in your %s.htaccess file.<br /> Click the following link to see the lines added to that file. If you have upgraded the plugin, make sure these rules match.', 'wp-super-cache' ), $home_path ); ?></p>
			<?php
			if ( $rules != $scrules ) {
				?><p style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><?php _e( 'A difference between the rules in your .htaccess file and the plugin rewrite rules has been found. This could be simple whitespace differences, but you should compare the rules in the file with those below as soon as possible. Click the &#8217;Update Mod_Rewrite Rules&#8217; button to update the rules.', 'wp-super-cache' ); ?></p><?php
			}
			?><a href="javascript:toggleLayer('rewriterules');" class="button"><?php _e( 'View Mod_Rewrite Rules', 'wp-super-cache' ); ?></a><?php
			wpsc_update_htaccess_form();
			echo "<div id='rewriterules' style='display: none;'>";
			if ( $rules != $scrules )
				echo '<div style="background: #fff; border: 1px solid #333; margin: 2px;">' . wp_text_diff( $scrules, $rules, array( 'title' => __( 'Rewrite Rules', 'wp-super-cache' ), 'title_left' => __( 'Current Rules', 'wp-super-cache' ), 'title_right' => __( 'New Rules', 'wp-super-cache' ) ) ) . "</div>";
			echo "<p><pre># BEGIN WPSuperCache\n" . esc_html( $rules ) . "# END WPSuperCache</pre></p>\n";
			echo "<p>" . sprintf( __( 'Rules must be added to %s too:', 'wp-super-cache' ), WP_CONTENT_DIR . "/cache/.htaccess" ) . "</p>";
			echo "<pre># BEGIN supercache\n" . esc_html( $gziprules ) . "# END supercache</pre></p>";
			echo '</div>';
		}

	}
	?></fieldset><?php
}


$timezone_format = _x('Y-m-d G:i:s', 'timezone date format');

?>
<div class="wpsc-card">
<fieldset class="options">
<a name='expirytime'></a>
<h4><?php _e( 'Expiry Time &amp; Garbage Collection', 'wp-super-cache' ); ?></h4><?php

?><span id="utc-time"><?php printf( __( '<abbr title="Coordinated Universal Time">UTC</abbr> time is <code>%s</code>', 'wp-super-cache' ), date_i18n( $timezone_format, false, 'gmt' ) ); ?></span><?php
$current_offset = get_option('gmt_offset');
if ( get_option('timezone_string') || !empty($current_offset) ) {
	?><span id="local-time"><?php printf( __( 'Local time is <code>%1$s</code>', 'wp-super-cache' ), date_i18n( $timezone_format ) ); ?></span><?php
}
$next_gc = wp_next_scheduled( 'wp_cache_gc' );
if ( $next_gc )
	echo "<p>" . sprintf( __( 'Next scheduled garbage collection will be at <strong>%s UTC</strong>', 'wp-super-cache' ), date_i18n( $timezone_format, $next_gc, 'gmt' ) ) . "</p>";


if ( $wp_cache_preload_on )
	echo "<p>" . __( 'Warning! <strong>PRELOAD MODE</strong> activated. Supercache files will not be deleted regardless of age.', 'wp-super-cache' ) . "</p>";

echo "<script type='text/javascript'>";
echo "jQuery(function () {
	jQuery('#cache_interval_time').on('click',function () {
		jQuery('#schedule_interval').attr('checked', true);
	});
	jQuery('#cache_scheduled_time').on('click',function () {
		jQuery('#schedule_time').attr('checked', true);
	});
	jQuery('#cache_scheduled_select').on('click',function () {
		jQuery('#schedule_time').attr('checked', true);
	});
	});";
echo "</script>";
echo '<form name="wp_edit_max_time" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#expirytime' ) . '" method="post">';
echo '<input name="action" value="expirytime" type="hidden" />';
echo '<table class="form-table">';
echo '<tr><td><label for="wp_max_time"><strong>' . __( 'Cache Timeout', 'wp-super-cache' ) . '</strong></label></td>';
echo "<td><input type='text' id='wp_max_time' size=6 name='wp_max_time' value='" . esc_attr( $cache_max_time ) . "' /> " . __( "seconds", 'wp-super-cache' ) . "</td></tr>\n";
echo "<tr><td></td><td>" . __( 'How long should cached pages remain fresh? Set to 0 to disable garbage collection. A good starting point is 3600 seconds.', 'wp-super-cache' ) . "</td></tr>\n";
echo '<tr><td valign="top"><strong>' . esc_html__( 'Scheduler', 'wp-super-cache' ) . '</strong></td><td><table cellpadding=0 cellspacing=0><tr><td valign="top"><input type="radio" id="schedule_interval" name="cache_schedule_type" value="interval" ' . checked( 'interval', $cache_schedule_type, false ) . ' /></td><td valign="top"><label for="schedule_interval">' . esc_html__( 'Timer:', 'wp-super-cache' ) . '</label></td>';
echo "<td><input type='text' id='cache_interval_time' size=6 name='cache_time_interval' value='" . esc_attr( $cache_time_interval ) . "' /> " . esc_html__( 'seconds', 'wp-super-cache' ) . '<br />' . esc_html__( 'How often to check for stale cached files.', 'wp-super-cache' ) . '</td></tr>';
echo '<tr><td valign="top"><input type="radio" id="schedule_time" name="cache_schedule_type" value="time" ' . checked( 'time', $cache_schedule_type, false ) . ' /></td><td valign="top"><label for="schedule_time">' . __( 'Clock:', 'wp-super-cache' ) . '</label></td>';
echo "<td><input type=\"text\" size=5 id='cache_scheduled_time' name='cache_scheduled_time' value=\"" . esc_attr( $cache_scheduled_time ) . "\" /> " . __( "HH:MM", 'wp-super-cache' ) . "<br />" . __( 'Check for stale cached files at this time <strong>(UTC)</strong> or starting at this time every <em>interval</em> below.', 'wp-super-cache' ) . "</td></tr>";
$schedules = wp_get_schedules();
echo "<tr><td><br /></td><td><label for='cache_scheduled_select'>" . __( 'Interval:', 'wp-super-cache' ) . "</label></td><td><select id='cache_scheduled_select' name='cache_schedule_interval' size=1>";
foreach( $schedules as $desc => $details ) {
	echo "<option value='$desc' " . selected( $desc, $cache_schedule_interval, false ) . " /> {$details[ 'display' ]}</option>";
}
echo "</select></td></tr>";
echo '</table></td></tr>';
echo '<tr><td><label for="cache_gc_email_me"><strong>' . __( 'Notification Emails', 'wp-super-cache' ) . '</strong></label></td>';
echo "<td><input type='checkbox' id='cache_gc_email_me' name='cache_gc_email_me' " . checked( $cache_gc_email_me, 1, false ) . " /> " . __( 'Email me when the garbage collection runs.', 'wp-super-cache' ) . "</td></tr>\n";
echo "</table>\n";
echo "<h5>" . __( 'Garbage Collection', 'wp-super-cache' ) . "</h5>";
echo "<ol><li>" . __( '<em>Garbage collection</em> is the simple act of throwing out your garbage. For this plugin that would be old or <em>stale</em> cached files that may be out of date. New cached files are described as <em>fresh</em>.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Cached files are fresh for a limited length of time. You can set that time in the <em>Cache Timeout</em> text box on this page.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Stale cached files are not removed as soon as they become stale. They have to be removed by the garbage collecter. That is why you have to tell the plugin when the garbage collector should run.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Use the <em>Timer</em> or <em>Clock</em> schedulers to define when the garbage collector should run.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'The <em>Timer</em> scheduler tells the plugin to run the garbage collector at regular intervals. When one garbage collection is done, the next run is scheduled.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Or, the <em>Clock</em> scheduler allows the garbage collection to run at specific times. If set to run hourly or twice daily, the garbage collector will be first scheduled for the time you enter here. It will then run again at the indicated interval. If set to run daily, it will run once a day at the time specified.', 'wp-super-cache' ) . "</li>\n";
echo "</ol>";
echo "<p>" . __( 'There are no best garbage collection settings but here are a few scenarios. Garbage collection is separate to other actions that clear our cached files like leaving a comment or publishing a post.', 'wp-super-cache' ) . "</p>\n";
echo "<ol>";
echo "<li>" . __( 'Sites that want to serve lots of newly generated data should set the <em>Cache Timeout</em> to 60 and use the <em>Timer</em> scheduler set to 90 seconds.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Sites with widgets and rss feeds in their sidebar should probably use a timeout of 3600 seconds and set the timer to 600 seconds. Stale files will be caught within 10 minutes of going stale.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Sites with lots of static content, no widgets or rss feeds in their sidebar can use a timeout of 86400 seconds or even more and set the timer to something equally long.', 'wp-super-cache' ) . "</li>\n";
echo "<li>" . __( 'Sites where an external data source updates at a particular time every day should set the timeout to 86400 seconds and use the Clock scheduler set appropriately.', 'wp-super-cache' ) . "</li>\n";
echo "</ol>";
echo "<p>" . __( 'Checking for and deleting expired files is expensive, but it&#8217;s expensive leaving them there too. On a very busy site, you should set the expiry time to <em>600 seconds</em>. Experiment with different values and visit this page to see how many expired files remain at different times during the day.', 'wp-super-cache' ) . "</p>";
echo "<p>" . __( 'Set the expiry time to 0 seconds to disable garbage collection.', 'wp-super-cache' ) . "</p>";
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Change Expiration', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
?>
</fieldset>
</div>

<?php
// Accepted Filenames
echo '<div class="wpsc-card">';
echo '<a name="files"></a><fieldset class="options"><h4>' . __( 'Accepted Filenames &amp; Rejected URIs', 'wp-super-cache' ) . '</h4>';
echo '<a name="rejectpages"></a>';
echo '<p>' . __( 'Do not cache the following page types. See the <a href="https://codex.wordpress.org/Conditional_Tags">Conditional Tags</a> documentation for a complete discussion on each type.', 'wp-super-cache' ) . '</p>';
echo '<form name="wp_edit_rejected_pages" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#rejectpages' ) . '" method="post">';
echo '<input type="hidden" name="wp_edit_rejected_pages" value="1" />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[single]" ' . checked( 1, $wp_cache_pages[ 'single' ], false ) . ' /> ' . __( 'Single Posts', 'wp-super-cache' ) . ' (is_single)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[pages]" ' . checked( 1, $wp_cache_pages[ 'pages' ], false ) . ' /> ' . __( 'Pages', 'wp-super-cache' ) . ' (is_page)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[frontpage]" ' . checked( 1, $wp_cache_pages[ 'frontpage' ], false ) . ' /> ' . __( 'Front Page', 'wp-super-cache' ) . ' (is_front_page)</label><br />';
echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[home]" ' . checked( 1, $wp_cache_pages[ 'home' ], false ) . ' /> ' . __( 'Home', 'wp-super-cache' ) . ' (is_home)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[archives]" ' . checked( 1, $wp_cache_pages[ 'archives' ], false ) . ' /> ' . __( 'Archives', 'wp-super-cache' ) . ' (is_archive)</label><br />';
echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[tag]" ' . checked( 1, $wp_cache_pages[ 'tag' ], false ) . ' /> ' . __( 'Tags', 'wp-super-cache' ) . ' (is_tag)</label><br />';
echo '&nbsp;&nbsp;<label><input type="checkbox" value="1" name="wp_cache_pages[category]" ' . checked( 1, $wp_cache_pages[ 'category' ], false ) . ' /> ' . __( 'Category', 'wp-super-cache' ) . ' (is_category)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[feed]" ' . checked( 1, $wp_cache_pages[ 'feed' ], false ) . ' /> ' . __( 'Feeds', 'wp-super-cache' ) . ' (is_feed)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[search]" ' . checked( 1, $wp_cache_pages[ 'search' ], false ) . ' /> ' . __( 'Search Pages', 'wp-super-cache' ) . ' (is_search)</label><br />';
echo '<label><input type="checkbox" value="1" name="wp_cache_pages[author]" ' . checked( 1, $wp_cache_pages[ 'author' ], false ) . ' /> ' . __( 'Author Pages', 'wp-super-cache' ) . ' (is_author)</label><br />';

echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save Settings', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
echo '</div>';

// Rejected URL strings
echo '<div class="wpsc-card">';
echo '<a name="rejecturi"></a><fieldset class="options"><h4>' . __( 'Rejected URL Strings', 'wp-super-cache' ) . '</h4>';
echo '<form name="wp_edit_rejected" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#rejecturi' ) . '" method="post">';
echo "<p>" . __( 'Add here strings (not a filename) that forces a page not to be cached. For example, if your URLs include year and you dont want to cache last year posts, it&#8217;s enough to specify the year, i.e. &#8217;/2004/&#8217;. WP-Cache will search if that string is part of the URI and if so, it will not cache that page.', 'wp-super-cache' ) . "</p>\n";
echo '<textarea name="wp_rejected_uri" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
foreach( $cache_rejected_uri as $file ) {
	echo esc_html( $file ) . "\n";
}
echo '</textarea> ';
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save Strings', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field( 'wp-cache' );
echo "</form>\n";
echo '</div>';

// Rejected Cookies
echo '<div class="wpsc-card">';
echo '<a name="rejectcookies"></a><fieldset class="options"><h4>' . __( 'Rejected Cookies', 'wp-super-cache' ) . '</h4>';
echo '<form name="wp_edit_rejected_cookies" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#rejectcookies' ) . '" method="post">';
echo "<p>" . __( 'Do not cache pages when these cookies are set. Add the cookie names here, one per line. Matches on fragments, so "test" will match "WordPress_test_cookie". (Simple caching only)', 'wp-super-cache' ) . "</p>\n";
echo '<textarea name="wp_rejected_cookies" cols="40" rows="4" style="width: 50%; font-size: 12px;" class="code">';
foreach ( (array) $wpsc_rejected_cookies as $file) {
	echo esc_html( $file ) . "\n";
}
echo '</textarea> ';
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
echo '</div>';

// Always Cache Filenames
echo '<div class="wpsc-card">';
echo '<a name="cancache"></a><fieldset class="options"><h4>' . __( 'Always Cache Filenames', 'wp-super-cache' ) . '</h4>';
echo '<div style="clear:both"></div><form name="wp_edit_accepted" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#cancache' ) . '" method="post">';
echo "<p>" . __( 'Add here those filenames that can be cached, even if they match one of the rejected substring specified above.', 'wp-super-cache' ) . "</p>\n";
echo '<textarea name="wp_accepted_files" cols="40" rows="8" style="width: 50%; font-size: 12px;" class="code">';
foreach ($cache_acceptable_files as $file) {
	echo esc_html($file) . "\n";
}
echo '</textarea> ';
echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Save Files', 'wp-super-cache' ) . '" /></div>';
wp_nonce_field('wp-cache');
echo "</form>\n";
echo '</div>';

echo '</fieldset>';
echo '</div>';
