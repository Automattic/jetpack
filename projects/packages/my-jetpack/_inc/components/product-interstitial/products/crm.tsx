import { __ } from '@wordpress/i18n';
import crmLogoSvg from '../logos/crm-logo.png';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

const CrmLogo = ( { height = 42 } ) => {
	return <img src={ crmLogoSvg } alt="CRM Logo" height={ height } />;
};

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getCrmConfig(): ProductConfig {
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
		VIDEO_HOSTING_1TB,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'Nurture Contacts. Grow your Business.', 'jetpack-my-jetpack' ),
		logo: CrmLogo,
		bundle: COMPLETE_SLUG,
		features: [
			{
				name: __( 'Contacts', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'All Jetpack CRM features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Quotes', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( '30+ premium CRM extensions', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Invoices', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Access to CRM Slack community', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Transactions', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: REAL_TIME_BACKUPS,
				},
			},
			{
				name: __( 'Tasks', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: MALWARE_SCANNING,
				},
			},
			{
				name: __( 'Forms', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'Spam filtering', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Invoicing Pro', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'AI-powered content generation', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Gravity Forms', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: INSTANT_SITE_SEARCH },
			},
			{
				name: __( 'PayPal Connect', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: DETAILED_STATS,
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: true, label: '' },
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
				name: 'CRM',
				cta: __( 'Get CRM', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
