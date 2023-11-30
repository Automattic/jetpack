import { RecordMeterBar, Text } from '@automattic/jetpack-components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { ShareLimits } from '../../hooks/use-share-limits';
import styles from './styles.module.scss';

type NoticeType = ShareLimits[ 'noticeType' ];

export type ShareLimitsBarProps = {
	usedCount: number;
	scheduledCount: number;
	enabledConnectionsCount?: number;
	remainingCount?: number;
	limit: number;
	text?: string;
	className?: string;
	noticeType?: NoticeType;
};

const colorsForUsed: Record< NoticeType, string > = {
	error: 'var(--jp-red-50)',
	warning: 'var(--jp-yellow-20)',
	default: 'var(--jp-green)',
};

const colorsForScheduled: Record< NoticeType, string > = {
	error: 'var(--jp-red-50)',
	warning: 'var(--jp-yellow-20)',
	default: 'var(--jp-green-5)',
};

export const ShareLimitsBar = ( {
	usedCount,
	limit,
	scheduledCount,
	enabledConnectionsCount,
	remainingCount,
	text,
	className,
	noticeType = 'default',
}: ShareLimitsBarProps ) => {
	const remaining = Math.max(
		remainingCount ?? limit - usedCount - scheduledCount - ( enabledConnectionsCount ?? 0 ),
		0
	);
	const items = useMemo( () => {
		let widthConsumed = 0;

		return [
			{
				count: usedCount,
				backgroundColor: colorsForUsed[ noticeType ],
				label: __( 'used', 'jetpack' ),
			},
			{
				count: scheduledCount,
				backgroundColor: colorsForScheduled[ noticeType ],
				label: __( 'scheduled', 'jetpack' ),
			},
			enabledConnectionsCount !== undefined && {
				count: enabledConnectionsCount,
				backgroundColor: 'var(--jp-gray-40)',
				label: __( 'enabled connections', 'jetpack' ),
			},
			{
				count: remaining,
				backgroundColor: 'var(--jp-gray-off)',
				label: __( 'remaining', 'jetpack' ),
			},
		]
			.filter( Boolean )
			.map( item => {
				/**
				 * This is to ensure that the bar is always filled up to 100%
				 * by the used and scheduled counts if they are over the limit.
				 */

				// Give a 0 width to the remaining items if the limit is reached.
				let widthPercent = widthConsumed < 100 ? ( item.count / limit ) * 100 : 0;

				// If the widthPercent is greater than the remaining width, reduce it.
				widthPercent = Math.min( widthPercent, 100 - widthConsumed );

				widthConsumed += widthPercent;

				return {
					...item,
					widthPercent,
				};
			} );
	}, [ usedCount, noticeType, scheduledCount, enabledConnectionsCount, remaining, limit ] );

	return (
		<div className={ classNames( styles.wrapper, className ) }>
			{ text ? <Text className={ styles.text }>{ text }</Text> : null }
			<RecordMeterBar totalCount={ limit } items={ items } className={ styles[ 'bar-wrapper' ] } />
		</div>
	);
};
