import { useCallback, useMemo, useState } from 'react';
import { getMyJetpackWindowConnectionState } from '../../../data/utils/get-my-jetpack-window-state';
import { VISITS_OPTIONS } from '../../stats-section';

export const STATS_PERIOD_DAYS = [ 7, 30 ] as const;

export type StatsPeriodDays = ( typeof STATS_PERIOD_DAYS )[ number ];

export type StatsPeriod = {
	days: StatsPeriodDays;
	/** How many periods back from the latest one the window is. */
	offset: number;
	start: Date;
	end: Date;
	setDays: ( days: StatsPeriodDays ) => void;
	goToPrevious: () => void;
	goToNext: () => void;
};

const getStorageKey = () => {
	const userId = getMyJetpackWindowConnectionState( 'userConnectionData' )?.currentUser?.id;
	return `jetpack-my-jetpack-overview-stats-period-${ userId ?? 0 }`;
};

const readStoredDays = (): StatsPeriodDays => {
	try {
		const stored = Number( window.localStorage.getItem( getStorageKey() ) );
		return STATS_PERIOD_DAYS.find( days => days === stored ) ?? 7;
	} catch {
		return 7;
	}
};

const storeDays = ( days: StatsPeriodDays ) => {
	try {
		window.localStorage.setItem( getStorageKey(), String( days ) );
	} catch {
		// Without storage the choice lasts until the page reloads.
	}
};

const shiftDays = ( date: Date, days: number ) => {
	const shifted = new Date( date );
	shifted.setDate( shifted.getDate() + days );
	return shifted;
};

/**
 * The Overview's Stats window: a period length remembered per user, and how far back it is.
 *
 * @return {StatsPeriod} The window and its setters.
 */
export const useStatsPeriod = (): StatsPeriod => {
	const [ days, setDaysState ] = useState< StatsPeriodDays >( readStoredDays );
	const [ offset, setOffset ] = useState( 0 );

	const setDays = useCallback( ( next: StatsPeriodDays ) => {
		setDaysState( next );
		setOffset( 0 );
		storeDays( next );
	}, [] );
	const goToPrevious = useCallback( () => setOffset( current => current + 1 ), [] );
	const goToNext = useCallback( () => setOffset( current => Math.max( 0, current - 1 ) ), [] );

	const end = useMemo( () => shiftDays( VISITS_OPTIONS.date, -days * offset ), [ days, offset ] );
	const start = useMemo( () => shiftDays( end, 1 - days ), [ end, days ] );

	return { days, offset, start, end, setDays, goToPrevious, goToNext };
};

/**
 * Query options for a window.
 *
 * @param {StatsPeriod} period - The window.
 * @return {object} Options for useStatsVisits.
 */
export const getStatsPeriodVisitsOptions = ( { days, end }: Pick< StatsPeriod, 'days' | 'end' > ) =>
	( {
		period: 'day',
		quantity: days,
		date: end,
		keepPreviousData: true,
	} ) as const;
