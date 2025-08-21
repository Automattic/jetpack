import { __ } from '@wordpress/i18n';
import crmLogoSvg from '../logos/crm-logo.png';
import { ProductConfig } from '../types';

const CrmLogo = ( { height = 42 } ) => {
	return <img src={ crmLogoSvg } alt="CRM Logo" height={ height } />;
};

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getCrmConfig(): ProductConfig {
	return {
		title: __( 'Nurture Contacts. Grow your Business.', 'jetpack-my-jetpack' ),
		logo: CrmLogo,
		bundle: 'complete',
		features: [
			{
				name: __( 'Contacts', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All Jetpack CRM features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Quotes', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( '30+ premium CRM extensions', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Invoices', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Access to CRM Slack community', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Transactions', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time backups and restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Tasks', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Malware scanning and protection', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Forms', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Spam filtering', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Invoicing Pro', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'AI-powered content generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Gravity Forms', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'Instant site search', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'PayPal Connect', 'jetpack-my-jetpack' ),
				free: { included: false, label: __( 'Not included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: true, label: '' },
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
				cta: __( 'Start for free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'CRM',
				cta: __( 'Get CRM', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	};
}
