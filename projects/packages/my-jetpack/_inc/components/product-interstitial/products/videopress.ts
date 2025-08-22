import { __ } from '@wordpress/i18n';
import logo from '../logos/videopress-logo';
import { ProductConfig } from '../types';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getVideoPressConfig(): ProductConfig {
	return {
		title: __( 'Stunning‑quality video for WordPress', 'jetpack-my-jetpack' ),
		logo,
		bundle: 'complete',
		features: [
			{
				name: __( 'Video Storage', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'One video', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '1TB of storage', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All VideoPress features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Built into WordPress editor', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Site performance and SEO optimization', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Ad-free and customizable player', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Unlimited users', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Malware scanning and security protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Priority support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
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
				bundle: { included: true, label: __( 'Instant site search', 'jetpack-my-jetpack' ) },
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: {
					included: true,
					label: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
				bundle: { included: true, label: __( 'Social tools', 'jetpack-my-jetpack' ) },
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
				name: 'VideoPress',
				cta: __( 'Get VideoPress', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	};
}
