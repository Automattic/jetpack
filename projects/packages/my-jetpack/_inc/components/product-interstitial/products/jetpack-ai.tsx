import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import logo from '../logos/jetpack-ai-logo';
import { ProductConfig } from '../types';
import { getTranslatableFeatureLabels, COMPLETE, COMPLETE_SLUG } from './shared-labels';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getJetpackAiConfig(): ProductConfig {
	const {
		INCLUDED,
		NOT_INCLUDED,
		FREE,
		START_FOR_FREE,
		GET_COMPLETE,
		DETAILED_STATS,
		SOCIAL_TOOLS,
		INSTANT_SITE_SEARCH,
		VIDEO_HOSTING_1TB,
		PRIORITY_SUPPORT,
	} = getTranslatableFeatureLabels();

	return {
		title: __( 'The most powerful AI tool for WordPress', 'jetpack-my-jetpack' ),
		logo,
		bundle: COMPLETE_SLUG,
		features: [
			{
				name: __( 'Usage quota', 'jetpack-my-jetpack' ),
				tooltipInfo: (
					<>
						{ __( 'Monthly usage quota for AI requests.', 'jetpack-my-jetpack' ) }
						&nbsp;
						<Link openInNewTab href={ getRedirectUrl( 'jetpack-support-ai' ) }>
							{ __( 'Learn more', 'jetpack-my-jetpack' ) }
						</Link>
					</>
				),
				free: { included: true, label: __( '20 requests', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'High request capacity', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All AI Assistant features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Prompt based content generation', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: DETAILED_STATS,
				},
			},
			{
				name: __( 'Generate text, images, tables, and lists', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: SOCIAL_TOOLS,
				},
			},
			{
				name: __( 'Adaptive tone adjustment', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: INSTANT_SITE_SEARCH,
				},
			},
			{
				name: __( 'Superior spelling and grammar correction', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
				paid: { included: true, label: INCLUDED },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Title & summary generation', 'jetpack-my-jetpack' ),
				free: { included: true, label: INCLUDED },
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
					label: __( 'Site performance and SEO optimization', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
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
				name: 'AI Assistant',
				cta: __( 'Get AI Assistant', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: COMPLETE,
				cta: GET_COMPLETE,
			},
		},
	};
}
