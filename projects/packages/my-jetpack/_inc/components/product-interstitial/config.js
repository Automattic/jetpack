// Logo imports - using correct file extensions
import SocialLogo from './logos/social-logo';

// Product configuration for pricing tables
export const PRODUCT_CONFIGS = {
	social: {
		title: 'Auto-share to social media',
		logo: SocialLogo,
		bundle: 'complete',
		features: [
			{
				name: 'Automatically share your posts and products on social media',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'All Social features' },
			},
			{
				name: 'Post to multiple channels at once',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Detailed stats and insights' },
			},
			{
				name: 'Manage all of your channels from a single hub',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'AI-powered writing and image generation' },
			},
			{
				name: 'Scheduled posts',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Instant site search' },
			},
			{
				name: 'Share to 8 social networks',
				tooltipInfo:
					'Share to Facebook, Instagram, Threads, Bluesky, LinkedIn, Mastodon, Tumblr, and Nextdoor.',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Real-time backups and one-click restores' },
			},
			{
				name: 'Recycle content',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: 'Automatically generate images for posts',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Spam filtering for comments and forms' },
			},
			{
				name: 'Upload custom images or videos with your posts',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Site performance and SEO optimization' },
			},
			{
				name: 'Priority support',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Video hosting (1TB, ad-free)' },
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: 'Priority support' },
			},
		],
		tiers: {
			free: { name: 'Free', cta: 'Start for Free' },
			paid: { name: 'Social', cta: 'Get Social' },
			bundle: { name: 'Complete', cta: 'Get Complete' },
		},
	},
};
