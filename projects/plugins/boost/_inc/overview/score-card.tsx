import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import {
	formatScoreDelta,
	getScoreDelta,
	getScoreTier,
	getTrendDirection,
} from './lib/score-utils';
import type { ReactNode } from 'react';

type BadgeIntent = 'high' | 'medium' | 'stable';

type Props = {
	icon?: ReactNode;
	label: string;
	/** Trailing slot beside the label — used for the Overall card's info tooltip. */
	labelTrailing?: ReactNode;
	/** Display value — number for Lighthouse scores, string for the Overall letter grade. */
	value: ReactNode;
	/** When provided, drives the progress bar and the per-tier badge. Omit for grade-only cards. */
	score?: number;
	/** Without-Boost baseline; pairs with `score` to compute the signed delta below the bar. */
	noBoost?: number | null;
	/** Override the tier label — used by Overall, which has no `score` but still wants the badge. */
	tierLabel?: string;
	isLoading?: boolean;
};

const TIER_BADGE_INTENT: Record< string, BadgeIntent > = {
	[ __( 'Good', 'jetpack-boost' ) ]: 'stable',
	[ __( 'Could be improved', 'jetpack-boost' ) ]: 'medium',
	[ __( 'Poor', 'jetpack-boost' ) ]: 'high',
};

const TREND_CLASS: Record< 'up' | 'down' | 'neutral', string > = {
	up: 'jetpack-boost-overview__delta--up',
	down: 'jetpack-boost-overview__delta--down',
	neutral: 'jetpack-boost-overview__delta--neutral',
};

const PROGRESS_TIER_CLASS: Record< 'success' | 'warning' | 'error', string > = {
	success: 'jetpack-boost-overview__progress--success',
	warning: 'jetpack-boost-overview__progress--warning',
	error: 'jetpack-boost-overview__progress--error',
};

/**
 * Picks the progress-bar accent class from the qualitative tier so the bar
 * tone matches the badge ("Good" → green, "Could be improved" → orange,
 * "Poor" → red).
 *
 * @param tier - Tier label returned by `getScoreTier`.
 * @return Class suffix in the `--success / --warning / --error` family.
 */
function progressClassFor( tier: string ): string {
	if ( tier === __( 'Good', 'jetpack-boost' ) ) {
		return PROGRESS_TIER_CLASS.success;
	}
	if ( tier === __( 'Could be improved', 'jetpack-boost' ) ) {
		return PROGRESS_TIER_CLASS.warning;
	}
	return PROGRESS_TIER_CLASS.error;
}

/**
 * Single section inside the unified Performance scores card.
 *
 * Renders an icon + label header, the big value (Lighthouse score or letter
 * grade) as a WPDS `heading-2xl`, a tier badge, and — for numeric cards —
 * a `ProgressBar` and signed delta vs. the without-Boost baseline.
 *
 * @param props               - Component props.
 * @param props.icon
 * @param props.label
 * @param props.labelTrailing
 * @param props.value
 * @param props.score
 * @param props.noBoost
 * @param props.tierLabel
 * @param props.isLoading
 * @return The score section element.
 */
export default function ScoreCard( {
	icon,
	label,
	labelTrailing,
	value,
	score,
	noBoost,
	tierLabel,
	isLoading,
}: Props ): JSX.Element {
	const showProgress = typeof score === 'number' && ! isLoading;
	const tier = isLoading ? '' : tierLabel ?? ( showProgress ? getScoreTier( score ) : '' );
	const badgeIntent: BadgeIntent = tier ? TIER_BADGE_INTENT[ tier ] ?? 'medium' : 'stable';

	const delta = showProgress ? getScoreDelta( score, noBoost ?? null ) : null;

	return (
		<div className="jetpack-boost-overview__score-section">
			<Stack direction="row" align="center" gap="sm">
				{ icon }
				<Text variant="body-md">{ label }</Text>
				{ labelTrailing }
			</Stack>
			<Stack direction="row" align="center" gap="md">
				<Text variant="heading-2xl">{ isLoading ? '—' : value }</Text>
				{ tier && <Badge intent={ badgeIntent }>{ tier }</Badge> }
			</Stack>
			{ showProgress && (
				<ProgressBar
					className={ `jetpack-boost-overview__progress ${ progressClassFor( tier ) }` }
					value={ score }
				/>
			) }
			{ delta !== null && (
				<Text
					variant="body-sm"
					className={ `jetpack-boost-overview__delta ${
						TREND_CLASS[ getTrendDirection( delta ) ]
					}` }
				>
					{ formatScoreDelta( delta ) }
				</Text>
			) }
		</div>
	);
}
