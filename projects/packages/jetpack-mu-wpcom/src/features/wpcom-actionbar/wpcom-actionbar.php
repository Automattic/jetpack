<?php
/**
 * WordPress.com Action Bar.
 *
 * The floating bar in the bottom corner of a site's front end. Visitors can subscribe, comment,
 * reblog and report from it; site members get Edit and Stats shortcuts.
 *
 * Ported from wpcom `wp-content/mu-plugins/actionbar.php`. Loads on WordPress.com Simple only.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../../utils.php';

/**
 * Decide whether the bar renders on this request and, if so, queue its data and footer output.
 *
 * Keeps the wpcom function name: Coming Soon and WooPay unhook it by name.
 *
 * @suppress PhanRedefineFunction Also in the wpcom stubs until the mu-plugin copy is removed from wpcom.
 */
function wpcom_actionbar_enqueue_scripts() {
	if ( get_option( 'wpcom_hide_action_bar' ) ) {
		return;
	}

	$current_user = wp_get_current_user();

	// Block this on some URLs.
	$blocked_sites = array(
		1,         // wordpress.com
		5595,      // search.wordpress.com
		16390,     // learn.wordpress.com
		22994,     // theme.wordpress.com
		101407,    // translate.wordpress.com AKA TRANSLATE_BLOG_ID
		120742,    // dashboard.wordpress.com
		522232,    // jetpack.wordpress.com (comment forms)
		1099920,   // subscribe.wordpress.com
		5680694,   // support.wordpress.com
		5836086,   // public-api.wordpress.com
		6397066,   // forums.wordpress.com
		9619154,   // en.support.wordpress.com
		37680917,  // store.wordpress.com
		38809381,  // manualpayments.wordpress.com
		40179807,  // supportpresssite.wordpress.com
		49596611,  // help.vaultpress.com
		70162127,  // getselfies.com
		11429489,  // videopress2.wordpress.com
		16913049,  // support.polldaddy.com
		110643074, // es.support.wordpress.com
		159755152, // happy.tools
		108068616, // apps.wordpress.com
		199936585, // pay.woo.com
		203335235, // woopay-test.blog
		220968827, // woopaysandbox.wordpress.com
		33534099,  // developer.wordpress.com
		28690414,  // anonymattic.club
		// VIP
		66829272,  // ottawacitizen.com
		76569863,  // shopcatalog.com
	);

	// Block on non-posts for jetpack.com (20115252 legacy, JETPACK_COM_2026_BLOG_IDS since the 2026 move).
	if ( ! is_single() ) {
		$blocked_sites[] = 20115252;
		if ( defined( 'JETPACK_COM_2026_BLOG_IDS' ) && is_array( JETPACK_COM_2026_BLOG_IDS ) ) {
			array_push( $blocked_sites, ...JETPACK_COM_2026_BLOG_IDS );
		}
	}

	$site_id = get_current_blog_id();
	if ( in_array( $site_id, $blocked_sites, true ) ) {
		return;
	}

	global $current_blog;
	// Don't show on marked sites.
	if ( (int) get_blog_status( $site_id, 'deleted' ) || (int) get_blog_status( $site_id, 'spam' ) || (int) get_blog_status( $site_id, 'archived' ) || ! empty( $current_blog->is_parked ) ) {
		return;
	}

	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only checks on preview query args.
	// Don't show on theme previews and block patterns source sites.
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$is_theme_demo = function_exists( 'wpcom_is_theme_demo_site' ) && wpcom_is_theme_demo_site();
	if ( isset( $_GET['theme'] ) || $is_theme_demo || has_blog_sticker( 'block-patterns-source-site', $site_id ) ) {
		return;
	}

	// Don't show on Customizer previews.
	if ( isset( $_GET['customize_theme'] ) || isset( $_GET['customize_changeset_uuid'] ) ) {
		return;
	}
	// phpcs:enable

	// Don't show on WordPress mobile apps.
	$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
	if ( $user_agent && preg_match( '/wp-(android|iphone)/', $user_agent ) ) {
		return;
	}

	// Don't show on Landpack blogs, unless user is a member of the blog.
	if ( defined( 'WPCOM_LANDPACK_BLOG_IDS' ) && in_array( $site_id, (array) WPCOM_LANDPACK_BLOG_IDS, true ) && ! is_user_member_of_blog( $current_user->ID, $site_id ) ) {
		return;
	}

	$settings = get_option( 'subscription_options' );

	// Render this in the user's language.
	wpcom_actionbar_switch_to_user_locale();

	$status_message = false;
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Status flag set by the subscribe.wordpress.com redirect.
	$blogsub = isset( $_GET['blogsub'] ) ? sanitize_key( wp_unslash( $_GET['blogsub'] ) ) : '';
	switch ( $blogsub ) {
		case 'confirming':
			$status_message  = '<h3>' . __( 'Thanks', 'jetpack-mu-wpcom' ) . '</h3>';
			$status_message .= '<div>' .
				wp_kses(
					sprintf(
						/* translators: %s is the URL of the support contact page. */
						__( 'You’ll get an email with a link to confirm your subscription. If it doesn’t arrive, please <a href="%s">contact us</a>.', 'jetpack-mu-wpcom' ),
						esc_url( localized_wpcom_url( 'https://wordpress.com/support/contact/' ) )
					),
					array(
						'a' => array(
							'href' => array(),
						),
					)
				) .
				'</div>';
			break;
		case 'subscribed':
			$status_message = '<div>' . __( 'You’re already subscribed to this site!', 'jetpack-mu-wpcom' ) . '</div>';
			break;
		case 'flooded':
			$status_message =
				'<div>' .
				sprintf(
					/* translators: %s is a link with its text (Subscription Manager) translated separately */
					__( 'You already have several pending email subscriptions. Approve or delete a few through your %s before attempting to subscribe to more blogs.', 'jetpack-mu-wpcom' ),
					'<a href="https://subscribe.wordpress.com/">' . __( 'Subscription Manager', 'jetpack-mu-wpcom' ) . '</a>'
				) .
				'</div>';
			break;
		case 'pending':
			$status_message = '<div>' . __( 'You already have a pending subscription, we just sent you another email, click the link or <a href="https://en.support.wordpress.com/contact/">contact us</a> if you don’t get it', 'jetpack-mu-wpcom' ) . '</div>';
			break;
		case 'confirmed':
			$status_message = '<div>' . __( 'Congrats, you’re subscribed! You’ll get an email with the details of your subscription and an unsubscribe link', 'jetpack-mu-wpcom' ) . '</div>';
			break;
	}

	$vip_disabled = wpcom_is_vip() && ( ! isset( $settings['loggedoutfollow'] ) || 'off' === $settings['loggedoutfollow'] );
	/** This filter is documented in projects/packages/jetpack-mu-wpcom/src/features/wpcom-actionbar/wpcom-actionbar.php */
	$vip_disabled = apply_filters( 'wpcom_disable_logged_out_follow', $vip_disabled );
	// VIP: Disable functionality on sites that have logged_out follow set to false.
	if ( ! is_user_logged_in() && $vip_disabled ) {
		wpcom_actionbar_restore_locale();
		return;
	}

	$http_host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';

	// Data to pass to the JS.
	$actionbar_info = array(
		'siteID'           => $site_id,
		'postID'           => is_singular() ? get_the_ID() : 0,
		'siteURL'          => get_option( 'home' ),
		'xhrURL'           => esc_url_raw( ( is_ssl() ? 'https://' : 'http://' ) . $http_host . '/wp-admin/admin-ajax.php' ),
		'nonce'            => wp_create_nonce( 'manage_subscription' ),
		'isLoggedIn'       => is_user_logged_in(),
		'statusMessage'    => $status_message,
		'subsEmailDefault' => wpcom_actionbar_email_default( $current_user ),
		'proxyScriptUrl'   => 'https://s0.wp.com/wp-content/js/wpcom-proxy-request.js?ver=20211021',
	);

	if ( is_singular() ) {
		$actionbar_info['shortlink'] = wp_get_shortlink( get_the_ID() );
	}

	$actionbar_info['i18n'] = array(
		'followedText'    => __( 'New posts from this site will now appear in your <a href="https://wordpress.com/reader">Reader</a>', 'jetpack-mu-wpcom' ),
		'foldBar'         => __( 'Collapse this bar', 'jetpack-mu-wpcom' ),
		'unfoldBar'       => __( 'Expand this bar', 'jetpack-mu-wpcom' ),
		'shortLinkCopied' => __( 'Shortlink copied to clipboard.', 'jetpack-mu-wpcom' ),
	);

	// Switch back to site language.
	wpcom_actionbar_restore_locale();

	// An alias handle with no src, so wp_localize_script() prints the data without a script tag.
	// phpcs:disable WordPress.WP.EnqueuedResourceParameters.MissingVersion
	wp_register_script( 'wpcom-actionbar-placeholder', '', array(), null, false );
	wp_localize_script( 'wpcom-actionbar-placeholder', 'actionbardata', $actionbar_info );
	wp_enqueue_script( 'wpcom-actionbar-placeholder' );
	// phpcs:enable

	// Defer loading the actionbar resources.
	add_action( 'wp_footer', 'wpcom_actionbar_footer' );
}
add_action( 'wp_enqueue_scripts', 'wpcom_actionbar_enqueue_scripts', 101 );

/**
 * Print the bar's markup, then a loader that appends its CSS and JS after DOMContentLoaded.
 */
function wpcom_actionbar_footer() {
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$is_rtl = function_exists( 'wpcom_is_locale_rtl' ) ? wpcom_is_locale_rtl( get_user_locale() ) : is_rtl();
	wpcom_actionbar_html( $is_rtl );

	$asset_path = Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-actionbar/wpcom-actionbar.asset.php';
	$asset_file = file_exists( $asset_path ) ? include $asset_path : array();
	$version    = is_array( $asset_file ) && ! empty( $asset_file['version'] ) ? $asset_file['version'] : Jetpack_Mu_Wpcom::PACKAGE_VERSION;

	$css_file = $is_rtl ? 'build/wpcom-actionbar/wpcom-actionbar.rtl.css' : 'build/wpcom-actionbar/wpcom-actionbar.css';
	$css_url  = add_query_arg( 'ver', $version, plugins_url( $css_file, Jetpack_Mu_Wpcom::BASE_FILE ) );
	$js_url   = add_query_arg( 'ver', $version, plugins_url( 'build/wpcom-actionbar/wpcom-actionbar.js', Jetpack_Mu_Wpcom::BASE_FILE ) );
	?>

<script>
window.addEventListener( "DOMContentLoaded", function() {
	var link = document.createElement( "link" );
	link.href = <?php echo wp_json_encode( $css_url, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;
	link.type = "text/css";
	link.rel = "stylesheet";
	document.head.appendChild( link );

	var script = document.createElement( "script" );
	script.src = <?php echo wp_json_encode( $js_url, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;
	document.body.appendChild( script );
} );
</script>

	<?php
}

/**
 * Switch to the current user's locale, if logged in.
 */
function wpcom_actionbar_switch_to_user_locale() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	if ( function_exists( 'wpcom_switch_to_user_locale' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
		wpcom_switch_to_user_locale( get_current_user_id() );
	} else {
		switch_to_user_locale( get_current_user_id() );
	}
}

/**
 * Undo wpcom_actionbar_switch_to_user_locale().
 */
function wpcom_actionbar_restore_locale() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	if ( function_exists( 'wpcom_restore_current_locale' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
		wpcom_restore_current_locale();
	} else {
		restore_previous_locale();
	}
}

/**
 * The email delivery frequency a new subscription defaults to for this user.
 *
 * @param WP_User $current_user The current user.
 * @return string One of instantly, daily, weekly, never.
 */
function wpcom_actionbar_email_default( $current_user ) {
	if ( ! empty( $current_user->subs_email_default ) ) {
		return $current_user->subs_email_default;
	}
	if ( function_exists( 'wpcom_subs_get_subscription_delivery_email_default' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
		return wpcom_subs_get_subscription_delivery_email_default();
	}
	return 'instantly';
}

/**
 * Print one of the WordPress icons the bar uses, inlined from @wordpress/icons.
 *
 * Icons inherit their color from CSS `color`, like the library's own Icon component.
 *
 * @param string $name Icon name from the WordPress icon library.
 * @param int    $size Rendered width and height in pixels.
 */
function wpcom_actionbar_icon( $name, $size = 24 ) {
	$fill_icons = array(
		'bell'            => '<path fill-rule="evenodd" clip-rule="evenodd" d="M17 11.5c0 1.353.17 2.368.976 3 .266.209.602.376 1.024.5v1H5v-1c.422-.124.757-.291 1.024-.5.806-.632.976-1.647.976-3V9c0-2.8 2.2-5 5-5s5 2.2 5 5v2.5ZM15.5 9v2.5c0 .93.066 1.98.515 2.897l.053.103H7.932a4.018 4.018 0 0 0 .053-.103c.449-.917.515-1.967.515-2.897V9c0-1.972 1.528-3.5 3.5-3.5s3.5 1.528 3.5 3.5Zm-5.492 9.008c0-.176.023-.346.065-.508h3.854A1.996 1.996 0 0 1 12 20c-1.1 0-1.992-.892-1.992-1.992Z"/>',
		'copy'            => '<path fill-rule="evenodd" clip-rule="evenodd" d="M5 4.5h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5ZM3 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm17 3v10.75c0 .69-.56 1.25-1.25 1.25H6v1.5h12.75a2.75 2.75 0 0 0 2.75-2.75V8H20Z"/>',
		'external'        => '<path d="M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z"/>',
		'comment'         => '<path d="M18 4H6c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3L8.5 17H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H7.9l-2.4 2.4V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v9z"/>',
		'more-horizontal' => '<path d="M11 13h2v-2h-2v2zm-6 0h2v-2H5v2zm12-2v2h2v-2h-2z"/>',
		'pencil'          => '<path d="m19 7-3-3-8.5 8.5-1 4 4-1L19 7Zm-7 11.5H5V20h7v-1.5Z"/>',
		'reusable-block'  => '<path d="M7 7.2h8.2L13.5 9l1.1 1.1 3.6-3.6-3.5-4-1.1 1 1.9 2.3H7c-.9 0-1.7.3-2.3.9-1.4 1.5-1.4 4.2-1.4 5.6v.2h1.5v-.3c0-1.1 0-3.5 1-4.5.3-.3.7-.5 1.2-.5zm13.8 4V11h-1.5v.3c0 1.1 0 3.5-1 4.5-.3.3-.7.5-1.3.5H8.8l1.7-1.7-1.1-1.1L5.9 17l3.5 4 1.1-1-1.9-2.3H17c.9 0 1.7-.3 2.3-.9 1.5-1.4 1.5-4.2 1.5-5.6z"/>',
		'shield'          => '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.176l6.75 3.068v4.574c0 3.9-2.504 7.59-6.035 8.755a2.283 2.283 0 01-1.43 0c-3.53-1.164-6.035-4.856-6.035-8.755V6.244L12 3.176zM6.75 7.21v3.608c0 3.313 2.145 6.388 5.005 7.33.159.053.331.053.49 0 2.86-.942 5.005-4.017 5.005-7.33V7.21L12 4.824 6.75 7.21z"/>',
	);
	// These are drawn with strokes, not fills, in the library.
	$stroke_icons = array(
		'chart-bar' => '<path d="M6.75 20V10M12 20V5M17.25 20V14" vector-effect="non-scaling-stroke"/>',
		'check'     => '<path d="M7 12L10 15L17 8" vector-effect="non-scaling-stroke"/>',
	);

	if ( isset( $fill_icons[ $name ] ) ) {
		$attributes = 'fill="currentColor"';
		$markup     = $fill_icons[ $name ];
	} elseif ( isset( $stroke_icons[ $name ] ) ) {
		$attributes = 'style="fill: none" stroke="currentColor" stroke-width="1.5"';
		$markup     = $stroke_icons[ $name ];
	} else {
		return;
	}

	printf(
		'<svg class="actnbr-icon actnbr-icon-%1$s" width="%2$d" height="%2$d" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" %3$s>%4$s</svg>',
		esc_attr( $name ),
		(int) $size,
		$attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static attribute string.
		$markup // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static SVG path markup from @wordpress/icons.
	);
}

/**
 * Print one item of the ⋯ menu.
 *
 * @param array $args Item arguments: href, label, class (stats hook), icon (right-edge icon name), blank (open in a new tab), before (trusted markup before the label).
 */
function wpcom_actionbar_menu_item( $args ) {
	$args = wp_parse_args(
		$args,
		array(
			'href'   => '',
			'label'  => '',
			'class'  => '',
			'icon'   => '',
			'blank'  => false,
			'before' => '',
		)
	);
	?>
	<a role="menuitem" class="actnbr-menu__item <?php echo esc_attr( $args['class'] ); ?>" href="<?php echo esc_url( $args['href'] ); ?>"<?php echo $args['blank'] ? ' target="_blank" rel="noopener noreferrer"' : ''; ?>>
		<?php echo $args['before']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Caller-built markup, escaped at the source. ?>
		<span class="actnbr-menu__label"><?php echo esc_html( $args['label'] ); ?></span>
		<?php
		if ( $args['icon'] ) {
			echo '<span class="actnbr-menu__icon">';
			wpcom_actionbar_icon( $args['icon'], 24 );
			echo '</span>';
		}
		?>
	</a>
	<?php
}

/**
 * Print a menu group if it has any items.
 *
 * @param string $items_html Rendered items, usually captured with output buffering.
 */
function wpcom_actionbar_menu_group( $items_html ) {
	if ( '' === trim( $items_html ) ) {
		return;
	}
	echo '<div class="actnbr-menu__group" role="group">' . $items_html . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Items are escaped where rendered.
}

/**
 * The site's blavatar image markup, or an empty string.
 *
 * @return string
 */
function wpcom_actionbar_blavatar() {
	if ( ! function_exists( 'get_blavatar' ) ) {
		return '';
	}
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$blavatar_img = get_blavatar( get_option( 'siteurl' ), 50, staticize_subdomain( 'https://en.wordpress.com/i/logo/wpcom-gray-white.png' ) ); // phpcs:ignore WPCOM.I18nRules.LocalizedUrl.UnlocalizedUrl
	if ( 0 === strpos( $blavatar_img, '<img alt' ) ) {
		$blavatar_img = "<img loading='lazy' alt" . substr( $blavatar_img, 8 );
	}
	return $blavatar_img;
}

/**
 * Print the site title row at the top of the Subscribe popover.
 *
 * @param string $site_url  Site home URL.
 * @param string $site_name Site title.
 */
function wpcom_actionbar_site_title( $site_url, $site_name ) {
	?>
		<li class="actnbr-sitename">
			<a href="<?php echo esc_url( $site_url ); ?>">
				<?php echo wpcom_actionbar_blavatar(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Image markup from get_blavatar(). ?>
				<?php echo esc_html( $site_name ); ?>
			</a>
		</li>
	<?php
}

/**
 * Print the Subscribe and Subscribed links; only one is visible at a time.
 *
 * @param bool $is_following Whether the current user already subscribes to this site.
 */
function wpcom_actionbar_follow_links( $is_following ) {
	?>
		<a class="actnbr-action actnbr-actn-follow <?php echo $is_following ? ' no-display' : ''; ?>" href="">
			<?php wpcom_actionbar_icon( 'bell', 20 ); ?>
			<span><?php esc_html_e( 'Subscribe', 'jetpack-mu-wpcom' ); ?></span>
		</a>
		<a class="actnbr-action actnbr-actn-following <?php echo $is_following ? '' : ' no-display'; ?>" href="">
			<?php wpcom_actionbar_icon( 'check', 20 ); ?>
			<span><?php esc_html_e( 'Subscribed', 'jetpack-mu-wpcom' ); ?></span>
		</a>
	<?php
}

/**
 * Print the bar's markup. Hidden inline until the JS reveals it.
 *
 * @param bool $is_rtl Whether to render right-to-left.
 */
function wpcom_actionbar_html( $is_rtl ) {
	$current_user = wp_get_current_user();
	$site_id      = get_current_blog_id();

	global $current_blog;

	$site     = get_blog_details( $site_id );
	$settings = get_option( 'subscription_options' );

	// Render this in the user's language.
	wpcom_actionbar_switch_to_user_locale();

	$dotcom_enabled = true;
	$vip_disabled   = wpcom_is_vip() && ( ! isset( $settings['loggedoutfollow'] ) || 'off' === $settings['loggedoutfollow'] );
	/**
	 * Filters whether logged-out visitors get the bar and its follow actions.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $vip_disabled Whether to disable. Defaults to true on VIP sites with logged-out follow off.
	 */
	$vip_disabled = apply_filters( 'wpcom_disable_logged_out_follow', $vip_disabled );

	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$is_suspended = function_exists( 'is_suspended' ) && is_suspended( $site_id );
	$is_archived  = function_exists( 'is_archived' ) && is_archived( $site_id );

	/**
	 * Determine if a site should show follow actions. Common cases that shouldn't show it include:
	 * Most VIP sites, most private sites (except Automattic P2s),
	 * "baddies": archived, deleted, etc.,
	 * sites with "show logged-out follow" option turned off (option removed with r152772)
	 * static sites: no blog posts and a static front page is set.
	 */
	if (
		empty( $site->spam ) && empty( $site->deleted ) && ! $is_suspended && ! $is_archived &&
		! in_array( $site_id, (array) apply_filters( 'loggedout_follow_disabled_blog_id', array( 1 ) ), true ) &&
		! apply_filters( 'loggedout_follow_disabled', false ) &&
		! $vip_disabled && (
			( ! is_user_logged_in() ) ||
			( ! is_user_member_of_blog( $current_user->ID, $site_id ) ) ||
			( is_automattician( $current_user->ID ) )
			// TODO: figure out a non performance-impacting way of adding the following check:
			// logged in, member of blog, blog has more than one member
			// || ( ( new WP_User_Query( array( 'blog_id' => $site_id ) ) )->get_total() > 1 )
		) &&
		( 'page' === get_option( 'show_on_front' ) && get_option( 'post_count' ) < 2 )
	) {
		$dotcom_enabled = false;
	}

	$login_url = add_query_arg( 'redirect_to', get_permalink(), 'https://wordpress.com/log-in' );
	$login_url = add_query_arg( 'signup_flow', 'account', $login_url );
	if (
		! empty( $current_blog->primary_redirect )
		&& strpos( $current_blog->primary_redirect, '.wordpress.com' ) === false
	) {
		// phpcs:ignore WPCOM.I18nRules.LocalizedUrl.UnlocalizedUrl
		$redirect_to = add_query_arg( 'back', rawurlencode( get_permalink() ? get_permalink() : home_url() ), 'https://r-login.wordpress.com/remote-login.php?action=link' );
		$login_url   = add_query_arg( 'redirect_to', rawurlencode( $redirect_to ), 'https://wordpress.com/log-in' );
	}

	$site_name          = get_option( 'blogname' );
	$site_url           = get_option( 'home' );
	$site_host          = wp_parse_url( get_option( 'home' ), PHP_URL_HOST );
	$site_slug          = wpcom_get_site_slug();
	$can_customize_site = current_user_can( 'edit_theme_options' ) && is_user_member_of_blog( $current_user->ID, $site_id );
	$subscription_id    = wpcom_subs_is_subscribed(
		array(
			'user_id' => get_current_user_id(),
			'blog_id' => $site_id,
		)
	);
	$is_following       = $subscription_id ? true : false;
	$signup_url         = 'https://wordpress.com/start/';
	$theme_slug         = get_stylesheet();
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$theme_url    = function_exists( 'wpcom_get_theme_showcase_url' ) ? wpcom_get_theme_showcase_url( $theme_slug ) : 'https://wordpress.com/theme/' . $theme_slug;
	$is_singular  = false;
	$is_folded    = (bool) get_user_attribute( $current_user->ID, 'is_actionbar_folded' );
	$is_logged_in = is_user_logged_in();
	$feed_id      = false;
	if ( class_exists( 'FeedBag' ) ) {
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- wpcom-only class, guarded by class_exists above.
		$feed_id = FeedBag::get_feed_id_for_blog_id( $site_id );
	}
	$gdpr_applies = wpcom_actionbar_gdpr_applies();

	// Fall back to site URL if site title is empty.
	if ( empty( get_option( 'blogname' ) ) ) {
		$site_name = get_primary_redirect();
	}

	$post_id       = 0;
	$shortlink     = '';
	$edit_link     = '';
	$stats_link    = '';
	$can_edit_post = false;
	if ( is_singular() ) {
		$is_singular   = true;
		$post_id       = get_the_ID();
		$shortlink     = wp_get_shortlink( get_the_ID() );
		$can_edit_post = current_user_can( 'edit_post', get_the_ID() ) && is_user_member_of_blog( $current_user->ID, $site_id );

		/*
		 * Use the wp admin editor for VIPs (since they have custom editor
		 * plugins), or for super admins who are not members of the blog (until
		 * user-switching is implemented in Calypso).
		 */
		$edit_link = add_query_arg(
			array(
				'post'   => get_the_ID(),
				'action' => 'edit',
			),
			admin_url( 'post.php' )
		);

		$post_type = get_post_type();

		$should_use_calypso_links = empty( $post_type ) || function_exists( 'wpcom_should_disable_calypso_links' ) && ! wpcom_should_disable_calypso_links( 'edit.php?post_type=' . $post_type );

		if ( $should_use_calypso_links && ! wpcom_is_vip() && ( ! is_super_admin() || is_user_member_of_blog( get_current_user_id(), $site_id ) ) ) {
			$path_prefix = null;
			if ( in_array( $post_type, array( 'post', 'page' ), true ) ) {
				$path_prefix = $post_type;
			} elseif ( in_array( $post_type, apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'revision' ) ), true ) ) {
				$path_prefix = sprintf( 'edit/%s', $post_type );
			}

			if ( $path_prefix ) {
				$edit_link = sprintf( 'https://wordpress.com/%s/%s/%d', $path_prefix, $site_slug, get_the_ID() );
			}
		}

		if ( $should_use_calypso_links ) {
			$stats_link = sprintf( 'https://wordpress.com/stats/post/%d/%s', get_the_ID(), $site_slug );
		} else {
			$stats_link = admin_url( sprintf( 'admin.php?page=stats#!/stats/post/%d/%d', get_the_ID(), (int) get_wpcom_blog_id() ) );
		}
	}

	$subscribers_total = wpcom_subs_total_for_blog();
	$followers         = '';
	if ( ! empty( $subscribers_total ) && $subscribers_total > 24 ) {
		/* translators: %s: number of subscribers */
		$followers = sprintf( _n( 'Join %s other subscriber', 'Join %s other subscribers', $subscribers_total, 'jetpack-mu-wpcom' ), number_format_i18n( $subscribers_total ) );
	}

	$referer = '';
	if ( isset( $_SERVER['HTTP_HOST'] ) && isset( $_SERVER['REQUEST_URI'] ) ) {
		$referer = ( is_ssl() ? 'https' : 'http' ) . '://' . sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) . sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) );
	}

	$can_comment           = is_single() && ! post_password_required( $post_id ) && comments_open( $post_id );
	$can_reblog            = is_single() && wpcom_actionbar_can_reblog( $site_id, $post_id );
	$can_follow            = $dotcom_enabled;
	$can_edit_current_view = $can_edit_post || $can_customize_site;

	/*
	 * $gdpr_applies is deliberately left out even though it's a potential action.
	 * The privacy/GDPR button is special as it relies on window.__tcfapi being in the browser window object as well.
	 * The check/logic for that button is done in the JS code.
	 */
	$has_visible_actions = $can_edit_post || ( $can_comment && ! $can_edit_current_view ) || ( $can_reblog && ! $can_edit_current_view ) || ( $can_follow && ! $can_edit_current_view );
	$classes             = 'actnbr-' . str_replace( '/', '-', $theme_slug );
	if ( ! $can_customize_site ) {
		$classes .= ' actnbr-has-follow';
	}

	if ( $is_folded ) {
		$classes .= ' actnbr-folded';
	}

	if ( $has_visible_actions ) {
		$classes .= ' actnbr-has-actions';
	}

	$dir = $is_rtl ? 'rtl' : 'ltr';

	?>
		<div id="actionbar" dir="<?php echo esc_attr( $dir ); ?>" style="display: none;"
			class="<?php echo esc_attr( $classes ); ?>">
		<ul>
			<?php
			if ( $can_edit_post ) {
				?>
					<li class="actnbr-btn actnbr-edit">
						<a href="<?php echo esc_url( $edit_link ); ?>">
							<?php wpcom_actionbar_icon( 'pencil', 20 ); ?>
							<span><?php esc_html_e( 'Edit', 'jetpack-mu-wpcom' ); ?></span>
						</a>
					</li>
					<li class="actnbr-btn actnbr-stats">
						<a href="<?php echo esc_url( $stats_link ); ?>">
							<?php wpcom_actionbar_icon( 'chart-bar', 20 ); ?>
							<span><?php esc_html_e( 'Stats', 'jetpack-mu-wpcom' ); ?></span>
						</a>
					</li>
				<?php
			}

			if ( $can_comment && ! $can_edit_current_view ) {
				?>
					<li class="actnbr-btn actnbr-hidden">
						<a class="actnbr-action actnbr-actn-comment" href="<?php echo esc_url( get_comments_link( $post_id ) ); ?>">
							<?php wpcom_actionbar_icon( 'comment', 20 ); ?>
							<span><?php esc_html_e( 'Comment', 'jetpack-mu-wpcom' ); ?>
						</span>
						</a>
					</li>
				<?php
			}

			if ( $can_reblog && ! $can_edit_current_view ) {
				?>
					<li class="actnbr-btn actnbr-hidden">
						<a class="actnbr-action actnbr-actn-reblog" href="">
							<?php wpcom_actionbar_icon( 'reusable-block', 20 ); ?><span><?php esc_html_e( 'Reblog', 'jetpack-mu-wpcom' ); ?></span>
						</a>
					</li>
				<?php
			}

			if ( $can_follow && ! $can_edit_current_view ) {
				?>
					<li class="actnbr-btn actnbr-hidden">
						<?php wpcom_actionbar_follow_links( $is_following ); ?>
						<div class="actnbr-popover tip tip-top-left actnbr-notice" id="follow-bubble">
							<div class="tip-arrow"></div>
							<div class="tip-inner actnbr-follow-bubble">
							<?php
							if ( $is_logged_in ) {
								?>
								<ul>
									<?php wpcom_actionbar_site_title( $site_url, $site_name ); ?>
									<div class="actnbr-site-settings">
										<div class="actnbr-site-settings__setting">
											<span class="actnbr-site-settings__toggle">
												<input class="actnbr-site-settings__toggle__input" id="toggle-input-notify-posts" type="checkbox"></input>
												<span class="actnbr-site-settings__toggle__track"></span>
												<span class="actnbr-site-settings__toggle__thumb"></span>
											</span>
											<label for="toggle-input-notify-posts" class="components-toggle-control__label">
												<?php esc_html_e( 'Notify me of new posts', 'jetpack-mu-wpcom' ); ?>
											</label>
										</div>
										<p class="actnbr-site-settings__details">
											<?php esc_html_e( 'Receive web and mobile notifications for new posts from this site.', 'jetpack-mu-wpcom' ); ?>
										</p>
										<div class="actnbr-site-settings__setting">
											<span class="actnbr-site-settings__toggle">
												<input class="actnbr-site-settings__toggle__input" id="toggle-input-email-posts" type="checkbox"></input>
												<span class="actnbr-site-settings__toggle__track"></span>
												<span class="actnbr-site-settings__toggle__thumb"></span>
											</span>
											<label for="toggle-input-email-posts" class="components-toggle-control__label">
												<?php esc_html_e( 'Email me new posts', 'jetpack-mu-wpcom' ); ?>
											</label>
										</div>
										<div class="actnbr-site-settings__details" id="email-new-posts-details">
											<ul class="segmented-control" role="radiogroup">
												<li class="segmented-control__item">
													<a class="segmented-control__link frequency-instantly"><?php esc_html_e( 'Instantly', 'jetpack-mu-wpcom' ); ?></a>
												</li>
												<li class="segmented-control__item">
													<a class="segmented-control__link frequency-daily"><?php esc_html_e( 'Daily', 'jetpack-mu-wpcom' ); ?></a>
												</li>
												<li class="segmented-control__item">
													<a class="segmented-control__link frequency-weekly"><?php esc_html_e( 'Weekly', 'jetpack-mu-wpcom' ); ?></a>
												</li>
											</ul>
										</div>
										<div class="actnbr-site-settings__setting">
											<span class="actnbr-site-settings__toggle">
												<input class="actnbr-site-settings__toggle__input" id="toggle-input-email-comments" type="checkbox">
												</input>
												<span class="actnbr-site-settings__toggle__track"></span>
												<span class="actnbr-site-settings__toggle__thumb"></span>
											</span>
											<label for="toggle-input-email-comments" class="components-toggle-control__label">
												<?php esc_html_e( 'Email me new comments', 'jetpack-mu-wpcom' ); ?>
											</label>
										</div>
									</div>
								</ul>
								<?php
							} else {
								?>
								<ul>
									<?php wpcom_actionbar_site_title( $site_url, $site_name ); ?>
									<div class="actnbr-message no-display"></div>
									<form method="post" action="https://subscribe.wordpress.com" accept-charset="utf-8" style="display: none;">
										<?php
										if ( $followers ) {
											?>
												<div class="actnbr-follow-count"><?php echo esc_html( $followers ); ?></div>
											<?php
										}
										?>
										<div>
										<input type="email" name="email" placeholder="<?php esc_attr_e( 'Enter your email address', 'jetpack-mu-wpcom' ); ?>" class="actnbr-email-field" aria-label="<?php esc_attr_e( 'Enter your email address', 'jetpack-mu-wpcom' ); ?>" />
										</div>
										<input type="hidden" name="action" value="subscribe" />
										<input type="hidden" name="blog_id" value="<?php echo esc_attr( (string) $site_id ); ?>" />
										<input type="hidden" name="source" value="<?php echo esc_url( $referer ); ?>" />
										<input type="hidden" name="sub-type" value="actionbar-follow" />
										<?php wp_nonce_field( 'blogsub_subscribe_' . $site_id, '_wpnonce', false, true ); ?>
										<div class="actnbr-button-wrap">
											<button type="submit" value="<?php esc_attr_e( 'Sign me up', 'jetpack-mu-wpcom' ); ?>">
												<?php esc_html_e( 'Sign me up', 'jetpack-mu-wpcom' ); ?>
											</button>
										</div>
									</form>
									<li class="actnbr-login-nudge">
										<div>
											<?php
											echo wp_kses(
												/* translators: %s is a URL */
												sprintf( __( 'Already have a WordPress.com account? <a href="%s">Log in now.</a>', 'jetpack-mu-wpcom' ), esc_url( $login_url ) ),
												array(
													'a' => array(
														'href' => array(),
													),
												)
											);
											?>
										</div>
									</li>
								</ul>
								<?php
							}
							?>
							</div>
						</div>
					</li>
				<?php
			}

			/*
			 * The privacy/GDPR button is special as it relies on window.__tcfapi being in the browser window object as well.
			 * no-display is removed by JS if window.__tcfapi is present.
			 */
			if ( $gdpr_applies ) {
				?>
					<li class="actnbr-btn actnbr-hidden no-display" onclick="javascript:__tcfapi( 'showUi' );">
						<a class="actnbr-action actnbr-actn-privacy" href="#">
							<?php wpcom_actionbar_icon( 'shield', 20 ); ?>
							<span><?php esc_html_e( 'Privacy', 'jetpack-mu-wpcom' ); ?>
						</span>
						</a>
					</li>
				<?php
			}
			?>
			<li class="actnbr-ellipsis actnbr-hidden">
				<button type="button" class="actnbr-more-toggle" aria-haspopup="true" aria-expanded="false" aria-label="<?php esc_attr_e( 'More options', 'jetpack-mu-wpcom' ); ?>">
					<?php wpcom_actionbar_icon( 'more-horizontal', 24 ); ?>
				</button>
				<div class="actnbr-popover actnbr-menu" role="menu" aria-label="<?php esc_attr_e( 'Site options', 'jetpack-mu-wpcom' ); ?>">
					<?php
					// Site.
					ob_start();
					wpcom_actionbar_menu_item(
						array(
							'href'   => $site_url,
							'label'  => $site_name,
							'class'  => 'actnbr-sitename',
							'before' => wpcom_actionbar_blavatar(),
						)
					);
					wpcom_actionbar_menu_group( ob_get_clean() );

					// This post or site.
					ob_start();
					if ( $is_singular ) {
						?>
						<a role="menuitem" class="actnbr-menu__item actnbr-shortlink" href="<?php echo esc_url( $shortlink ); ?>">
							<span class="actnbr-menu__label actnbr-shortlink__text"><?php esc_html_e( 'Copy shortlink', 'jetpack-mu-wpcom' ); ?></span>
							<span class="actnbr-menu__icon actnbr-shortlink__icon"><?php wpcom_actionbar_icon( 'copy', 24 ); ?></span>
							<span class="actnbr-menu__icon actnbr-shortlink__icon-copied"><?php wpcom_actionbar_icon( 'check', 24 ); ?></span>
						</a>
						<?php
					}
					if ( $can_follow && $is_singular ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => 'https://wordpress.com/reader/blogs/' . (int) $site_id . '/posts/' . (int) $post_id,
								'label' => __( 'View post in Reader', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-reader',
							)
						);
					}
					if ( $can_follow && ! $is_singular ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => 'https://wordpress.com/reader/' . ( $feed_id ? 'feeds/' . (int) $feed_id : 'blogs/' . (int) $site_id ),
								'label' => __( 'View site in Reader', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-reader',
							)
						);
					}
					if ( $is_logged_in && ! $can_customize_site ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => $theme_url,
								'label' => __( 'Get theme', 'jetpack-mu-wpcom' ) . ': ' . wp_get_theme()->get( 'Name' ),
								'class' => 'actnbr-theme',
							)
						);
					}
					wpcom_actionbar_menu_group( ob_get_clean() );

					// Account.
					ob_start();
					if ( $is_logged_in && $is_following ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => 'https://wordpress.com/read/subscriptions/' . (int) $subscription_id,
								'label' => __( 'Manage subscription', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-follows',
							)
						);
					}
					if ( $is_logged_in && ! $is_following ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => 'https://wordpress.com/read/subscriptions?s=' . rawurlencode( (string) $site_host ),
								'label' => __( 'Manage subscriptions', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-follows',
							)
						);
					}
					if ( ! $is_logged_in ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => 'https://subscribe.wordpress.com/',
								'label' => __( 'Manage subscriptions', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-subs',
							)
						);
						wpcom_actionbar_menu_item(
							array(
								'href'  => $signup_url,
								'label' => __( 'Sign up', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-signup',
							)
						);
						wpcom_actionbar_menu_item(
							array(
								'href'  => $login_url,
								'label' => __( 'Log in', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-login',
							)
						);
					}
					wpcom_actionbar_menu_group( ob_get_clean() );

					// Report.
					ob_start();
					if ( ! $can_customize_site ) {
						$report_url = add_query_arg(
							'report_url',
							$is_singular ? get_permalink( $post_id ) : $site_url,
							// phpcs:ignore WPCOM.I18nRules.LocalizedUrl.UnlocalizedUrl
							'https://wordpress.com/abuse/'
						);
						wpcom_actionbar_menu_item(
							array(
								'href'  => $report_url,
								'label' => __( 'Report this content', 'jetpack-mu-wpcom' ),
								'class' => 'flb-report',
								'icon'  => 'external',
								'blank' => true,
							)
						);
					}
					wpcom_actionbar_menu_group( ob_get_clean() );

					// Bar.
					ob_start();
					if ( $is_logged_in || $can_follow ) {
						wpcom_actionbar_menu_item(
							array(
								'href'  => '',
								'label' => $is_folded ? __( 'Expand this bar', 'jetpack-mu-wpcom' ) : __( 'Collapse this bar', 'jetpack-mu-wpcom' ),
								'class' => 'actnbr-fold',
							)
						);
					}
					wpcom_actionbar_menu_group( ob_get_clean() );
					?>
				</div>
			</li>
		</ul>
	</div>
	<?php

	// Switch back to site language.
	wpcom_actionbar_restore_locale();
}

/**
 * Whether the post can be reblogged and the viewer is allowed to reblog.
 *
 * @param int $site_id Blog ID.
 * @param int $post_id Post ID.
 * @return bool
 */
function wpcom_actionbar_can_reblog( $site_id, $post_id ) {
	if ( ! function_exists( 'wpr_can_reblog_post' ) || ! function_exists( 'wpcom_can_user_make_a_reblog' ) ) {
		return false;
	}
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$post_ok = (bool) wpr_can_reblog_post( $site_id, $post_id );
	// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
	$user_ok = (bool) wpcom_can_user_make_a_reblog();
	return $post_ok && $user_ok;
}

/**
 * Whether the WordAds consent manager is on and the visitor is in a GDPR region.
 *
 * @return bool
 */
function wpcom_actionbar_gdpr_applies() {
	if ( ! class_exists( 'WordAds_Consent_Management_Provider' ) && defined( 'WP_CONTENT_DIR' ) ) {
		$provider_file = WP_CONTENT_DIR . '/blog-plugins/wordads-classes/class-wordads-consent-management-provider.php';
		if ( file_exists( $provider_file ) ) {
			require_once $provider_file;
		}
	}
	if ( ! class_exists( 'WordAds_Consent_Management_Provider' ) ) {
		return false;
	}
	// @phan-suppress-next-line PhanUndeclaredClassMethod -- wpcom-only class, guarded by class_exists above.
	return WordAds_Consent_Management_Provider::is_feature_enabled() && WordAds_Consent_Management_Provider::does_gdpr_apply();
}

/**
 * Bump one of the whitelisted action bar stats.
 *
 * Logged-in clicks land in the `actionbar` MC stat, logged-out clicks in `actionbar_logged_out`.
 *
 * @param string $stat_value The stat to bump.
 */
function wpcom_actionbar_bump_stat( $stat_value ) {
	$whitelist = array(
		'clicked_login_link',
		'clicked_login_nudge',
		'clicked_manage_subs_link',
		'clicked_signup_link',
		'clicked_site_title',
		'clicked_stats',
		'copied_shortlink',
		'customized',
		'edited',
		'expanded',
		'explored_theme',
		'folded',
		'followed',
		'managed_following',
		'reported_content',
		'show_follow_form',
		'show_more_menu',
		'submit_follow_form',
		'unfollowed',
		'view_reader',
		'comment_clicked',
	);

	if ( ! in_array( $stat_value, $whitelist, true ) ) {
		return;
	}

	if ( ! function_exists( 'bump_stats_extras' ) ) {
		return;
	}

	$stat_name = 'actionbar';

	if ( ! is_user_logged_in() ) {
		$stat_name .= '_logged_out';
	}

	bump_stats_extras( $stat_name, $stat_value );
}

/**
 * Ajax: remember that the user collapsed the bar.
 *
 * @return never
 */
function wpcom_actionbar_fold() {
	check_ajax_referer( 'manage_subscription' );
	wpcom_actionbar_bump_stat( 'folded' );

	if ( is_user_logged_in() ) {
		update_user_attribute( get_current_user_id(), 'is_actionbar_folded', 1 );
	}

	die;
}

add_action( 'wp_ajax_fold_actionbar', 'wpcom_actionbar_fold' );
add_action( 'wp_ajax_nopriv_fold_actionbar', 'wpcom_actionbar_fold' );

/**
 * Ajax: forget that the user collapsed the bar.
 *
 * @return never
 */
function wpcom_actionbar_unfold() {
	check_ajax_referer( 'manage_subscription' );
	wpcom_actionbar_bump_stat( 'expanded' );

	if ( is_user_logged_in() && function_exists( 'delete_user_attribute' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only, guarded by function_exists(); stub pending in wpcom stub-defs.php.
		delete_user_attribute( get_current_user_id(), 'is_actionbar_folded' );
	}

	die;
}

add_action( 'wp_ajax_unfold_actionbar', 'wpcom_actionbar_unfold' );
add_action( 'wp_ajax_nopriv_unfold_actionbar', 'wpcom_actionbar_unfold' );

/**
 * Ajax: bump a click stat sent by the JS.
 *
 * @return never
 */
function wpcom_actionbar_ajax_stats() {
	check_ajax_referer( 'manage_subscription' );
	$stat_value = isset( $_REQUEST['stat'] ) ? sanitize_key( wp_unslash( $_REQUEST['stat'] ) ) : '';

	wpcom_actionbar_bump_stat( $stat_value );

	die;
}

add_action( 'wp_ajax_actionbar_stats', 'wpcom_actionbar_ajax_stats' );
add_action( 'wp_ajax_nopriv_actionbar_stats', 'wpcom_actionbar_ajax_stats' );

/**
 * Add the Action Bar visibility setting to the General settings page.
 *
 * Stored in the `wpcom_hide_action_bar` option.
 */
function wpcom_hide_action_bar_settings_field() {
	add_settings_field( 'wpcom_hide_action_bar', __( 'Action Bar visibility', 'jetpack-mu-wpcom' ), 'wpcom_hide_action_bar_display', 'general', 'default', array( 'label_for' => 'wpcom_hide_action_bar' ) );

	register_setting( 'general', 'wpcom_hide_action_bar' );
}

/**
 * Render the `wpcom_hide_action_bar` checkbox.
 */
function wpcom_hide_action_bar_display() {
	?>
	<input type="checkbox" id="wpcom_hide_action_bar" name="wpcom_hide_action_bar" value="1" <?php checked( 1, get_option( 'wpcom_hide_action_bar' ) ); ?> />

	<?php esc_html_e( 'Hide the Action Bar on the front end of the site.', 'jetpack-mu-wpcom' ); ?>

	<p class="description"><a href="<?php echo esc_url( localized_wpcom_url( 'https://wordpress.com/support/action-bar/' ) ); ?>" data-target="wpcom-help-center"><?php esc_html_e( 'Learn more about the Action Bar', 'jetpack-mu-wpcom' ); ?></a>.</p>
	<?php
}
add_action( 'admin_init', 'wpcom_hide_action_bar_settings_field' );
