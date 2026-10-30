<?php
/**
 * A lightweight My Jetpack page for WordPress.com Simple sites.
 *
 * The My Jetpack package doesn't run on Simple without the `my-jetpack` sticker, so this page lists
 * what the site's Jetpack menu already holds. It keeps the top-level Jetpack link on one stable page
 * until the Simple approach for My Jetpack proper is settled.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the page under Jetpack, unless the real My Jetpack already claimed the slug.
 */
function wpcom_add_simple_my_jetpack_page() {
	global $submenu;

	if ( in_array( 'my-jetpack', array_column( $submenu['jetpack'] ?? array(), 2 ), true ) ) {
		return;
	}

	add_submenu_page(
		'jetpack',
		__( 'My Jetpack', 'jetpack-mu-wpcom' ),
		__( 'My Jetpack', 'jetpack-mu-wpcom' ),
		'edit_posts',
		'my-jetpack',
		'wpcom_render_simple_my_jetpack_page'
	);
}

/**
 * Gets the one-line description for a Jetpack menu item.
 *
 * A tool missing from this list still shows, with its title alone.
 *
 * @param string $slug The menu item's slug, without the site's domain.
 * @return string The description, or an empty string.
 */
function wpcom_get_simple_my_jetpack_description( $slug ) {
	$descriptions = array(
		'activity-log'       => __( 'See every change made to this site', 'jetpack-mu-wpcom' ),
		'akismet'            => __( 'Filter spam from comments and forms', 'jetpack-mu-wpcom' ),
		'backup'             => __( 'Restorable copies of your site', 'jetpack-mu-wpcom' ),
		'advertising'        => __( 'Promote posts across WordPress.com and Tumblr', 'jetpack-mu-wpcom' ),
		'forms'              => __( 'Collect and review form responses', 'jetpack-mu-wpcom' ),
		'wordpress.com/earn' => __( 'Earn from ads, donations and paid content', 'jetpack-mu-wpcom' ),
		'newsletter'         => __( 'Send your posts to subscribers', 'jetpack-mu-wpcom' ),
		'podcast'            => __( 'Publish your posts as a podcast feed', 'jetpack-mu-wpcom' ),
		'scan'               => __( 'Check your site for malware and threats', 'jetpack-mu-wpcom' ),
		'search'             => __( 'Fast, relevant search for your visitors', 'jetpack-mu-wpcom' ),
		'seo'                => __( 'Titles and descriptions for search engines', 'jetpack-mu-wpcom' ),
		'social'             => __( 'Share posts to your social accounts', 'jetpack-mu-wpcom' ),
		'marketing/traffic'  => __( 'Analytics and site verification', 'jetpack-mu-wpcom' ),
		'videopress'         => __( 'Ad-free video hosting', 'jetpack-mu-wpcom' ),
	);

	foreach ( $descriptions as $key => $description ) {
		if ( str_contains( $slug, $key ) ) {
			return $description;
		}
	}

	return '';
}

/**
 * Gets the icon for a Jetpack menu item, from the same set as jetpack.com's product menu.
 *
 * A tool missing from this list gets the Jetpack mark.
 *
 * @param string $slug The menu item's slug, without the site's domain.
 * @return string The icon's static SVG markup.
 */
function wpcom_get_simple_my_jetpack_icon( $slug ) {
	$icons = array(
		'activity-log'       => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
		'akismet'            => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path d="M8.95474 21.2068L16.9547 3.70678L16.0453 3.29102L14.7837 6.05069C14.0991 5.69861 13.3228 5.49987 12.5 5.49987C11.4385 5.49987 10.4543 5.83064 9.6448 6.39473L7.68994 4.43988L6.62928 5.50054L8.55556 7.42682C7.99044 8.15115 7.62047 9.03518 7.52469 9.99987H5.5V11.4999H7.5V12.9999H5.5V14.4999H7.60002C7.85089 15.7358 8.5576 16.8061 9.53703 17.5278L8.04526 20.791L8.95474 21.2068ZM10.1802 16.1208C9.45633 15.4795 9 14.543 9 13.4999V10.4999C9 8.56688 10.567 6.99987 12.5 6.99987C13.1003 6.99987 13.6653 7.15099 14.159 7.41726L10.1802 16.1208ZM15.8555 9.50143L16.6645 7.73179C17.1053 8.39371 17.3926 9.16671 17.4753 9.99987H19.5V11.4999H17.5V12.9999H19.5V14.4999H17.4C16.9367 16.7821 14.919 18.4999 12.5 18.4999C12.2508 18.4999 12.0058 18.4817 11.7664 18.4465L12.428 16.9992C12.4519 16.9997 12.4759 16.9999 12.5 16.9999C14.433 16.9999 16 15.4329 16 13.4999V10.4999C16 10.153 15.9495 9.81782 15.8555 9.50143Z" fill="currentColor"/></svg>',
		'backup'             => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.3837 8.97C8.33383 8.96797 8.2837 8.96694 8.23333 8.96694C6.17147 8.96694 4.5 10.6906 4.5 12.8169C4.5 14.9432 6.17147 16.6669 8.23333 16.6669L8.25555 16.6668H17.2819L17.2996 16.6669C19.0669 16.6669 20.4996 15.1894 20.4996 13.3669C20.4996 11.7318 19.3465 10.3744 17.8331 10.1125L17.8333 10.0669C17.8333 7.63694 15.6843 5.66699 13.0333 5.66699C10.7955 5.66699 8.91541 7.07072 8.3837 8.97ZM16.3191 11.3728L16.3332 10.0959L16.3333 10.0669C16.3333 8.58555 14.9814 7.16699 13.0333 7.16699C11.4061 7.16699 10.1623 8.18081 9.82817 9.37438L9.50824 10.5172L8.32248 10.4687C8.293 10.4675 8.26328 10.4669 8.23333 10.4669C7.04307 10.4669 6 11.4752 6 12.8169C6 14.1572 7.04088 15.1648 8.22957 15.1669L8.25105 15.1668H17.2904L17.2996 15.1669C18.1953 15.1669 18.9996 14.4048 18.9996 13.3669C18.9996 12.4406 18.3512 11.7245 17.5773 11.5906L16.3191 11.3728Z" fill="currentColor"/></svg>',
		'advertising'        => '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 13.3474C21 14.4515 20.7653 15.5398 20.3066 16.5602C19.8479 17.5805 19.1812 18.5067 18.3332 19.2863C17.4905 20.066 16.4878 20.6834 15.3837 21.1073C14.8611 21.3061 14.3224 21.4578 13.773 21.5625L14.0183 21.4317C14.0183 21.4317 16.1411 20.2177 16.5625 17.4968C16.7598 15.0689 14.7437 14.0067 14.7437 14.0067C14.7437 14.0067 13.7197 15.3035 12.2636 15.3035C9.97549 15.3035 10.3906 11.4967 10.3906 11.4967C10.3906 11.4967 6.91935 13.2846 6.91935 17.1776C6.91935 19.6108 9.3728 21.4055 9.3728 21.4055V21.4108C9.05279 21.327 8.73811 21.2224 8.42876 21.102C7.32471 20.6782 6.32199 20.0608 5.47929 19.2811C4.63658 18.5015 3.96455 17.5753 3.50587 16.5549C3.04718 15.5346 2.8125 14.4462 2.8125 13.3422C2.8125 9.6061 7.17537 5.98517 7.17537 5.98517C7.17537 5.98517 7.59139 8.82645 9.71948 8.82645C13.7197 8.82645 12.2636 2.4375 12.2636 2.4375C12.2636 2.4375 15.9011 4.56715 16.9945 10.2445C18.9792 9.98684 18.8132 7.4032 18.8132 7.4032C18.8132 7.4032 21 10.2445 21 13.3735" fill="currentColor"/></svg>',
		'forms'              => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
		'wordpress.com/earn' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
		'newsletter'         => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7ZM5 6.5H19C19.2761 6.5 19.5 6.72386 19.5 7V7.93754L12 13.5625L4.5 7.93746V7C4.5 6.72386 4.72386 6.5 5 6.5ZM4.5 9.81246V17C4.5 17.2761 4.72386 17.5 5 17.5H19C19.2761 17.5 19.5 17.2761 19.5 17V9.81254L12 15.4375L4.5 9.81246Z" fill="currentColor"/></svg>',
		'podcast'            => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
		'scan'               => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 3.17578L19.25 6.24378V10.8178C19.25 14.7178 16.746 18.4078 13.215 19.5728C12.7506 19.7259 12.2494 19.7259 11.785 19.5728C8.255 18.4088 5.75 14.7168 5.75 10.8178V6.24378L12.5 3.17578ZM7.25 7.20978V10.8178C7.25 14.1308 9.395 17.2058 12.255 18.1478C12.414 18.2008 12.586 18.2008 12.745 18.1478C15.605 17.2058 17.75 14.1308 17.75 10.8178V7.20978L12.5 4.82378L7.25 7.20978Z" fill="currentColor"/></svg>',
		'search'             => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path d="M13.5 5C10.2 5 7.5 7.7 7.5 11C7.5 12.4 8 13.7 8.8 14.7L5 18.5L6.1 19.6L9.9 15.8C10.9 16.6 12.2 17.1 13.6 17.1C16.9 17.1 19.6 14.4 19.6 11.1C19.6 7.8 16.8 5 13.5 5ZM13.5 15.5C11 15.5 9 13.5 9 11C9 8.5 11 6.5 13.5 6.5C16 6.5 18 8.5 18 11C18 13.5 16 15.5 13.5 15.5Z" fill="currentColor"/></svg>',
		'seo'                => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
		'social'             => '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M15.6 5V17.2181L8.39977 15.1089V18.9383H7.04977V14.7135L4.59748 13.9951C3.64878 13.7172 3 12.8719 3 11.9136V10.3045C3 9.3462 3.64878 8.50085 4.59748 8.22295L15.6 5ZM14.25 15.459L8.39977 13.7453L8.39977 8.47274L14.25 6.75905V15.459ZM7.04977 8.86819L7.04977 13.3499L4.98899 12.7462C4.60951 12.635 4.35 12.2969 4.35 11.9136V10.3045C4.35 9.92116 4.60951 9.58302 4.98899 9.47186L7.04977 8.86819ZM17.4 11.7621H21V10.4571H17.4V11.7621ZM20.9996 15.4591L17.3996 14.5891V13.2841L20.9996 14.1541V15.4591ZM17.4 8.93412L21 8.06412V6.75913L17.4 7.62912V8.93412Z" fill="currentColor"/></svg>',
		'marketing/traffic'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
		'videopress'         => '<svg viewBox="0 0 25 24" fill="none" aria-hidden="true"><path d="M19.2 3H5.8C4.5 3 3.5 4 3.5 5.3V18.7C3.5 20 4.5 21 5.8 21H19.2C20.5 21 21.5 20 21.5 18.7V5.3C21.5 4 20.5 3 19.2 3ZM20 18.7C20 19.1 19.6 19.5 19.2 19.5H5.8C5.4 19.5 5 19.1 5 18.7V5.3C5 4.9 5.4 4.5 5.8 4.5H19.2C19.6 4.5 20 4.9 20 5.3V18.7ZM10.5 15L15.5 12L10.5 9V15Z" fill="currentColor"/></svg>',
	);

	foreach ( $icons as $key => $icon ) {
		if ( str_contains( $slug, $key ) ) {
			return $icon;
		}
	}

	return '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 0C7.2 0 0 7.2 0 16s7.2 16 16 16 16-7.2 16-16S24.8 0 16 0zm-.8 18.9H7.3L15.2 3.5v15.4zm1.6 9.6V13.1h7.9L16.8 28.5z"/></svg>';
}

/**
 * Gets the tools to list: the visible Jetpack menu items, in menu order.
 *
 * @return array[] Items with `title`, `description`, `icon`, `url` and `external` keys.
 */
function wpcom_get_simple_my_jetpack_items() {
	global $submenu;

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	$items  = array();

	foreach ( $submenu['jetpack'] ?? array() as $item ) {
		if ( 'my-jetpack' === $item[2] || str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
			continue;
		}

		$host = wp_parse_url( $item[2], PHP_URL_HOST );
		if ( $host ) {
			$url = $item[2];
		} elseif ( str_contains( $item[2], '.php' ) ) {
			$url = admin_url( $item[2] );
		} else {
			$url = admin_url( 'admin.php?page=' . $item[2] );
		}

		$items[] = array(
			// Everything from the first span on is a count badge or similar, not the title.
			'title'       => wp_strip_all_tags( preg_replace( '#<span\b.*$#s', '', $item[0] ) ),
			'description' => wpcom_get_simple_my_jetpack_description( str_replace( $domain, '', $item[2] ) ),
			'icon'        => wpcom_get_simple_my_jetpack_icon( str_replace( $domain, '', $item[2] ) ),
			'url'         => $url,
			'external'    => $host && $host !== $domain,
		);
	}

	return $items;
}

/**
 * Renders the page.
 */
function wpcom_render_simple_my_jetpack_page() {
	$domain    = wp_parse_url( home_url(), PHP_URL_HOST );
	$plan      = wpcom_get_current_plan_name();
	$show_plan = current_user_can( 'manage_options' ) && ! get_option( 'wpcom_is_staging_site' );
	?>
	<div class="wpcom-my-jetpack">
		<div class="wpcom-my-jetpack__header">
			<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path fill="#069e08" d="M16 0C7.2 0 0 7.2 0 16s7.2 16 16 16 16-7.2 16-16S24.8 0 16 0ZM15 19H7l8-16v16Zm2 10V13h8l-8 16Z"></path></svg>
			<div>
				<h1><?php esc_html_e( 'My Jetpack', 'jetpack-mu-wpcom' ); ?></h1>
				<span><?php echo esc_html( $domain ); ?></span>
			</div>
		</div>
		<hr class="wp-header-end" />
		<div class="wpcom-my-jetpack__content">
			<div class="wpcom-my-jetpack__tools">
				<?php foreach ( wpcom_get_simple_my_jetpack_items() as $item ) : ?>
					<a class="wpcom-my-jetpack__tool" href="<?php echo esc_url( $item['url'] ); ?>">
						<span class="wpcom-my-jetpack__tool-icon">
							<?php
							// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static markup from wpcom_get_simple_my_jetpack_icon().
							echo $item['icon'];
							?>
						</span>
						<span class="wpcom-my-jetpack__tool-text">
							<strong><?php echo esc_html( $item['title'] ); ?></strong>
							<?php if ( $item['description'] ) : ?>
								<span><?php echo esc_html( $item['description'] ); ?></span>
							<?php endif; ?>
						</span>
						<?php if ( $item['external'] ) : ?>
							<span class="screen-reader-text"><?php esc_html_e( '(opens on WordPress.com)', 'jetpack-mu-wpcom' ); ?></span>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16L18 6M10 6h8v8"></path></svg>
						<?php else : ?>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>
						<?php endif; ?>
					</a>
				<?php endforeach; ?>
			</div>
			<?php if ( $show_plan ) : ?>
				<p class="wpcom-my-jetpack__plan">
					<?php if ( $plan ) : ?>
						<span>
							<?php
							/* translators: %s: the name of the site's WordPress.com plan, such as Free or Premium. */
							echo esc_html( sprintf( __( 'You\'re on the %s plan.', 'jetpack-mu-wpcom' ), $plan ) );
							?>
						</span>
					<?php endif; ?>
					<a href="<?php echo esc_url( "https://wordpress.com/plans/$domain" ); ?>"><?php esc_html_e( 'Compare plans', 'jetpack-mu-wpcom' ); ?></a>
				</p>
			<?php endif; ?>
		</div>
	</div>
	<?php
}
