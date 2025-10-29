import { __ } from '@wordpress/i18n';
import logo from '../logos/boost-logo';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getBoostConfig(): ProductConfig {
	const {
		INCLUDED,
		NOT_INCLUDED,
		FREE,
		START_FOR_FREE,
		GET_COMPLETE,
		REAL_TIME_BACKUPS,
		MALWARE_SCANNING,
		INSTANT_SITE_SEARCH,
		DETAILED_STATS,
		SOCIAL_TOOLS,
		VIDEO_HOSTING_1TB,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'Improves your site performance.', 'jetpack-my-jetpack' ),
		logo,
		bundle: COMPLETE_SLUG,
		features: [
			{
				name: __( 'Auto CSS Optimization', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Manual', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'All Jetpack Boost features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Historical performance scores', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: REAL_TIME_BACKUPS,
				},
			},
			{
				name: __( 'Dedicated email support', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: MALWARE_SCANNING,
				},
			},
			{
				name: __( 'Page Cache', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Spam filtering for comments and forms', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Image CDN Quality Settings', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'AI-powered writing and image generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Image CDN Auto-Resize Lazy Images', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: INSTANT_SITE_SEARCH },
			},
			{
				name: __( 'Image CDN', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: DETAILED_STATS,
				},
			},
			{
				name: __( 'Image guide', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: SOCIAL_TOOLS },
			},
			{
				name: __( 'Defer non-essential JavaScript', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: VIDEO_HOSTING_1TB,
				},
			},
			{
				name: __( 'Concatenate JS and CSS', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: PRIORITY_SUPPORT },
			},
			{
				name: PRIORITY_SUPPORT,
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: '' },
			},
		],
		tiers: {
			free: {
				name: FREE,
				cta: START_FOR_FREE,
			},
			paid: {
				name: 'Boost',
				cta: __( 'Get Boost', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
