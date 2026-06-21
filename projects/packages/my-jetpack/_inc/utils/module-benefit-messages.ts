import { __, sprintf, _x } from '@wordpress/i18n';
import { JetpackModuleSlug } from '../types';

/**
 * Benefit-driven success messages for module activation.
 *
 * These messages are shown when a module is successfully activated,
 * emphasizing the immediate value to the user.
 *
 * The benefit messages use present-tense descriptions of what the user NOW has.
 * Messages are interpolated as: "%1$s activated! %2$s" where %1$s is the module
 * name and %2$s is the benefit message.
 *
 * @return {Record<JetpackModuleSlug, string>} Module benefit messages.
 */
function getModuleBenefitMessages(): Record< JetpackModuleSlug, string > {
	return {
		'account-protection': __(
			'Your login page now has rate-limiting and secure authentication safeguards.',
			'jetpack-my-jetpack'
		),
		blaze: __(
			'You can now promote your posts across millions of sites in the WordPress.com and Tumblr ad network.',
			'jetpack-my-jetpack'
		),
		blocks: __(
			'Your editor now has custom Jetpack blocks for rich content and layout options.',
			'jetpack-my-jetpack'
		),
		'canonical-urls': __(
			'Your archive pages now have canonical URLs to prevent duplicate content in search engines.',
			'jetpack-my-jetpack'
		),
		carousel: __(
			'Your image galleries now display as immersive, full-screen slideshows.',
			'jetpack-my-jetpack'
		),
		'comment-likes': __(
			'Visitors can now like individual comments and boost engagement.',
			'jetpack-my-jetpack'
		),
		comments: __( 'Your site now has a modern, feature-rich comment form.', 'jetpack-my-jetpack' ),
		'contact-form': __(
			'You can now add contact, registration, and feedback forms directly from the block editor.',
			'jetpack-my-jetpack'
		),
		'copy-post': __( 'You can now duplicate any post or page in one click.', 'jetpack-my-jetpack' ),
		'custom-content-types': __(
			'Your site can now display different types of custom content.',
			'jetpack-my-jetpack'
		),
		'google-fonts': __(
			"You can now customize your site's typography with Google Fonts.",
			'jetpack-my-jetpack'
		),
		'gravatar-hovercards': __(
			"Visitors now see a user's Gravatar profile when they hover over names or images.",
			'jetpack-my-jetpack'
		),
		'infinite-scroll': __(
			'New posts now load automatically as visitors scroll down your site.',
			'jetpack-my-jetpack'
		),
		'json-api': __(
			"Your site's data is now accessible remotely through the WordPress.com REST API.",
			'jetpack-my-jetpack'
		),
		latex: __(
			'You can now add beautifully formatted math equations using LaTeX.',
			'jetpack-my-jetpack'
		),
		likes: __( 'Readers can now like your posts to show appreciation.', 'jetpack-my-jetpack' ),
		markdown: __(
			'You can now write and format posts using Markdown syntax.',
			'jetpack-my-jetpack'
		),
		monitor: __( "You'll now get instant alerts if your site goes down.", 'jetpack-my-jetpack' ),
		notes: __(
			'You now receive real-time notifications about site activity across your devices.',
			'jetpack-my-jetpack'
		),
		'photon-cdn': __(
			"Your site now serves static files from Jetpack's global CDN for faster load times.",
			'jetpack-my-jetpack'
		),
		photon: __(
			'Your site now loads images faster with automatic resizing from our global CDN.',
			'jetpack-my-jetpack'
		),
		podcast: __(
			'You can now publish, manage, and grow your podcast right from your site.',
			'jetpack-my-jetpack'
		),
		'post-by-email': __(
			'You can now publish blog posts by sending an email.',
			'jetpack-my-jetpack'
		),
		'post-list': __(
			'You can now display a customizable list of your latest posts anywhere on your site.',
			'jetpack-my-jetpack'
		),
		protect: __(
			'Your site now blocks malicious login attempts automatically.',
			'jetpack-my-jetpack'
		),
		publicize: __(
			'Your posts now auto-share to social networks and track engagement in one place.',
			'jetpack-my-jetpack'
		),
		'wpcom-reader': __(
			'You can now reach the WordPress.com Reader from your site, and join a community of creators and bloggers.',
			'jetpack-my-jetpack'
		),
		'related-posts': __(
			'Your site now displays related articles to keep visitors reading longer.',
			'jetpack-my-jetpack'
		),
		search: __(
			'Your visitors now get the most relevant search results instantly.',
			'jetpack-my-jetpack'
		),
		'seo-tools': __(
			'You can now optimize titles, meta descriptions, and social previews for better search results.',
			'jetpack-my-jetpack'
		),
		sharedaddy: __(
			'Visitors can now easily share your content with customizable share buttons.',
			'jetpack-my-jetpack'
		),
		shortcodes: __(
			'You can now easily embed rich media like YouTube videos and tweets.',
			'jetpack-my-jetpack'
		),
		shortlinks: __(
			'You can now share short, easy-to-remember links to your posts and pages.',
			'jetpack-my-jetpack'
		),
		sitemaps: __(
			'Search engines can now index your site more efficiently with XML sitemaps.',
			'jetpack-my-jetpack'
		),
		sso: __(
			'Users can now log in with their WordPress.com account for quick, secure access.',
			'jetpack-my-jetpack'
		),
		stats: __(
			'You now have clear, concise traffic insights right in your WordPress dashboard.',
			'jetpack-my-jetpack'
		),
		subscriptions: __(
			'You can now grow your subscriber list and deliver content to email inboxes.',
			'jetpack-my-jetpack'
		),
		'tiled-gallery': __(
			'You can now create visually engaging tiled image galleries with multiple layout options.',
			'jetpack-my-jetpack'
		),
		vaultpress: __(
			'Your site now has real-time backups with one-click restores.',
			'jetpack-my-jetpack'
		),
		'verification-tools': __(
			'You can now verify your site with search engines and social platforms easily.',
			'jetpack-my-jetpack'
		),
		videopress: __( 'You now have powerful and flexible video hosting.', 'jetpack-my-jetpack' ),
		waf: __(
			"Your site now filters malicious traffic in real time with Jetpack's firewall.",
			'jetpack-my-jetpack'
		),
		'widget-visibility': __(
			'You can now choose which widgets appear on specific pages with advanced controls.',
			'jetpack-my-jetpack'
		),
		widgets: __(
			'Your site now has more widget options like social feeds and subscriptions.',
			'jetpack-my-jetpack'
		),
		'woocommerce-analytics': __(
			"You now have actionable insights on your store's orders, revenue, and customers.",
			'jetpack-my-jetpack'
		),
		wordads: __(
			'Your site can now earn revenue by displaying high-quality ads.',
			'jetpack-my-jetpack'
		),
	};
}

/**
 * Get the benefit message for a module activation.
 *
 * @param {string} moduleSlug - The module slug.
 * @param {string} moduleName - The module display name.
 * @return {string} The benefit message.
 */
export function getModuleActivationMessage( moduleSlug: string, moduleName: string ): string {
	const benefits = getModuleBenefitMessages();
	const benefit = benefits[ moduleSlug ];

	if ( benefit ) {
		return sprintf(
			/* translators: 1: Module name, 2: The benefit of the module */
			_x(
				'%1$s activated! %2$s',
				'Message shown when a module is activated. 1: Module name, 2: The benefit of the module',
				'jetpack-my-jetpack'
			),
			moduleName,
			benefit
		);
	}

	// Fallback to generic message if no benefit message is defined
	return sprintf(
		/* translators: %s: Jetpack module name */
		_x( '%s has been activated.', '%s: Jetpack module name', 'jetpack-my-jetpack' ),
		moduleName
	);
}
