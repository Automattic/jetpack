import { getUserLocale, PeriodSelector } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
import { STATS_PERIOD_DAYS } from './use-stats-period';
import type { StatsPeriod, StatsPeriodDays } from './use-stats-period';
import type { FC } from 'react';

const getLabels = (): Record< StatsPeriodDays, string > => ( {
	7: __( 'Last 7 days', 'jetpack-my-jetpack' ),
	30: __( 'Last 30 days', 'jetpack-my-jetpack' ),
} );

/**
 * The Overview's Stats period dropdown, with the window's dates.
 *
 * @param {object}      props        - Component props.
 * @param {StatsPeriod} props.period - The window, from useStatsPeriod.
 * @return {import('react').JSX.Element} The control.
 */
const StatsPeriodControl: FC< { period: StatsPeriod } > = ( { period } ) => {
	const { days, offset, start, end, setDays, goToPrevious, goToNext } = period;
	const presets = useMemo( () => {
		const labels = getLabels();
		return STATS_PERIOD_DAYS.map( value => ( { value: String( value ), label: labels[ value ] } ) );
	}, [] );
	const onChange = useCallback(
		( value: string ) => setDays( Number( value ) as StatsPeriodDays ),
		[ setDays ]
	);
	const dates = useMemo(
		() =>
			new Intl.DateTimeFormat( getUserLocale(), {
				month: 'short',
				day: 'numeric',
				year: start.getFullYear() < new Date().getFullYear() ? 'numeric' : undefined,
			} ).formatRange( start, end ),
		[ start, end ]
	);

	return (
		<Stack direction="row" align="center" gap="sm" wrap="wrap">
			<Text variant="body-md" aria-live="polite">
				{ dates }
			</Text>
			<PeriodSelector
				presets={ presets }
				value={ String( days ) }
				onChange={ onChange }
				onPrevious={ goToPrevious }
				onNext={ goToNext }
				isNextDisabled={ offset === 0 }
			/>
		</Stack>
	);
};

export default StatsPeriodControl;
