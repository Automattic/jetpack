import { _n, sprintf } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import formatPercentage from '../../../utils/format-percentage';
import type { FC } from 'react';

type ChangeBadgeProps = {
	id: string;
	percent: number;
	days: number;
};

/**
 * The whole-percent change from the previous period.
 *
 * @param {number|undefined} count    - This period's total.
 * @param {number|undefined} previous - The previous period's total.
 * @return {number|null} The change, or null with nothing to compare against.
 */
export const getPercentChange = ( count?: number, previous?: number ): number | null => {
	if ( typeof count !== 'number' || typeof previous !== 'number' || previous <= 0 ) {
		return null;
	}
	// `|| 0` turns Math.round's -0 into 0, so a tiny drop reads as no change.
	return Math.round( ( ( count - previous ) / previous ) * 100 ) || 0;
};

/**
 * A Stats value's change from the previous period: green up, amber down, neutral when flat.
 *
 * @param {ChangeBadgeProps} props - Component props.
 * @return {import('react').JSX.Element} The badge.
 */
const ChangeBadge: FC< ChangeBadgeProps > = ( { id, percent, days } ) => {
	// `dir="auto"` below: an untranslated string on an RTL site would otherwise read "8%-".
	if ( percent === 0 ) {
		return (
			<Badge id={ id } intent="none" dir="auto">
				{ sprintf(
					/* translators: %d: number of days in the period. */
					_n(
						'No change compared to previous %d day',
						'No change compared to previous %d days',
						days,
						'jetpack-my-jetpack'
					),
					days
				) }
			</Badge>
		);
	}

	return (
		<Badge id={ id } intent={ percent > 0 ? 'stable' : 'medium' } dir="auto">
			{ sprintf(
				/* translators: %1$s: signed percent change, e.g. "+9%" or "-8%". %2$d: number of days in the period. */
				_n(
					'%1$s compared to previous %2$d day',
					'%1$s compared to previous %2$d days',
					days,
					'jetpack-my-jetpack'
				),
				formatPercentage( percent / 100, { style: 'percent', signDisplay: 'always' } ),
				days
			) }
		</Badge>
	);
};

export default ChangeBadge;
