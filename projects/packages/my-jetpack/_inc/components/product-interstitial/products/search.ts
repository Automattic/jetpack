import { __ } from '@wordpress/i18n';
import logo from '../logos/search-logo';
import { ProductConfig } from '../types';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getSearchConfig(): ProductConfig {
	return {
		title: __( 'Help visitors find exactly what they need', 'jetpack-my-jetpack' ),
		logo,
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
	};
}
