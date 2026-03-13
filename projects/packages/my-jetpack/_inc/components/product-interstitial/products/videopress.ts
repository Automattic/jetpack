import { __ } from '@wordpress/i18n';
import logo from '../logos/videopress-logo';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getVideoPressConfig(): ProductConfig {
	const {
		INCLUDED,
		NOT_INCLUDED,
		FREE,
		START_FOR_FREE,
		GET_COMPLETE,
		INSTANT_SITE_SEARCH,
		DETAILED_STATS,
		SOCIAL_TOOLS,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'Stunning‑quality video for WordPress', 'jetpack-my-jetpack' ),
		logo,
		bundle: COMPLETE_SLUG,
		features: [
			{
				name: __( 'Video Storage', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'One video', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '1TB of storage', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All VideoPress features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Built into WordPress editor', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Site performance and SEO optimization', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Ad-free and customizable player', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Unlimited users', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Malware scanning and security protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: PRIORITY_SUPPORT,
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Spam filtering for comments and forms', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: {
					included: true,
					label: __( 'AI-powered writing and image generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: INSTANT_SITE_SEARCH },
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: {
					included: true,
					label: DETAILED_STATS,
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: SOCIAL_TOOLS },
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
				name: 'VideoPress',
				cta: __( 'Get VideoPress', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
