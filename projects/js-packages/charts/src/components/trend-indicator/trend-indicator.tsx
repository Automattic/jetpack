import clsx from 'clsx';
import styles from './trend-indicator.module.scss';
import type { TrendIndicatorProps, TrendDirection } from './types';

const Icon = ( { direction }: { direction: TrendDirection } ) => {
	if ( direction === 'neutral' ) {
		return null;
	}

	const isUp = direction === 'up';
	return (
		<svg
			className={ styles[ 'trend-indicator__icon' ] }
			viewBox="0 0 16 16"
			fill="none"
			role="img"
			aria-hidden="true"
		>
			<path
				d={ isUp ? 'M8 13V3M4 7l4-4 4 4' : 'M8 3v10M4 9l4 4 4-4' }
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

/**
 * TrendIndicator displays a directional trend with a value.
 * Used to show percentage changes or growth metrics.
 *
 * @param {TrendIndicatorProps} props - Component props
 * @return {JSX.Element} The rendered trend indicator
 */
export function TrendIndicator( { direction, value, className, style }: TrendIndicatorProps ) {
	return (
		<span
			className={ clsx(
				styles[ 'trend-indicator' ],
				styles[ `trend-indicator--${ direction }` ],
				className
			) }
			style={ style }
		>
			<Icon direction={ direction } />
			<span className={ styles[ 'trend-indicator__value' ] }>{ value }</span>
		</span>
	);
}
