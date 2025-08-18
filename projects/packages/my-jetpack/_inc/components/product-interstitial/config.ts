import { ComponentType } from 'react';
import BoostLogo from './logos/boost-logo';
import SearchLogo from './logos/search-logo';
import SocialLogo from './logos/social-logo';

/**
  Configuration types for product pricing tables
 */
export interface FeatureTier {
	included: boolean;
	label: string;
}

export interface ProductFeature {
	name: string;
	tooltipInfo?: string;
	free: FeatureTier;
	paid: FeatureTier;
	bundle: FeatureTier;
}

export interface ProductTier {
	name: string;
	cta: string;
}

export interface ProductConfig {
	title: string;
	logo: ComponentType< { height?: number } >;
	bundle: string;
	features: ProductFeature[];
	tiers: {
		free: ProductTier;
		paid: ProductTier;
		bundle: ProductTier;
	};
}

export interface ProductConfigs {
	[ productSlug: string ]: ProductConfig;
}

// Product configuration for pricing tables
export const PRODUCT_CONFIGS: ProductConfigs = {
	boost: {
		title: 'Optimize site performance and SEO',
		logo: BoostLogo,
		bundle: 'complete',
		features: [
			{
				name: 'Auto CSS Optimization',
				free: { included: false, label: 'Manual' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'All Jetpack Boost features' },
			},
			{
				name: 'Historical performance scores',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Real-time backups and one-click restores' },
			},
			{
				name: 'Dedicated email support',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: 'Page Cache',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Spam filtering for comments and forms' },
			},
			{
				name: 'Image CDN Quality Settings',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'AI-powered writing and image generation' },
			},
			{
				name: 'Image CDN Auto-Resize Lazy Images',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Instant site search' },
			},
			{
				name: 'Image CDN',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Detailed stats and insights' },
			},
			{
				name: 'Image guide',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Social tools' },
			},
			{
				name: 'Defer non-essential JavaScript',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Video hosting (1TB, ad-free)' },
			},
			{
				name: 'Concatenate JS and CSS',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Priority support' },
			},
			{
				name: 'Priority support',
				free: { included: false, label: 'Not included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: '' },
			},
		],
		tiers: {
			free: { name: 'Free', cta: 'Start for Free' },
			paid: { name: 'Boost', cta: 'Get Boost' },
			bundle: { name: 'Complete', cta: 'Get Complete' },
		},
	},
	social: {
		title: 'Publish once. Share everywhere.',
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
				tooltipInfo: 'Schedule your social media posts to publish at optimal times.',
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
				tooltipInfo: 'Repurpose, reuse or republish already published content.',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: 'Automatically generate images for posts',
				tooltipInfo: 'Automatically create custom images, saving you hours of tedious work.',
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
	search: {
		title: 'Help visitors find exactly what they need',
		logo: SearchLogo,
		bundle: 'complete',
		features: [
			{
				name: 'Number of Records',
				free: { included: true, label: '5k Records' },
				paid: { included: true, label: '10k Records' },
				bundle: { included: true, label: 'All Search features' },
			},
			{
				name: 'Monthly Requests',
				free: { included: true, label: '500 Requests' },
				paid: { included: true, label: '10k Requests' },
				bundle: { included: true, label: 'Detailed stats and insights' },
			},
			{
				name: 'Unbranded Search',
				free: { included: false, label: 'Not Included' },
				paid: { included: true, label: 'Branding Removed' },
				bundle: { included: true, label: 'AI-powered writing and image generation' },
			},
			{
				name: 'Instant Search and indexing',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Real-time backups and one-click restores' },
			},
			{
				name: 'Powerful filtering',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: 'Supports 38 languages',
				free: { included: true, label: 'Included' },
				paid: { included: true, label: 'Included' },
				bundle: { included: true, label: 'Spam filtering for comments and forms' },
			},
			{
				name: 'Spelling Correction',
				free: { included: true, label: 'Included' },
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
			paid: { name: 'Search', cta: 'Get Search' },
			bundle: { name: 'Complete', cta: 'Get Complete' },
		},
	},
};
