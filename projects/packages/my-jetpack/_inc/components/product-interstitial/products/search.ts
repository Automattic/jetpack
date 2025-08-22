import { __ } from '@wordpress/i18n';
import logo from '../logos/search-logo';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getSearchConfig(): ProductConfig {
	const {
		INCLUDED,
		NOT_INCLUDED,
		FREE,
		START_FOR_FREE,
		GET_COMPLETE,
		VIDEO_HOSTING_1TB,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'Help visitors find exactly what they need', 'jetpack-my-jetpack' ),
		logo,
		bundle: COMPLETE_SLUG,
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
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: 'Real-time backups and one-click restores' },
			},
			{
				name: __( 'Powerful filtering', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: 'Malware scanning and security protection' },
			},
			{
				name: __( 'Supports 38 languages', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: 'Spam filtering for comments and forms' },
			},
			{
				name: __( 'Spelling Correction', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: 'Site performance and SEO optimization' },
			},
			{
				name: PRIORITY_SUPPORT,
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: VIDEO_HOSTING_1TB,
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: PRIORITY_SUPPORT },
			},
		],
		tiers: {
			free: {
				name: FREE,
				cta: START_FOR_FREE,
			},
			paid: {
				name: 'Search',
				cta: __( 'Get Search', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
