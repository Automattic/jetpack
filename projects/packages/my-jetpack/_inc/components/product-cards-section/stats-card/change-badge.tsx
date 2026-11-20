import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Popover, VisuallyHidden } from '@wordpress/ui';
import formatNumber from '../../../utils/format-number';
import formatPercentage from '../../../utils/format-percentage';
import LoadingBlock from '../../loading-block';
import type { FC } from 'react';

export type Metric = 'views' | 'visitors' | 'likes' | 'comments';

type ChangeBadgeProps = {
	id: string;
	metric: Metric;
	count?: number;
	previous?: number;
	days: number;
	isLoading?: boolean;
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
 * The change as a count, e.g. "880 more views".
 *
 * @param {Metric} metric     - The metric that changed.
 * @param {number} difference - This period's total minus the previous one's.
 * @return {string} The change in words.
 */
export const getCountChangeText = ( metric: Metric, difference: number ): string => {
	const amount = Math.abs( difference );
	const value = formatNumber( amount, { maximumFractionDigits: 0 } );
	const isMore = difference > 0;
	switch ( metric ) {
		case 'views':
			return isMore
				? sprintf(
						/* translators: %s: number of views. */
						_n( '%s more view', '%s more views', amount, 'jetpack-my-jetpack' ),
						value
					)
				: sprintf(
						/* translators: %s: number of views. */
						_n( '%s fewer view', '%s fewer views', amount, 'jetpack-my-jetpack' ),
						value
					);
		case 'visitors':
			return isMore
				? sprintf(
						/* translators: %s: number of visitors. */
						_n( '%s more visitor', '%s more visitors', amount, 'jetpack-my-jetpack' ),
						value
					)
				: sprintf(
						/* translators: %s: number of visitors. */
						_n( '%s fewer visitor', '%s fewer visitors', amount, 'jetpack-my-jetpack' ),
						value
					);
		case 'likes':
			return isMore
				? sprintf(
						/* translators: %s: number of likes. */
						_n( '%s more like', '%s more likes', amount, 'jetpack-my-jetpack' ),
						value
					)
				: sprintf(
						/* translators: %s: number of likes. */
						_n( '%s fewer like', '%s fewer likes', amount, 'jetpack-my-jetpack' ),
						value
					);
		case 'comments':
			return isMore
				? sprintf(
						/* translators: %s: number of comments. */
						_n( '%s more comment', '%s more comments', amount, 'jetpack-my-jetpack' ),
						value
					)
				: sprintf(
						/* translators: %s: number of comments. */
						_n( '%s fewer comment', '%s fewer comments', amount, 'jetpack-my-jetpack' ),
						value
					);
	}
};

/**
 * The selected Stats value's change from the previous period, with the count in an infotip.
 *
 * @param {ChangeBadgeProps} props - Component props.
 * @return {import('react').JSX.Element} The badge, or its skeleton while stats load.
 */
const ChangeBadge: FC< ChangeBadgeProps > = ( {
	id,
	metric,
	count,
	previous,
	days,
	isLoading = false,
} ) => {
	if ( isLoading ) {
		// A rendered badge's height, so nothing moves when the stats arrive.
		return <LoadingBlock width="200px" height="24px" />;
	}

	// `dir="auto"` below: an untranslated string on an RTL site would otherwise read "8%-".
	const percent = getPercentChange( count, previous );
	if ( percent === null ) {
		return (
			<Badge id={ id } intent="draft" dir="auto">
				{ __( 'Nothing to compare yet', 'jetpack-my-jetpack' ) }
			</Badge>
		);
	}

	if ( percent === 0 ) {
		return (
			<Badge id={ id } intent="draft" dir="auto">
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

	const label = sprintf(
		/* translators: %1$s: signed percent change, e.g. "+9%" or "-8%". %2$d: number of days in the period. */
		_n(
			'%1$s compared to previous %2$d day',
			'%1$s compared to previous %2$d days',
			days,
			'jetpack-my-jetpack'
		),
		formatPercentage( percent / 100, { style: 'percent', signDisplay: 'always' } ),
		days
	);

	return (
		<Badge
			id={ id }
			intent={ percent > 0 ? 'stable' : 'medium' }
			dir="auto"
			infotip={ {
				popover: Popover,
				popup: (
					<Popover.Popup>
						<VisuallyHidden render={ <Popover.Title /> }>{ label }</VisuallyHidden>
						<Popover.Description>
							{ getCountChangeText( metric, ( count ?? 0 ) - ( previous ?? 0 ) ) }
						</Popover.Description>
					</Popover.Popup>
				),
			} }
		>
			{ label }
		</Badge>
	);
};

export default ChangeBadge;
