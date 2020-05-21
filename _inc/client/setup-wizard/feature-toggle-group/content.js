/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';

const featureGroups = {
	security: {
		title: __( 'Security' ),
		details: __(
			'Keep your site backed up, prevent unwanted intrusions, find issues with malware scanning, and stop spammers in their tracks.'
		),
		features: [ 'backups', 'scan', 'anti-spam', 'brute-force-protect', 'monitor', 'sso' ],
	},
	performance: {
		title: __( 'Performance' ),
		details: __(
			'Load pages faster! Shorter load times can lead to happier readers, more page views, and — if you’re running a store — improved sales.'
		),
		features: [
			'site-accelerator',
			'lazy-images',
			'search',
			'infinite-scroll',
			'site-stats',
			'videopress',
		],
	},
	marketing: {
		title: __( 'Marketing' ),
		details: __(
			'Increase visitors with social integrations, keep them engaged with related content, and so much more.'
		),
		features: [
			'contact-form',
			'likes',
			'comment-likes',
			'google-analytics',
			'notifications',
			'publicize',
			'related-posts',
			'sharing',
			'site-verification',
			'seo',
			'sitemaps',
			'subscriptions',
			'shortlinks',
			'ads',
			'simple-payments-block',
		],
	},
	publishing: {
		title: __( 'Design & Publishing' ),
		details: __(
			'Customize your homepage, blog posts, sidebars, and widgets — all without touching any code.'
		),
		features: [
			'beautiful-math',
			'carousel',
			'comments',
			'copy-post',
			'custom-css',
			'testimonials',
			'portfolio',
			'enhanced-distribution',
			'extra-sidebar-widgets',
			'gravatar-hovercards',
			'json-api',
			'markdown',
			'masterbar',
			'post-by-email',
			'shortcodes',
			'tiled-galleries',
			'widget-visibility',
		],
	},
};

export const recommendedFeatureGroups = [
	featureGroups.security,
	featureGroups.performance,
	featureGroups.marketing,
	featureGroups.publishing,
];
