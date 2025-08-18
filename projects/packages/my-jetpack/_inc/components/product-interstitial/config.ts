import { __ } from '@wordpress/i18n';
import { ComponentType } from 'react';
import BackupLogo from './logos/backup-logo';
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
export const getProductConfigs = (): ProductConfigs => ( {
	backup: {
		title: __( 'The best real-time WordPress backup plugin', 'jetpack-my-jetpack' ),
		logo: BackupLogo,
		bundle: 'security',
		features: [
			{
				name: __( 'Real-time backups', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Manual backups only', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Real-time cloud backups', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Cloud backup storage', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( '250 MB', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '10 GB', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( '10GB of backup storage', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'One-click restores', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '30-day history', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Automated malware scan', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Backup history', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Backup retention is still subject to the overall storage limit and usage.',
					'jetpack-my-jetpack'
				),
				free: { included: true, label: __( 'Latest snapshot only', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '30-day log', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'One-click fixes for threats', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Activity log', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Last 20 events', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Spam protection', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'File Browser (granular restore)', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'Copy to Staging', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'Scheduled Backups', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
		],
		tiers: {
			free: {
				name: __( 'Free', 'jetpack-my-jetpack' ),
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'Backup',
				cta: __( 'Get Backup', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Security',
				cta: __( 'Get Security', 'jetpack-my-jetpack' ),
			},
		},
	},
	boost: {
		title: __( 'Improves your site performance.', 'jetpack-my-jetpack' ),
		logo: BoostLogo,
		bundle: 'complete',
		features: [
			{
				name: __( 'Auto CSS Optimization', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Manual', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All Jetpack Boost features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Historical performance scores', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Dedicated email support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Malware scanning and security protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Page Cache', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Spam filtering for comments and forms', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Image CDN Quality Settings', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'AI-powered writing and image generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Image CDN Auto-Resize Lazy Images', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Instant site search', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Image CDN', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Image guide', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Social tools', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Defer non-essential JavaScript', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Video hosting (1TB, ad-free)', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Concatenate JS and CSS', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Priority support', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Priority support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
		],
		tiers: {
			free: {
				name: __( 'Free', 'jetpack-my-jetpack' ),
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'Boost',
				cta: __( 'Get Boost', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	},
	social: {
		title: __( 'Publish once. Share everywhere.', 'jetpack-my-jetpack' ),
		logo: SocialLogo,
		bundle: 'complete',
		features: [
			{
				name: __(
					'Automatically share your posts and products on social media',
					'jetpack-my-jetpack'
				),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All Social features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Post to multiple channels at once', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Manage all of your channels from a single hub', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'AI-powered writing and image generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Scheduled posts', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Schedule your social media posts to publish at optimal times.',
					'jetpack-my-jetpack'
				),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Instant site search', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Share to 8 social networks', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Share to Facebook, Instagram, Threads, Bluesky, LinkedIn, Mastodon, Tumblr, and Nextdoor.',
					'jetpack-my-jetpack'
				),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Recycle content', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Repurpose, reuse or republish already published content.',
					'jetpack-my-jetpack'
				),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Malware scanning and security protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Automatically generate images for posts', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Automatically create custom images, saving you hours of tedious work.',
					'jetpack-my-jetpack'
				),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Spam filtering for comments and forms', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Upload custom images or videos with your posts', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Site performance and SEO optimization', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Priority support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Video hosting (1TB, ad-free)', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: __( 'Priority support', 'jetpack-my-jetpack' ) },
			},
		],
		tiers: {
			free: {
				name: __( 'Free', 'jetpack-my-jetpack' ),
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'Social',
				cta: __( 'Get Social', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	},
	search: {
		title: __( 'Help visitors find exactly what they need', 'jetpack-my-jetpack' ),
		logo: SearchLogo,
		bundle: 'complete',
		features: [
			{
				name: __( 'Number of Records', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( '5k Records', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '10k Records', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All Search features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Monthly Requests', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( '500 Requests', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '10k Requests', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Detailed stats and insights' },
			},
			{
				name: __( 'Unbranded Search', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Branding Removed', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'AI-powered writing and image generation' },
			},
			{
				name: __( 'Instant Search and indexing', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Real-time backups and one-click restores' },
			},
			{
				name: __( 'Powerful filtering', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: __( 'Supports 38 languages', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Spam filtering for comments and forms' },
			},
			{
				name: __( 'Spelling Correction', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Site performance and SEO optimization' },
			},
			{
				name: __( 'Priority support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Video hosting (1TB, ad-free)', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: __( 'Priority support', 'jetpack-my-jetpack' ) },
			},
		],
		tiers: {
			free: {
				name: __( 'Free', 'jetpack-my-jetpack' ),
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'Search',
				cta: __( 'Get Search', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	},
} );
