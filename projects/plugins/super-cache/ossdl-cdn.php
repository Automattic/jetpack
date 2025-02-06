<?php

/* Taken from OSSDL CDN off-linker, a plugin by W-Mark Kubacki and used with permission */

if ( ! isset( $ossdlcdn ) ) {
	$ossdlcdn = 1; // have to default to on for existing users.
}

if ( 1 === $ossdlcdn && ! is_admin() ) {
	add_action( 'init', 'do_scossdl_off_ob_start' );
}

/**
 * Set up some defaults.
 *
 * @global string $ossdl_off_blog_url
 * @global string $ossdl_off_cdn_url
 * @global string $ossdl_cname
 * @global int    $ossdl_https
 * @global array  $ossdl_off_include_dirs
 * @global array  $ossdl_off_excludes
 * @global array  $ossdl_arr_of_cnames
 *
 * @return void
 */
function scossdl_off_get_options() {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url, $ossdl_cname, $ossdl_https;
	global $ossdl_off_include_dirs, $ossdl_off_excludes, $ossdl_arr_of_cnames;

	$ossdl_off_blog_url = get_option( 'ossdl_off_blog_url' );
	if ( false === $ossdl_off_blog_url ) {
		$ossdl_off_blog_url = untrailingslashit( get_site_url() );
		add_option( 'ossdl_off_blog_url', $ossdl_off_blog_url );
	}

	if ( has_filter( 'ossdl_off_blog_url' ) ) {
		$ossdl_off_blog_url = untrailingslashit( apply_filters( 'ossdl_off_blog_url', $ossdl_off_blog_url ) );
	}

	$ossdl_off_cdn_url = get_option( 'ossdl_off_cdn_url' );
	if ( false === $ossdl_off_cdn_url ) {
		$ossdl_off_cdn_url = untrailingslashit( get_site_url() );
		add_option( 'ossdl_off_cdn_url', $ossdl_off_cdn_url );
	}

	$include_dirs = get_option( 'ossdl_off_include_dirs' );
	if ( false !== $include_dirs ) {
		$ossdl_off_include_dirs = array_filter( array_map( 'trim', explode( ',', $include_dirs ) ) );
	} else {
		$ossdl_off_include_dirs = scossdl_off_default_inc_dirs();
		add_option( 'ossdl_off_include_dirs', implode( ',', $ossdl_off_include_dirs ) );
	}

	$exclude = get_option( 'ossdl_off_exclude' );
	if ( false !== $exclude ) {
		$ossdl_off_excludes = array_filter( array_map( 'trim', explode( ',', $exclude ) ) );
	} else {
		$ossdl_off_excludes = array( '.php' );
		add_option( 'ossdl_off_exclude', implode( ',', $ossdl_off_excludes ) );
	}

	$ossdl_cname = get_option( 'ossdl_cname' );
	if ( false !== $ossdl_cname ) {
		$ossdl_cname = trim( $ossdl_cname );
	} else {
		$ossdl_cname = '';
		add_option( 'ossdl_cname', $ossdl_cname );
	}
	$ossdl_arr_of_cnames = array_filter( array_map( 'trim', explode( ',', $ossdl_cname ) ) );

	$ossdl_https = intval( get_option( 'ossdl_https' ) );
}

/**
 * Get default directories.
 *
 * @return array
 */
function scossdl_off_default_inc_dirs() {

	$home_path = trailingslashit( (string) parse_url( get_option( 'siteurl' ), PHP_URL_PATH ) );
	$inc_dirs  = array();

	foreach ( array( content_url(), includes_url() ) as $dir ) {
		$dir        = wp_make_link_relative( $dir );
		$dir        = preg_replace( '`^' . preg_quote( $home_path, '`' ) . '`', '', $dir );
		$inc_dirs[] = trim( $dir, '/' );
	}

	return $inc_dirs;
}

/**
 * Determines whether to exclude a match.
 *
 * @param string $match    URI to examine.
 * @param array  $excludes Array of "badwords".
 *
 * @return boolean true if to exclude given match from rewriting.
 */
function scossdl_off_exclude_match( $match, $excludes ) {
	foreach ( $excludes as $badword ) {
		if ( false !== stripos( $match, $badword ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Compute string modulo, based on SHA1 hash
 *
 * @param string $str The string.
 * @param int    $mod The divisor.
 *
 * @return int The remainder.
 */
function scossdl_string_mod( $str, $mod ) {
	/**
	 * The full SHA1 is too large for PHP integer types.
	 * This should be enough for our purpose.
	 */
	$num = hexdec( substr( sha1( $str ), 0, 5 ) );

	return $num % $mod;
}

/**
 * Rewriter of URLs, used as replace-callback.
 *
 * Called by #scossdl_off_filter.
 */
function scossdl_off_rewriter( $match ) {
	global $ossdl_off_blog_url, $ossdl_https, $ossdl_off_excludes, $ossdl_arr_of_cnames;
	static $count_cnames = null, $include_dirs = null;

	// Set up static variables. Run once only.
	if ( ! isset( $count_cnames ) ) {
		$count_cnames = count( $ossdl_arr_of_cnames );
		$include_dirs = scossdl_off_additional_directories();
	}

	if ( $ossdl_https && str_starts_with( $match[0], 'https' ) ) {
		return $match[0];
	}

	if ( scossdl_off_exclude_match( $match[0], $ossdl_off_excludes ) ) {
		return $match[0];
	}

	if ( preg_match( '`(' . $include_dirs . ')`', $match[0] ) ) {
		$offset = scossdl_string_mod( $match[1], $count_cnames );
		return str_replace( $ossdl_off_blog_url, $ossdl_arr_of_cnames[ $offset ], $match[0] );
	}

	return $match[0];
}

/**
 * Creates a regexp compatible pattern from the directories to be included in matching.
 *
 * @return String with the pattern with {@literal |} as prefix, or empty
 */
function scossdl_off_additional_directories() {
	global $ossdl_off_include_dirs;

	$arr_dirs = array();
	foreach ( $ossdl_off_include_dirs as $dir ) {
		$arr_dirs[] = preg_quote( trim( $dir ), '`' );
	}

	return implode( '|', $arr_dirs );
}

/**
 * Output filter which runs the actual plugin logic.
 *
 * @param  string $content The content of the output buffer.
 *
 * @return string The rewritten content.
 */
function scossdl_off_filter( $content ) {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url;
	global $ossdl_off_include_dirs, $ossdl_off_excludes, $ossdl_arr_of_cnames;

	if ( empty( $content ) || empty( $ossdl_off_cdn_url ) ||
		$ossdl_off_blog_url === $ossdl_off_cdn_url
	) {
		return $content; // no rewrite needed.
	}

	if ( empty( $ossdl_off_include_dirs ) || ! is_array( $ossdl_off_include_dirs ) ) {
		$ossdl_off_include_dirs = scossdl_off_default_inc_dirs();
	}

	if ( empty( $ossdl_off_excludes ) || ! is_array( $ossdl_off_excludes ) ) {
		$ossdl_off_excludes = array();
	}

	if ( ! in_array( $ossdl_off_cdn_url, (array) $ossdl_arr_of_cnames, true ) ) {
		$ossdl_arr_of_cnames = array_merge( array( $ossdl_off_cdn_url ), (array) $ossdl_arr_of_cnames );
	}

	$ossdl_arr_of_cnames = apply_filters( 'wpsc_cdn_urls', $ossdl_arr_of_cnames );

	$dirs  = scossdl_off_additional_directories();
	$regex = '`(?<=[(\"\'])' . preg_quote( $ossdl_off_blog_url, '`' ) . '/(?:((?:' . $dirs . ')[^\"\')]+)|([^/\"\']+\.[^/\"\')]+))(?=[\"\')])`';
	return preg_replace_callback( $regex, 'scossdl_off_rewriter', $content );
}

/**
 * Registers scossdl_off_filter as output buffer, if needed.
 */
function do_scossdl_off_ob_start() {
	global $ossdl_off_blog_url, $ossdl_off_cdn_url;

	if ( class_exists( 'Jetpack' ) && Jetpack::is_module_active( 'photon' ) ) {
		return;
	}

	scossdl_off_get_options();

	if ( ! empty( $ossdl_off_cdn_url ) &&
		$ossdl_off_blog_url !== $ossdl_off_cdn_url
	) {
		add_filter( 'wp_cache_ob_callback_filter', 'scossdl_off_filter' );
	}
}

/**
 * Update CDN settings to the options database table.
 */
function scossdl_off_update() {

	if ( isset( $_POST['action'], $_POST['_wpnonce'] )
		&& 'update_ossdl_off' === $_POST['action'] // WPCS: sanitization ok.
		&& wp_verify_nonce( $_POST['_wpnonce'], 'wp-cache' )
	) {
		update_option( 'ossdl_off_cdn_url', untrailingslashit( wp_unslash( $_POST['ossdl_off_cdn_url'] ) ) ); // WPSC: sanitization ok.
		update_option( 'ossdl_off_blog_url', untrailingslashit( wp_unslash( $_POST['ossdl_off_blog_url'] ) ) ); // WPSC: sanitization ok.

		if ( empty( $_POST['ossdl_off_include_dirs'] ) ) {
			$include_dirs = implode( ',', scossdl_off_default_inc_dirs() );
		} else {
			$include_dirs = sanitize_text_field( wp_unslash( $_POST['ossdl_off_include_dirs'] ) ); // WPSC: validation ok,sanitization ok.
		}
		update_option( 'ossdl_off_include_dirs', $include_dirs );

		update_option( 'ossdl_off_exclude', sanitize_text_field( wp_unslash( $_POST['ossdl_off_exclude'] ) ) ); // WPSC: sanitization ok.
		update_option( 'ossdl_cname', sanitize_text_field( wp_unslash( $_POST['ossdl_cname'] ) ) ); // WPSC: sanitization ok.

		$ossdl_https = empty( $_POST['ossdl_https'] ) ? 0 : 1;
		$ossdlcdn    = empty( $_POST['ossdlcdn'] ) ? 0 : 1;

		update_option( 'ossdl_https', $ossdl_https );
		wp_cache_setting( 'ossdlcdn', $ossdlcdn );
	}
}

/**
 * Show CDN settings.
 */
function scossdl_off_options() {
	global $ossdlcdn, $ossdl_off_blog_url, $ossdl_off_cdn_url, $ossdl_cname, $ossdl_https;
	global $ossdl_off_include_dirs, $ossdl_off_excludes;

	scossdl_off_update();

	scossdl_off_get_options();

	$example_cdn_uri = ( is_ssl() ? 'https' : 'http' ) . '://cdn.' . preg_replace( '`^(https?:)?//(www\.)?`', '', get_site_url() );
	$example_cnames  = str_replace( '://cdn.', '://cdn1.', $example_cdn_uri );
	$example_cnames .= ',' . str_replace( '://cdn.', '://cdn2.', $example_cdn_uri );
	$example_cnames .= ',' . str_replace( '://cdn.', '://cdn3.', $example_cdn_uri );

	$example_cdn_uri  = ( get_site_url() === $ossdl_off_cdn_url ) ? $example_cdn_uri : $ossdl_off_cdn_url;
	$example_cdn_uri .= '/wp-includes/js/jquery/jquery-migrate.js';
	$example_cdn_uri  = esc_url( $example_cdn_uri );
	?>
		<div class="wpsc-card">
		<h3><?php _e( 'Jetpack CDN' ); ?></h3>
		<p><?php printf(
			__( 'The free %1$sJetpack plugin%2$s has a %3$sSite Accelerator%2$s feature that is easier to use than the CDN functionality in this plugin. However files will be cached "forever" and will not update if you update the local file. Files will need to be renamed to refresh them. The %3$sJetpack documentation%2$s explains more about this.', 'wp-super-cache' ),
			'<a href="https://jetpack.com/">',
			'</a>',
			'<a href="https://jetpack.com/support/site-accelerator/">'
		); ?></p>
	<?php
	if ( class_exists( 'Jetpack' ) ) {
		if ( Jetpack::is_module_active( 'photon' ) ) {
			?><p><strong><?php printf(
				__( 'You already have Jetpack installed and %1$sSite Accelerator%2$s enabled on this blog. The CDN here is disabled to avoid conflicts with Jetpack.', 'wp-super-cache' ),
				'<a href="https://jetpack.com/support/site-accelerator/">',
				'</a>'
			); ?></strong></p><?php
		} else {
			?><p><?php printf(
				__( 'You already have Jetpack installed but %1$sSite Accelerator%2$s is disabled on this blog. Enable it on the %3$sJetpack settings page%2$s.', 'wp-super-cache' ),
				'<a href="https://jetpack.com/support/site-accelerator/">',
				'</a>',
				'<a href="' . admin_url( 'admin.php?page=jetpack#/settings' ) . '">'
			); ?></p><?php
		}
	} else {
			?><p><strong><?php printf(
				__( '%1$sJetpack%2$s was not found on your site but %3$syou can install it%2$s. The Site Accelerator feature is free to use on any WordPress site and offers the same benefit as other CDN services. You should give it a try!', 'wp-super-cache' ),
				'<a href="https://jetpack.com/">',
				'</a>',
				'<a href="' . admin_url( 'plugin-install.php?s=jetpack&tab=search&type=term' ) . '">'
			); ?></strong></p><?php
	}
	if ( class_exists( 'Jetpack' ) && Jetpack::is_module_active( 'photon' ) ) {
		echo '</div>'; // close wpsc-card
		return;
	}
	?>
		<h3><?php _e( 'Simple CDN' ); ?></h3>
		<p><?php _e( 'Your website probably uses lots of static files. Image, Javascript and CSS files are usually static files that could just as easily be served from another site or CDN. Therefore, this plugin replaces any links in the <code>wp-content</code> and <code>wp-includes</code> directories (except for PHP files) on your site with the URL you provide below. That way you can either copy all the static content to a dedicated host or mirror the files to a CDN by <a href="https://www.google.com/search?q=cdn+origin+pull" target="_blank">origin pull</a>.', 'wp-super-cache' ); ?></p>
		<p><?php printf( __( '<strong style="color: red">WARNING:</strong> Test some static urls e.g., %s  to ensure your CDN service is fully working before saving changes.', 'wp-super-cache' ), '<code>' . esc_html( $example_cdn_uri ) . '</code>' ); ?></p>

	<?php if ( get_home_url() !== $ossdl_off_blog_url ) { ?>
		<p><?php printf( __( '<strong style="color: red">WARNING:</strong> Your siteurl and homeurl are different. The plugin is using %s as the homepage URL of your site but if that is wrong please use the filter "ossdl_off_blog_url" to fix it.', 'wp-super-cache' ), '<code>' . esc_html( $ossdl_off_blog_url ) . '</code>' ); ?></p>
	<?php } ?>
		<p><?php esc_html_e( 'You can define different CDN URLs for each site on a multsite network.', 'wp-super-cache' ); ?></p>
		<p><form method="post" action="">
		<?php wp_nonce_field( 'wp-cache' ); ?>
		<table class="form-table"><tbody>
			<tr valign="top">
				<td style='text-align: right'>
					<input id='ossdlcdn' type="checkbox" name="ossdlcdn" value="1" <?php checked( $ossdlcdn ); ?> />
				</td>
				<th scope="row"><label for="ossdlcdn"><?php esc_html_e( 'Enable CDN Support', 'wp-super-cache' ); ?></label></th>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_cdn_url"><?php esc_html_e( 'Site URL', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_blog_url" value="<?php echo esc_attr( untrailingslashit( $ossdl_off_blog_url ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php _e( 'The URL of your site. No trailing <code>/</code> please.', 'wp-super-cache' ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_cdn_url"><?php esc_html_e( 'Off-site URL', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_cdn_url" value="<?php echo esc_attr( $ossdl_off_cdn_url ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php printf( __( 'The new URL to be used in place of %1$s for rewriting. No trailing <code>/</code> please.<br />Example: <code>%2$s</code>.', 'wp-super-cache' ), esc_html( get_site_url() ), esc_html( $example_cdn_uri ) ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_include_dirs"><?php esc_html_e( 'Include directories', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_include_dirs" value="<?php echo esc_attr( implode( ',', $ossdl_off_include_dirs ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php _e( 'Directories to include in static file matching. Use a comma as the delimiter. Default is <code>wp-content, wp-includes</code>, which will be enforced if this field is left empty.', 'wp-super-cache' ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_off_exclude"><?php esc_html_e( 'Exclude if substring', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_off_exclude" value="<?php echo esc_attr( implode( ',', $ossdl_off_excludes ) ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php _e( 'Excludes something from being rewritten if one of the above strings is found in the URL. Use a comma as the delimiter like this, <code>.php, .flv, .do</code>, and always include <code>.php</code> (default).', 'wp-super-cache' ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row"><label for="ossdl_cname"><?php esc_html_e( 'Additional CNAMES', 'wp-super-cache' ); ?></label></th>
				<td>
					<input type="text" name="ossdl_cname" value="<?php echo esc_attr( $ossdl_cname ); ?>" size="64" class="regular-text code" /><br />
					<span class="description"><?php printf( __( 'These <a href="https://www.wikipedia.org/wiki/CNAME_record">CNAMES</a> will be used in place of %1$s for rewriting (in addition to the off-site URL above). Use a comma as the delimiter. For pages with a large number of static files, this can improve browser performance. CNAMEs may also need to be configured on your CDN.<br />Example: %2$s', 'wp-super-cache' ), esc_html( get_site_url() ), esc_html( $example_cnames ) ); ?></span>
				</td>
			</tr>
			<tr valign="top">
				<th scope="row" colspan='2'><label><input type='checkbox' name='ossdl_https' value='1' <?php checked( $ossdl_https ); ?> /><?php esc_html_e( 'Skip https URLs to avoid "mixed content" errors', 'wp-super-cache' ); ?></label></th>
			</tr>
		</tbody></table>
		<input type="hidden" name="action" value="update_ossdl_off" />
		<p class="submit"><input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'wp-super-cache' ); ?>" /></p>
		</form></p>
		<p>
		<?php
			printf(
				/* Translators: placeholder is a link to OSSDL CDN Off Linker plugin on WordPress.org */
				esc_html__( 'CDN functionality provided by %s by Mark Kubacki', 'wp-super-cache' ),
				'<a href="https://wordpress.org/plugins/ossdl-cdn-off-linker/">OSSDL CDN Off Linker</a>'
			);
		?>
		</p>
		</div> <!-- Close .wpsc-card -->
	<?php
}
