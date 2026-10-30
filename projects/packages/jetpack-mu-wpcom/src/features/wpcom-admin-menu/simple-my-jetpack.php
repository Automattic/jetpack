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
 * Gets the tools to list: the visible Jetpack menu items, in menu order.
 *
 * @return array[] Items with `title`, `description`, `url` and `external` keys.
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
