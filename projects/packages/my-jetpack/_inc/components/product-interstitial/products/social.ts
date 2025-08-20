import { __ } from '@wordpress/i18n';
import logo from '../logos/social-logo';
import { ProductConfig } from '../types';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getSocialConfig(): ProductConfig {
	return {
		title: __( 'Publish once. Share everywhere.', 'jetpack-my-jetpack' ),
		logo,
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
	};
}
