import { __ } from '@wordpress/i18n';
import logo from '../logos/backup-logo';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, SECURITY, SECURITY_SLUG } from './shared-labels';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getBackupConfig(): ProductConfig {
	const { INCLUDED, GET_SECURITY } = getTranslatableFeatureLabels();

	return {
		title: __( 'The best real-time WordPress backup plugin', 'jetpack-my-jetpack' ),
		logo,
		bundle: SECURITY_SLUG,
		features: [
			{
				name: __( 'Real-time backups', 'jetpack-my-jetpack' ),
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'All Backup features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Cloud backup storage', 'jetpack-my-jetpack' ),
				paid: { included: true, label: __( '10 GB', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Real-time cloud backups', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'One-click restores', 'jetpack-my-jetpack' ),
				paid: { included: true, label: __( '30-day history', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( '10GB of backup storage', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Backup history', 'jetpack-my-jetpack' ),
				tooltipInfo: __(
					'Backup retention is still subject to the overall storage limit and usage.',
					'jetpack-my-jetpack'
				),
				paid: { included: true, label: __( '30-day log', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Automated malware scan', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Activity log', 'jetpack-my-jetpack' ),
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'One-click fixes for threats', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'File Browser (granular restore)', 'jetpack-my-jetpack' ),
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'Spam protection', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Copy to Staging', 'jetpack-my-jetpack' ),
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'Scheduled Backups', 'jetpack-my-jetpack' ),
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: '' },
			},
		],
		tiers: {
			paid: {
				name: 'Backup',
				cta: __( 'Get Backup', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: SECURITY,
				cta: GET_SECURITY,
			},
		},
	};
}
