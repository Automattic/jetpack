/* eslint-disable jsdoc/require-param-description, jsdoc/require-returns */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface DateRange {
	start: Date;
	end: Date;
}

export interface UseDateRangeOptions {
	defaultDays?: number;
}

export interface UseDateRangeResult {
	dateRange: DateRange;
	setDateRange: ( next: DateRange ) => void;
}

const msPerDay = 24 * 60 * 60 * 1000;

const parseUnixSeconds = ( value: string | null ): Date | null => {
	if ( ! value ) {
		return null;
	}
	const seconds = Number( value );
	if ( ! Number.isFinite( seconds ) ) {
		return null;
	}
	const date = new Date( seconds * 1000 );
	return isNaN( date.getTime() ) ? null : date;
};

const toUnixSeconds = ( date: Date ): number => Math.floor( date.getTime() / 1000 );

const getDefaultRange = ( days: number ): DateRange => {
	const end = new Date();
	const start = new Date( end.getTime() - ( days - 1 ) * msPerDay );
	return { start, end };
};

/**
 * URL-synced date range. Start/end are persisted in the hash query string
 * as UNIX seconds (`?from=…&to=…`) so deep links preserve the date window.
 * @param root0
 * @param root0.defaultDays
 */
export function useDateRange( { defaultDays = 30 }: UseDateRangeOptions = {} ): UseDateRangeResult {
	const [ searchParams, setSearchParams ] = useSearchParams();

	const dateRange = useMemo< DateRange >( () => {
		const from = parseUnixSeconds( searchParams.get( 'from' ) );
		const to = parseUnixSeconds( searchParams.get( 'to' ) );
		if ( from && to && from <= to ) {
			return { start: from, end: to };
		}
		return getDefaultRange( defaultDays );
		// Re-derive whenever the raw URL params change.
	}, [ searchParams, defaultDays ] );

	const setDateRange = useCallback(
		( next: DateRange ) => {
			setSearchParams(
				prev => {
					const updated = new URLSearchParams( prev );
					updated.set( 'from', String( toUnixSeconds( next.start ) ) );
					updated.set( 'to', String( toUnixSeconds( next.end ) ) );
					return updated;
				},
				{ replace: true }
			);
		},
		[ setSearchParams ]
	);

	return { dateRange, setDateRange };
}
