/**
 * External dependencies
 */
import { Icon, Stack, Text } from '@jetpack-premium-analytics/externals';
import { InfoTip } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './upgrade-page.module.scss';
import type { JSX } from 'react';

type Benefit = { label: string; info?: string };

/**
 * The benefits, each with the explanation its info tip opens, if any.
 *
 * @return The benefits.
 */
function getBenefits(): Benefit[] {
	return [
		{ label: __( 'Real-time data on visitors', 'jetpack-premium-analytics-pkg' ) },
		{
			label: __( 'Traffic stats and trends for posts and pages', 'jetpack-premium-analytics-pkg' ),
		},
		{
			label: __(
				'Detailed statistics about links leading to your site',
				'jetpack-premium-analytics-pkg'
			),
		},
		{ label: __( 'GDPR compliance', 'jetpack-premium-analytics-pkg' ) },
		{ label: __( 'Access to upcoming advanced features', 'jetpack-premium-analytics-pkg' ) },
		{ label: __( 'Priority support', 'jetpack-premium-analytics-pkg' ) },
		{
			label: __( 'Custom date ranges', 'jetpack-premium-analytics-pkg' ),
			info: __(
				'Select custom date ranges when inspecting your site traffic.',
				'jetpack-premium-analytics-pkg'
			),
		},
		{
			label: __( 'View device stats', 'jetpack-premium-analytics-pkg' ),
			info: __(
				'Get detailed device stats for your site visitors.',
				'jetpack-premium-analytics-pkg'
			),
		},
		{
			label: __( 'UTM tracking', 'jetpack-premium-analytics-pkg' ),
			info: __(
				'It enables you to measure and track traffic through UTM parameters in your URLs, providing a method to assess the success of your campaigns.',
				'jetpack-premium-analytics-pkg'
			),
		},
		{
			label: __( 'Traffic spike forgiveness', 'jetpack-premium-analytics-pkg' ),
			info: __(
				"You won't incur additional charges for occasional traffic spikes, nor will we cease tracking your statistics due to such spikes.",
				'jetpack-premium-analytics-pkg'
			),
		},
		{
			label: __( 'Overage forgiveness', 'jetpack-premium-analytics-pkg' ),
			info: __(
				'You will only be prompted to upgrade to higher tiers when you exceed the limit for three consecutive periods.',
				'jetpack-premium-analytics-pkg'
			),
		},
	];
}

/**
 * What a commercial Stats tier includes.
 *
 * @return The benefits list.
 */
export function StatsBenefits(): JSX.Element {
	return (
		<ul className={ styles.benefits }>
			{ getBenefits().map( ( { label, info } ) => (
				<li key={ label }>
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ check } className={ styles.check } />
						<Text variant="body-lg">{ label }</Text>
						{ info && (
							<InfoTip
								/* translators: %s: a Stats feature, e.g. "UTM tracking". */
								label={ sprintf( __( 'About %s', 'jetpack-premium-analytics-pkg' ), label ) }
								size={ 16 }
								openOnHover
							>
								{ info }
							</InfoTip>
						) }
					</Stack>
				</li>
			) ) }
		</ul>
	);
}
