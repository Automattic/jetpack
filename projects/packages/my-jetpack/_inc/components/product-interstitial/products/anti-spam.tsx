import { __ } from '@wordpress/i18n';
import antispamLogo from '../logos/antispam-logo.svg';
import { ProductConfig } from '../types';

const AntiSpamLogo = ( { height = 42 } ) => {
	return <img src={ antispamLogo } alt="Anti-Spam Logo" height={ height } />;
};

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getAntiSpamConfig(): ProductConfig {
	return {
		title: __( 'Automatically stop comment and form spam', 'jetpack-my-jetpack' ),
		logo: AntiSpamLogo,
		bundle: 'security',
		features: [
			{
				name: __( 'Commercial usage', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Akismet spam protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Comment and form protection', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time cloud backups', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Block spam without CAPTCHAs', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
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
				name: __( 'Priority support', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'One-click fixes for threats' },
			},
		],
		tiers: {
			free: {
				name: __( 'Free', 'jetpack-my-jetpack' ),
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'Anti-Spam',
				cta: __( 'Get Anti-Spam', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Security',
				cta: __( 'Get Security', 'jetpack-my-jetpack' ),
			},
		},
	};
}
