import { StatsIcon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

const StatsLogo = ( { height = 32 } ) => <StatsIcon size={ height } />;

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getStatsConfig(): ProductConfig {
	const {
		INCLUDED,
		NOT_INCLUDED,
		FREE,
		START_FOR_FREE,
		GET_COMPLETE,
		REAL_TIME_BACKUPS,
		MALWARE_SCANNING,
		SPAM_FILTERING,
		INSTANT_SITE_SEARCH,
		VIDEO_HOSTING_1TB,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'Simple, yet powerful stats to grow your site', 'jetpack-my-jetpack' ),
		logo: StatsLogo,
		bundle: COMPLETE_SLUG,
		features: [
			{
				name: __( 'Real-time data on visitors', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: __( 'All Stats features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Traffic stats and trends for post and pages', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: REAL_TIME_BACKUPS },
			},
			{
				name: __( 'Detailed statistics about links leading to your site', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: MALWARE_SCANNING },
			},
			{
				name: __( 'GDPR compliant', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: SPAM_FILTERING },
			},
			{
				name: __( 'Access to upcoming advanced features', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: INSTANT_SITE_SEARCH },
			},
			{
				name: __( 'Commercial use', 'jetpack-my-jetpack' ),
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: VIDEO_HOSTING_1TB },
			},
			{
				name: PRIORITY_SUPPORT,
				free: { included: false, label: NOT_INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: { included: true, label: PRIORITY_SUPPORT },
			},
		],
		tiers: {
			free: {
				name: FREE,
				cta: START_FOR_FREE,
			},
			paid: {
				name: 'Stats',
				cta: __( 'Get Stats', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
