<?php

/* Taken from OSSDL CDN off-linker, a plugin by W-Mark Kubacki (http://mark.ossdl.de/) and used with permission */

/* Set up some defaults */
if ( get_option( 'ossdl_off_cdn_url' ) == false )
	add_option('ossdl_off_cdn_url', get_option('siteurl'));
$ossdl_off_blog_url = get_option('siteurl');
$ossdl_off_cdn_url = trim( get_option('ossdl_off_cdn_url') );
if ( get_option( 'ossdl_off_include_dirs' ) == false )
	add_option('ossdl_off_include_dirs', 'wp-content,wp-includes');
$ossdl_off_include_dirs = trim(get_option('ossdl_off_include_dirs'));
if ( get_option( 'ossdl_off_exclude' ) == false )
	add_option('ossdl_off_exclude', '.php');
$ossdl_off_exclude = trim(get_option('ossdl_off_exclude'));
$arr_of_excludes = array_map('trim', explode(',', $ossdl_off_exclude));
if ( !is_array( $arr_of_excludes ) )
	$arr_of_excludes = array();

if ( get_option( 'ossdl_cname' ) == false )
	add_option('ossdl_cname', '');
$ossdl_cname = trim(get_option('ossdl_cname'));
$ossdl_https = trim(get_option('ossdl_https'));
$arr_of_cnames = array_map('trim', explode(',', $ossdl_cname));
if ($arr_of_cnames[0] == '') $arr_of_cnames = array();

/**
 * Determines whether to exclude a match.
 *
 * @param String $match URI to examine
 * @param Array $excludes array of "badwords"
 * @return Boolean true if to exclude given match from rewriting
 */
function scossdl_off_exclude_match($match, $excludes) {
	foreach ($excludes as $badword) {
		if (stristr($match, $badword) != false) {
			return true;
		}
	}
	return false;
}

 /**
 * Compute string modulo, based on SHA1 hash
 */
function scossdl_string_mod($s, $mod) {
	/* The full SHA1 is too large for PHP integer types. This should be
	 * enough for our purpose */
	$n = hexdec(substr(sha1($s), 0, 5));
	return $n % $mod;
}

/**
 * Rewriter of URLs, used as replace-callback.
 *
 * Called by #scossdl_off_filter.
 */
function scossdl_off_rewriter($match) {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url, $arr_of_excludes, $arr_of_cnames, $ossdl_https;

	if ( $ossdl_off_cdn_url == '' )
		return $match[0];

	if ( $ossdl_https && substr( $match[0], 0, 5 ) == 'https' )
		return $match[0];

	if ( false == in_array( $ossdl_off_cdn_url, $arr_of_cnames ) )
		$arr_of_cnames[] = $ossdl_off_cdn_url;

	if ( scossdl_off_exclude_match( $match[0], $arr_of_excludes ) ) {
		return $match[0];
	} else {
		$include_dirs = scossdl_off_additional_directories();
		if ( preg_match( '/' . $include_dirs . '/', $match[0] ) ) {
			$offset = scossdl_string_mod($match[1], count($arr_of_cnames));
			return str_replace($ossdl_off_blog_url, $arr_of_cnames[$offset], $match[0]);
		} else {
			return $match[0];
		}
	}
}

/**
 * Creates a regexp compatible pattern from the directories to be included in matching.
 *
 * @return String with the pattern with {@literal |} as prefix, or empty
 */
function scossdl_off_additional_directories() {
	global $ossdl_off_include_dirs;
	$input = explode(',', $ossdl_off_include_dirs);
	if ($ossdl_off_include_dirs == '' || count($input) < 1) {
		return 'wp\-content|wp\-includes';
	} else {
		return implode('|', array_map('quotemeta', array_map('trim', $input)));
	}
}

/**
 * Output filter which runs the actual plugin logic.
 */
function scossdl_off_filter($content) {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url;
	if ($ossdl_off_blog_url == $ossdl_off_cdn_url) { // no rewrite needed
		return $content;
	} else {
		$dirs = scossdl_off_additional_directories();
		$regex = '#(?<=[(\"\'])'.quotemeta($ossdl_off_blog_url).'/(?:((?:'.$dirs.')[^\"\')]+)|([^/\"\']+\.[^/\"\')]+))(?=[\"\')])#';
		return preg_replace_callback($regex, 'scossdl_off_rewriter', $content);
	}
}

/**
 * Registers scossdl_off_filter as output buffer, if needed.
 */
function do_scossdl_off_ob_start() {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url;
	if ($ossdl_off_blog_url != $ossdl_off_cdn_url) {
		add_filter( 'wp_cache_ob_callback_filter', 'scossdl_off_filter' );
	}
}
if ( false == isset( $ossdlcdn ) )
	$ossdlcdn = 1; // have to default to on for existing users.
if ( $ossdlcdn == 1 )
	add_action('init', 'do_scossdl_off_ob_start');

function scossdl_off_options() {
	global $ossdlcdn, $wp_cache_config_file;

	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	if ( $valid_nonce && isset($_POST['action']) && ( $_POST['action'] == 'update_ossdl_off' )){
		update_option('ossdl_off_cdn_url', $_POST['ossdl_off_cdn_url']);
		update_option('ossdl_off_include_dirs', $_POST['ossdl_off_include_dirs'] == '' ? 'wp-content,wp-includes' : $_POST['ossdl_off_include_dirs']);
		update_option('ossdl_off_exclude', $_POST['ossdl_off_exclude']);
		update_option('ossdl_cname', $_POST['ossdl_cname']);
		if ( !isset( $_POST[ 'ossdl_https' ] ) )
			$_POST[ 'ossdl_https' ] = 0;
		update_option('ossdl_https', (int)$_POST['ossdl_https']);
		if ( isset( $_POST[ 'ossdlcdn' ] ) ) {
			$ossdlcdn = 1;
		} else {
			$ossdlcdn = 0;
		}
		wp_cache_replace_line('^ *\$ossdlcdn', "\$ossdlcdn = $ossdlcdn;", $wp_cache_config_file);
	}
	$example_cdn_uri = str_replace( 'http://', 'http://cdn.', str_replace( 'www.', '', get_option( 'siteurl' ) ) );
	$example_cnames  = str_replace( 'http://cdn.', 'http://cdn1.', $example_cdn_uri );
	$example_cnames .= ',' . str_replace( 'http://cdn.', 'http://cdn2.', $example_cdn_uri );
	$example_cnames .= ',' . str_replace( 'http://cdn.', 'http://cdn3.', $example_cdn_uri );

	$example_cdn_uri = get_option('ossdl_off_cdn_url') == get_option('siteurl') ? $example_cdn_uri : get_option('ossdl_off_cdn_url');
	$example_cdn_uri .= '/wp-includes/js/prototype.js';
	?>
		<p><?php _e( 'Your website probably uses lots of static files. Image, Javascript and CSS files are usually static files that could just as easily be served from another site or CDN. Therefore, this plugin replaces any links in the <code>wp-content</code> and <code>wp-includes</code> directories (except for PHP files) on your site with the URL you provide below. That way you can either copy all the static content to a dedicated host or mirror the files to a CDN by <a href="http://knowledgelayer.softlayer.com/questions/365/How+does+Origin+Pull+work%3F" target="_blank">origin pull</a>.', 'wp-super-cache' ); ?></p>
		<p><?php printf( __( '<strong style="color: red">WARNING:</strong> Test some static urls e.g., %s  to ensure your CDN service is fully working before saving changes.', 'wp-super-cache' ), '<code>' . $example_cdn_uri . '</code>' ); ?></p>
		<p><?php _e( 'You can define different CDN URLs for each site on a multsite network.', 'wp-super-cache' ); ?></p>
		<p><form method="post" action="">
		<?php wp_nonce_field('wp-cache'); ?>
		<table class="form-table"><tbod>
			<tr valign="top">
				<td style='text-align: right'>
					<input id='ossdlcdn' type="checkbox" name="ossdlcdn" value="1" <?php if ( $ossdlcdn ) echo "checked=1"; ?> />
				</td>
				<th scope="row"><label for="ossdlcdn"><?php _e( 'Enable CDN Support', 'wp-super-cache' ); ?></label></th>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_cdn_url"><?php _e( 'Off-site URL', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_cdn_url" value="<?php echo esc_url( get_option( 'ossdl_off_cdn_url' ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php printf( __( 'The new URL to be used in place of %1$s for rewriting. No trailing <code>/</code> please.<br />Example: <code>%2$s</code>.', 'wp-super-cache' ), get_option( 'siteurl' ), $example_cdn_uri ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_include_dirs"><?php _e( 'Include directories', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_include_dirs" value="<?php echo esc_attr( get_option( 'ossdl_off_include_dirs' ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php _e( 'Directories to include in static file matching. Use a comma as the delimiter. Default is <code>wp-content, wp-includes</code>, which will be enforced if this field is left empty.', 'wp-super-cache' ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_exclude"><?php _e( 'Exclude if substring', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_exclude" value="<?php echo esc_attr( get_option( 'ossdl_off_exclude' ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php _e( 'Excludes something from being rewritten if one of the above strings is found in the match. Use a comma as the delimiter like this, <code>.php, .flv, .do</code>, and always include <code>.php</code> (default).', 'wp-super-cache' ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_cname"><?php _e( 'Additional CNAMES', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_cname" value="<?php echo esc_attr( get_option( 'ossdl_cname' ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php printf( __( 'These <a href="http://en.wikipedia.org/wiki/CNAME_record">CNAMES</a> will be used in place of %1$s for rewriting (in addition to the off-site URL above). Use a comma as the delimiter. For pages with a large number of static files, this can improve browser performance. CNAMEs may also need to be configured on your CDN.<br />Example: %2$s', 'wp-super-cache' ), get_option( 'siteurl' ), $example_cnames ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row" colspan='2'><label><input type='checkbox' name='ossdl_https' value='1' <?php if ( get_option( 'ossdl_https' ) ) { echo 'checked'; } ?> /> <?php _e( 'Skip https URLs to avoid "mixed content" errors', 'wp-super-cache' ); ?></label></th>
			</tr>
		</tbody></table>
		<input type="hidden" name="action" value="update_ossdl_off" />
		<p class="submit"><input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" /></p>
		</form></p>
		<p><?php _e( 'CDN functionality provided by <a href="http://wordpress.org/plugins/ossdl-cdn-off-linker/">OSSDL CDN Off Linker</a> by <a href="http://mark.ossdl.de/">Mark Kubacki</a>', 'wp-super-cache' ); ?></p>
	<?php
}
?>
