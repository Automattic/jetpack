<?php
/**
 * Feature Catalog registrations for the bundled Jetpack modules.
 *
 * One feature per Jetpack module, seeded from each module's header (connection level,
 * category, title, description). Entitlements are STRING slugs and only set where known;
 * never \WPCOM_Features constants.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'Automattic\Jetpack\Features\register_feature' ) ) {
			return;
		}

		register_feature(
			'account-protection',
			array(
				'title'       => __( 'Account Protection', 'jetpack' ),
				'description' => __( 'Shield your login page with rate‑limiting and secure authentication safeguards.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'site',
				'module'      => 'account-protection',
			)
		);

		register_feature(
			'blaze',
			array(
				'title'       => __( 'Blaze', 'jetpack' ),
				'description' => __( 'Promote your posts and pages across millions of sites in the WordPress.com and Tumblr ad network.', 'jetpack' ),
				'category'    => 'other',
				'connection'  => 'site',
				'module'      => 'blaze',
			)
		);

		register_feature(
			'canonical-urls',
			array(
				'title'       => __( 'Canonical URLs', 'jetpack' ),
				'description' => __( 'Add canonical URL tags to archive pages to prevent duplicate content in search engines.', 'jetpack' ),
				'category'    => 'traffic',
				'connection'  => 'none',
				'module'      => 'canonical-urls',
			)
		);

		register_feature(
			'carousel',
			array(
				'title'       => __( 'Carousel', 'jetpack' ),
				'description' => __( 'Turn your image galleries into immersive, full‑screen slideshows.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'carousel',
			)
		);

		register_feature(
			'comment-likes',
			array(
				'title'       => __( 'Comment Likes', 'jetpack' ),
				'description' => __( 'Enable visitors to like individual comments and boost engagement.', 'jetpack' ),
				'category'    => 'other',
				'connection'  => 'site',
				'module'      => 'comment-likes',
			)
		);

		register_feature(
			'comments',
			array(
				'title'       => __( 'Comments', 'jetpack' ),
				'description' => __( 'Replace the default comment form with a modern, feature‑rich alternative.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'comments',
			)
		);

		register_feature(
			'contact-form',
			array(
				'title'       => __( 'Forms', 'jetpack' ),
				'description' => __( 'Add contact, registration, and feedback forms directly from the block editor.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'contact-form',
			)
		);

		register_feature(
			'copy-post',
			array(
				'title'       => __( 'Copy Post', 'jetpack' ),
				'description' => __( 'Duplicate any post or page in one click to speed up content creation.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'copy-post',
			)
		);

		register_feature(
			'custom-content-types',
			array(
				'title'       => __( 'Custom Content Types', 'jetpack' ),
				'description' => __( 'Display different types of content on your site with custom content types.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'custom-content-types',
			)
		);

		register_feature(
			'google-fonts',
			array(
				'title'       => __( 'Google Fonts (Beta)', 'jetpack' ),
				'description' => __( 'This feature is now supported natively in WordPress when using any block theme. To use Google Fonts, refer to the WordPress.org Font Library documentation.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'google-fonts',
			)
		);

		register_feature(
			'gravatar-hovercards',
			array(
				'title'       => __( 'Gravatar Hovercards', 'jetpack' ),
				'description' => __( 'Show a user’s Gravatar profile when visitors hover over their name or image.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'gravatar-hovercards',
			)
		);

		register_feature(
			'infinite-scroll',
			array(
				'title'       => __( 'Infinite Scroll', 'jetpack' ),
				'description' => __( 'Automatically load new posts as visitors scroll down your site.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'infinite-scroll',
			)
		);

		register_feature(
			'json-api',
			array(
				'title'       => __( 'JSON API', 'jetpack' ),
				'description' => __( 'Access your site’s data remotely through the WordPress.com REST API.', 'jetpack' ),
				'category'    => 'general',
				'connection'  => 'site',
				'module'      => 'json-api',
			)
		);

		register_feature(
			'latex',
			array(
				'title'       => __( 'Beautiful Math', 'jetpack' ),
				'description' => __( 'Add beautifully formatted math equations to your posts and pages using LaTeX.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'latex',
			)
		);

		register_feature(
			'likes',
			array(
				'title'       => __( 'Likes', 'jetpack' ),
				'description' => __( 'Let readers like your posts to show appreciation and encourage interaction.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'likes',
			)
		);

		register_feature(
			'markdown',
			array(
				'title'       => __( 'Markdown', 'jetpack' ),
				'description' => __( 'Write and format posts using clean, readable Markdown syntax.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'markdown',
			)
		);

		register_feature(
			'monitor',
			array(
				'title'       => __( 'Downtime Monitor', 'jetpack' ),
				'description' => __( 'Get instant alerts if your site goes down and know when it’s back online.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'user',
				'module'      => 'monitor',
			)
		);

		register_feature(
			'notes',
			array(
				'title'       => __( 'Notifications', 'jetpack' ),
				'description' => __( 'Receive real‑time notifications about site activity across your devices.', 'jetpack' ),
				'category'    => 'general',
				'connection'  => 'user',
				'module'      => 'notes',
			)
		);

		register_feature(
			'photon',
			array(
				'title'       => __( 'Image CDN', 'jetpack' ),
				'description' => __( 'Deliver images quickly with automatic resizing from Jetpack’s global image CDN.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'site',
				'module'      => 'photon',
			)
		);

		register_feature(
			'photon-cdn',
			array(
				'title'       => __( 'Asset CDN', 'jetpack' ),
				'description' => __( 'Serve static files like CSS and JS from Jetpack’s global CDN for faster load times.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'photon-cdn',
			)
		);

		register_feature(
			'podcast',
			array(
				'title'       => __( 'Podcast', 'jetpack' ),
				'description' => __( 'Publish, manage, and grow your podcast right from your site.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'site',
				'module'      => 'podcast',
			)
		);

		register_feature(
			'post-by-email',
			array(
				'title'       => __( 'Post by Email', 'jetpack' ),
				'description' => __( 'Publish blog posts simply by sending an email to a custom address.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'user',
				'module'      => 'post-by-email',
			)
		);

		register_feature(
			'post-list',
			array(
				'title'       => __( 'Post List', 'jetpack' ),
				'description' => __( 'Display a customizable list of your latest posts anywhere on your site.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'post-list',
			)
		);

		register_feature(
			'protect',
			array(
				'title'       => __( 'Brute Force Protection', 'jetpack' ),
				'description' => __( 'Block malicious login attempts automatically and keep hackers out.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'site',
				'module'      => 'protect',
			)
		);

		register_feature(
			'publicize',
			array(
				'title'       => __( 'Jetpack Social', 'jetpack' ),
				'description' => __( 'Auto‑share your posts to social networks and track engagement in one place.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'publicize',
			)
		);

		register_feature(
			'related-posts',
			array(
				'title'       => __( 'Related Posts', 'jetpack' ),
				'description' => __( 'Automatically display related articles to keep visitors reading longer.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'related-posts',
			)
		);

		register_feature(
			'search',
			array(
				'title'       => __( 'Search', 'jetpack' ),
				'description' => __( 'Instantly deliver the most relevant results to your visitors.', 'jetpack' ),
				'category'    => 'search',
				'connection'  => 'site',
				'entitlement' => 'search',
				'module'      => 'search',
			)
		);

		register_feature(
			'seo-tools',
			array(
				'title'       => __( 'SEO Tools', 'jetpack' ),
				'description' => __( 'Optimize titles, meta descriptions, and social previews for better search results.', 'jetpack' ),
				'category'    => 'traffic',
				'connection'  => 'none',
				'module'      => 'seo-tools',
			)
		);

		register_feature(
			'sharedaddy',
			array(
				'title'       => __( 'Sharing', 'jetpack' ),
				'description' => __( 'Add customizable share buttons so visitors can spread your content.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'none',
				'module'      => 'sharedaddy',
			)
		);

		register_feature(
			'shortcodes',
			array(
				'title'       => __( 'Shortcode Embeds', 'jetpack' ),
				'description' => __( 'Easily embed rich media like YouTube videos and tweets using simple shortcodes.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'none',
				'module'      => 'shortcodes',
			)
		);

		register_feature(
			'shortlinks',
			array(
				'title'       => __( 'WP.me Shortlinks', 'jetpack' ),
				'description' => __( 'Share short, easy-to-remember links to your posts and pages.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'site',
				'module'      => 'shortlinks',
			)
		);

		register_feature(
			'sitemaps',
			array(
				'title'       => __( 'Sitemaps', 'jetpack' ),
				'description' => __( 'Generate XML sitemaps so search engines can index your site efficiently.', 'jetpack' ),
				'category'    => 'other',
				'connection'  => 'none',
				'module'      => 'sitemaps',
			)
		);

		register_feature(
			'sso',
			array(
				'title'       => __( 'Secure Sign On', 'jetpack' ),
				'description' => __( 'Let users log in with their WordPress.com account for quick, secure access.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'user',
				'module'      => 'sso',
			)
		);

		register_feature(
			'stats',
			array(
				'title'       => __( 'Jetpack Stats', 'jetpack' ),
				'description' => __( 'Clear, concise traffic insights right in your WordPress dashboard.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'stats',
			)
		);

		register_feature(
			'subscriptions',
			array(
				'title'       => __( 'Newsletter', 'jetpack' ),
				'description' => __( 'Grow your subscriber list and deliver your content directly to their email inbox.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'user',
				'module'      => 'subscriptions',
			)
		);

		register_feature(
			'tiled-gallery',
			array(
				'title'       => __( 'Tiled Galleries', 'jetpack' ),
				'description' => __( 'Create visually engaging tiled image galleries with multiple layout options.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'tiled-gallery',
			)
		);

		register_feature(
			'vaultpress',
			array(
				'title'       => __( 'VaultPress Backup', 'jetpack' ),
				'description' => __( 'Real-time backups save every change, and one-click restores get you back online quickly.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'site',
				'entitlement' => 'backups',
				'module'      => 'vaultpress',
			)
		);

		register_feature(
			'verification-tools',
			array(
				'title'       => __( 'Site Verification', 'jetpack' ),
				'description' => __( 'Verify your site with search engines and social platforms in a couple of clicks.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'none',
				'module'      => 'verification-tools',
			)
		);

		register_feature(
			'videopress',
			array(
				'title'       => __( 'VideoPress', 'jetpack' ),
				'description' => __( 'Powerful and flexible video hosting.', 'jetpack' ),
				'category'    => 'writing',
				'connection'  => 'site',
				'entitlement' => 'videopress',
				'module'      => 'videopress',
			)
		);

		register_feature(
			'waf',
			array(
				'title'       => __( 'Firewall', 'jetpack' ),
				'description' => __( 'Filter malicious traffic in real time with Jetpack’s site firewall.', 'jetpack' ),
				'category'    => 'security',
				'connection'  => 'site',
				'module'      => 'waf',
			)
		);

		register_feature(
			'widget-visibility',
			array(
				'title'       => __( 'Widget Visibility', 'jetpack' ),
				'description' => __( 'Choose which widgets appear on specific pages or posts with advanced controls.', 'jetpack' ),
				'category'    => 'appearance',
				'connection'  => 'none',
				'module'      => 'widget-visibility',
			)
		);

		register_feature(
			'woocommerce-analytics',
			array(
				'title'       => __( 'WooCommerce Analytics', 'jetpack' ),
				'description' => __( 'Get actionable insights on your store’s orders, revenue, and customers.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'site',
				'module'      => 'woocommerce-analytics',
			)
		);

		register_feature(
			'wordads',
			array(
				'title'       => __( 'Ads', 'jetpack' ),
				'description' => __( 'Earn revenue by displaying high‑quality ads on your site.', 'jetpack' ),
				'category'    => 'other',
				'connection'  => 'site',
				'entitlement' => 'wordads',
				'module'      => 'wordads',
			)
		);

		register_feature(
			'wpcom-reader',
			array(
				'title'       => __( 'WordPress.com Reader', 'jetpack' ),
				'description' => __( 'Quickly access the WordPress.com Reader from your site\'s admin bar.', 'jetpack' ),
				'category'    => 'engagement',
				'connection'  => 'none',
				'module'      => 'wpcom-reader',
			)
		);

		// Sub-module granularity examples: Forms features beyond the base module.
		register_feature(
			'forms-multistep',
			array(
				'title'           => __( 'Multi-step forms', 'jetpack' ),
				'description'     => __( 'Break long forms into steps.', 'jetpack' ),
				'category'        => 'writing',
				'connection'      => 'none',
				'module'          => 'contact-form',
				'available_since' => array( 'jetpack' => '14.2' ),
				'recommend'       => array( 'high_content_volume' ),
			)
		);

		register_feature(
			'forms-file-uploads',
			array(
				'title'       => __( 'File upload field', 'jetpack' ),
				'description' => __( 'Let visitors attach files to submissions.', 'jetpack' ),
				'category'    => 'writing',
				'entitlement' => 'field-file',
				'connection'  => 'user',
				'module'      => 'contact-form',
			)
		);
	}
);
