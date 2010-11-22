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
 * Rewriter of URLs, used as replace-callback.
 *
 * Called by #scossdl_off_filter.
 */
function scossdl_off_rewriter($match) {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url, $arr_of_excludes;
	if (scossdl_off_exclude_match($match[0], $arr_of_excludes)) {
		return $match[0];
	} else {
		$include_dirs = scossdl_off_additional_directories();
		if ( preg_match( '/' . $include_dirs . '/', $match[0] ) ) {
			return str_replace($ossdl_off_blog_url, $ossdl_off_cdn_url, $match[0]);
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
add_action('init', 'do_scossdl_off_ob_start');

function scossdl_off_options() {
	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	if ( $valid_nonce && isset($_POST['action']) && ( $_POST['action'] == 'update_ossdl_off' )){
		update_option('ossdl_off_cdn_url', $_POST['ossdl_off_cdn_url']);
		update_option('ossdl_off_include_dirs', $_POST['ossdl_off_include_dirs'] == '' ? 'wp-content,wp-includes' : $_POST['ossdl_off_include_dirs']);
		update_option('ossdl_off_exclude', $_POST['ossdl_off_exclude']);
	}
	$example_cdn_uri = str_replace('http://', 'http://cdn.', str_replace('www.', '', get_option('siteurl')));

	$example_cdn_uri = get_option('ossdl_off_cdn_url') == get_option('siteurl') ? $example_cdn_uri : get_option('ossdl_off_cdn_url');
	$example_cdn_uri .= '/wp-includes/js/prototype.js';
	?>
		<p><?php _e( 'Your website probably uses lots of static files. Image, Javascript and CSS files are usually static files that could just as easily be served from another site or CDN. Therefore this plugin replaces any links in the <code>wp-content</code> and <code>wp-includes</code> directories (except for PHP files) on your site with the URL you provide below. That way you can either copy all the static content to a dedicated host or mirror the files to a CDN by <a href="http://knowledgelayer.softlayer.com/questions/365/How+does+Origin+Pull+work%3F" target="_blank">origin pull</a>.', 'wp-super-cache' ); ?></p>
		<p><?php printf( __( '<strong style="color: red">WARNING:</strong> Test some static urls e.g., %s  to ensure your CDN service is fully working before saving changes.', 'wp-super-cache' ), '<code>' . $example_cdn_uri . '</code>' ); ?></p>
		<p><?php _e( 'You can define different CDN URLs for each site on a multsite network.', 'wp-super-cache' ); ?></p>
		<p><form method="post" action="">
		<?php wp_nonce_field('wp-cache'); ?>
		<table class="form-table"><tbod>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_cdn_url">off-site URL</label></th>
				<td>
					<input type="text" name="ossdl_off_cdn_url" value="<?php echo(get_option('ossdl_off_cdn_url')); ?>" size="64" class="regular-text code" />
					<span class="description">The new URL to be used in place of <?php echo(get_option('siteurl')); ?> for rewriting. No trailing <code>/</code> please. E.g. <code><?php echo($example_cdn_uri); ?></code>.</span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_include_dirs">include dirs</label></th>
				<td>
					<input type="text" name="ossdl_off_include_dirs" value="<?php echo(get_option('ossdl_off_include_dirs')); ?>" size="64" class="regular-text code" />
					<span class="description">Directories to include in static file matching. Use a comma as the delimiter. Default is <code>wp-content, wp-includes</code>, which will be enforced if this field is left empty.</span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_exclude">exclude if substring</label></th>
				<td>
					<input type="text" name="ossdl_off_exclude" value="<?php echo(get_option('ossdl_off_exclude')); ?>" size="64" class="regular-text code" />
					<span class="description">Excludes something from being rewritten if one of the above strings is found in the match. Use a comma as the delimiter. E.g. <code>.php, .flv, .do</code>, always include <code>.php</code> (default).</span>
				</td>
			</tr>
		</tbody></table>
		<input type="hidden" name="action" value="update_ossdl_off" />
		<p class="submit"><input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" /></p>
		</form></p>
		<p><?php _e( 'CDN functionality provided by <a href="http://wordpress.org/extend/plugins/ossdl-cdn-off-linker/">OSSDL CDN Off Linker</a> by <a href="http://mark.ossdl.de/">Mark Kubacki</a>', 'wp-super-cache' ); ?></p>
	<?php
}
?>
