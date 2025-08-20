import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import logo from '../logos/jetpack-ai-logo';
import { ProductConfig } from '../types';

/**
 * Get the configuration for the product.
 *
 * @return The configuration object for the product.
 */
export function getJetpackAiConfig(): ProductConfig {
	return {
		title: __( 'The most powerful AI tool for WordPress', 'jetpack-my-jetpack' ),
		logo,
		bundle: 'complete',
		features: [
			{
				name: __( 'Usage quota', 'jetpack-my-jetpack' ),
				tooltipInfo: (
					<>
						{ __( 'Monthly usage quota for AI requests.', 'jetpack-my-jetpack' ) }
						&nbsp;
						<ExternalLink href={ getRedirectUrl( 'jetpack-support-ai' ) }>
							{ __( 'Learn more', 'jetpack-my-jetpack' ) }
						</ExternalLink>
					</>
				),
				free: { included: true, label: __( '20 requests', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'High request capacity', 'jetpack-my-jetpack' ) },
				bundle: { included: true, label: __( 'All AI Assistant features', 'jetpack-my-jetpack' ) },
			},
			{
				name: __( 'Prompt based content generation', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Detailed stats and insights', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Generate text, images, tables, and lists', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Social tools', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Adaptive tone adjustment', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Instant site search', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Superior spelling and grammar correction', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				paid: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
				bundle: {
					included: true,
					label: __( 'Real-time backups and one-click restores', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: __( 'Title & summary generation', 'jetpack-my-jetpack' ),
				free: { included: true, label: __( 'Included', 'jetpack-my-jetpack' ) },
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
					label: __( 'Site performance and SEO optimization', 'jetpack-my-jetpack' ),
				},
			},
			{
				name: '',
				free: { included: false, label: '' },
				paid: { included: false, label: '' },
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
				cta: __( 'Start for Free', 'jetpack-my-jetpack' ),
			},
			paid: {
				name: 'AI Assistant',
				cta: __( 'Get AI Assistant', 'jetpack-my-jetpack' ),
			},
			bundle: {
				name: 'Complete',
				cta: __( 'Get Complete', 'jetpack-my-jetpack' ),
			},
		},
	};
}
