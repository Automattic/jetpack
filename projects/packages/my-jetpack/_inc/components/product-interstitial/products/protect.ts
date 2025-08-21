import { __ } from '@wordpress/i18n';
import logo from '../logos/protect-logo';
import { ProductConfig } from '../types';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getProtectConfig(): ProductConfig {
	return {
		title: __( 'Guard against malware and bad actors 24/7', 'jetpack-my-jetpack' ),
		logo,
		bundle: 'security',
		features: [
			{
				name: __( 'Scan for threats and vulnerabilities', 'jetpack-my-jetpack' ),
				free: {
					included: true,
					label: __( 'Line by line malware scanning', 'jetpack-my-jetpack' ),
				},
				paid: {
					included: true,
					label: __( 'Line by line malware scanning', 'jetpack-my-jetpack' ),
				},
				bundle: {
					included: true,
					label: __( 'Real-time cloud backups with 10GB storage', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Daily automated scans', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Plus on-demand manual scans', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Automated malware scan', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Web Application Firewall', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Manual rules only', 'jetpack-my-jetpack' ) },
				paid: {
					included: true,
					label: __( 'Automatic protection and rule updates', 'jetpack-my-jetpack' ),
				},
				bundle: {
					included: true,
					label: __( 'One-click fixes for threats', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Brute force protection', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time cloud backups', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Account protection', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: 'Spam protection' },
			},
			{
				name: __( 'Access to scan on Cloud', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'One-click auto fixes', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'Notifications', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
			},
			{
				name: __( 'Severity labels', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: '' },
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
				name: 'Protect',
				cta: __( 'Get Protect', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Security',
				cta: __( 'Get Security', 'jetpack-my-jetpack' ),
			},
		},
	};
}
