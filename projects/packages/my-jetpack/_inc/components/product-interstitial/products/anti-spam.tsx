import { __ } from '@wordpress/i18n';
import antispamLogo from '../logos/antispam-logo.svg';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, SECURITY, SECURITY_SLUG } from './shared-labels';

const AntiSpamLogo = ( { height = 42 } ) => {
	return <img src={ antispamLogo } alt="Anti-Spam Logo" height={ height } />;
};

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getAntiSpamConfig(): ProductConfig {
	const { INCLUDED, NOT_INCLUDED, FREE, START_FOR_FREE, GET_SECURITY, PRIORITY_SUPPORT } =
		getTranslatableFeatureLabels();

	return {
		title: __( 'Automatically stop comment and form spam', 'jetpack-my-jetpack' ),
		logo: AntiSpamLogo,
		bundle: SECURITY_SLUG,
		features: [
			{
				name: __( 'Commercial usage', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Akismet spam protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Comment and form protection', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Real-time cloud backups', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Block spam without CAPTCHAs', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( '10GB of backup storage', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'API Calls / Month', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( '10K', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( '10K', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Automated malware scan', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: PRIORITY_SUPPORT,
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: 'One-click fixes for threats' },
			},
		],
		tiers: {
			free: {
				name: FREE,
				cta: START_FOR_FREE,
			},
			paid: {
				name: 'Anti-Spam',
				cta: __( 'Get Anti-Spam', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: SECURITY,
				cta: GET_SECURITY,
			},
		},
	};
}
