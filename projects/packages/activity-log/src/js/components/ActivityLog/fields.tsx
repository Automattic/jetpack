import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { ActivityActor } from './ActivityActor';
import { ActivityEvent } from './ActivityEvent';
import type { Activity, ActivityLogGroupCountResponse } from './types';
import type { Field, Operator } from '@wordpress/dataviews';

export type ActivityLogTypeOption = {
	value: string;
	label: string;
};

type UseActivityFieldsArgs = {
	timezoneString?: string;
	gmtOffset?: number;
	activityLogTypes?: ActivityLogGroupCountResponse[ 'groups' ] | undefined;
};

/**
 * Extract the leading "group" segment from an event name like
 * "plugin__updated" → "plugin". Used both as the DataViews filter value
 * and to look up a human-readable description from the group-counts
 * payload.
 *
 * @param name - Raw event name from the API (e.g. "plugin__updated").
 * @return The group slug, or an empty string if no name was given.
 */
const getActivityLogTypeSlugFromName = ( name?: string ): string => {
	if ( ! name ) {
		return '';
	}
	const [ group ] = name.split( '__' );
	return group ?? '';
};

/**
 * Resolve a user-facing description for an event name by looking the
 * leading group segment up in the group-counts response. Falls back to
 * the slug itself when the lookup misses.
 *
 * @param name             - Raw event name.
 * @param activityLogTypes - Group map from /activity-log/count/group.
 * @return Display label (e.g. "Plugins and Themes") or the slug.
 */
const getActivityLogTypeDescriptionFromName = (
	name?: string,
	activityLogTypes?: ActivityLogGroupCountResponse[ 'groups' ] | undefined
): string => {
	if ( ! name ) {
		return '';
	}
	const slug = getActivityLogTypeSlugFromName( name );
	return activityLogTypes?.[ slug ]?.name ?? slug;
};

/**
 * Format a numeric hour offset (e.g. `-5`, `5.5`) as "UTC±HH:MM".
 *
 * @param gmtOffset - Hour offset from UTC, decimal hours.
 * @return The formatted offset string.
 */
const formatUtcOffset = ( gmtOffset: number ): string => {
	const sign = gmtOffset < 0 ? '-' : '+';
	const abs = Math.abs( gmtOffset );
	const hours = Math.floor( abs );
	const minutes = Math.round( ( abs - hours ) * 60 );
	return `UTC${ sign }${ String( hours ).padStart( 2, '0' ) }:${ String( minutes ).padStart(
		2,
		'0'
	) }`;
};

/**
 * Compute the date column header. Includes the site's timezone (on wide
 * screens when we know it) or its UTC offset.
 *
 * @param args                - Inputs.
 * @param args.timezoneString - IANA timezone (e.g. "Europe/London").
 * @param args.gmtOffset      - Decimal hour offset from UTC.
 * @param args.isLargeScreen  - True when the viewport is wide enough to
 *                            show the full timezone name.
 * @return The header label for the date column.
 */
const getDateTimeLabel = ( {
	timezoneString,
	gmtOffset,
	isLargeScreen,
}: {
	timezoneString?: string;
	gmtOffset?: number;
	isLargeScreen: boolean;
} ): string => {
	/* translators: %s is the site's timezone (e.g., "Europe/London") or UTC offset (e.g., "UTC+02:00") */
	const template = __( 'Date & time (%s)', 'jetpack-activity-log' );
	if ( timezoneString && isLargeScreen ) {
		return sprintf( template, timezoneString );
	}
	if ( typeof gmtOffset === 'number' ) {
		return sprintf( template, formatUtcOffset( gmtOffset ) );
	}
	return __( 'Date & time', 'jetpack-activity-log' );
};

/**
 * Format a single date cell value, honoring the site's timezone preference
 * and (optionally) forcing a UTC rendering for the parallel "UTC" column.
 *
 * @param args                - Inputs.
 * @param args.value          - ISO string or unix-seconds timestamp.
 * @param args.timezoneString - IANA timezone (e.g. "Europe/London").
 * @param args.gmtOffset      - Decimal hour offset from UTC.
 * @param args.formatAsUTC    - True to render in UTC regardless of the
 *                            site preference.
 * @return The formatted date string.
 */
const formatDateCell = ( {
	timezoneString,
	gmtOffset,
	value,
	formatAsUTC,
}: {
	timezoneString?: string;
	gmtOffset?: number;
	value?: string | number;
	formatAsUTC?: boolean;
} ): string => {
	if ( ! value ) {
		return '';
	}
	const dateFormat = 'M j, Y \\a\\t g:i A';
	const date = typeof value === 'number' ? new Date( value * 1000 ) : new Date( value );
	if ( formatAsUTC ) {
		return dateI18n( dateFormat, date, 'UTC' );
	}
	if ( timezoneString ) {
		return dateI18n( dateFormat, date, timezoneString );
	}
	if ( typeof gmtOffset === 'number' ) {
		// `@wordpress/date` accepts the offset in minutes when passed a number;
		// translate the site's hour-offset accordingly.
		return dateI18n( dateFormat, date, gmtOffset * 60 );
	}
	return dateI18n( dateFormat, date );
};

/**
 * Build the DataViews `fields` array for the Activity Log table: the
 * Date & time column (optionally paired with a UTC column when the site
 * isn't already on UTC), the Event cell, the User cell, and the hidden
 * `activity_type` field that powers the filter dropdown.
 *
 * @param args                  - Hook options.
 * @param args.timezoneString   - IANA timezone (e.g. "Europe/London").
 * @param args.gmtOffset        - Decimal hour offset from UTC.
 * @param args.activityLogTypes - Group map from /activity-log/count/group.
 * @return The fields array passed to `<DataViews fields=… />`.
 */
export function useActivityFields( {
	timezoneString,
	gmtOffset,
	activityLogTypes,
}: UseActivityFieldsArgs ): Field< Activity >[] {
	const isLargeScreen = useViewportMatch( 'huge', '>=' );
	const dateTimeLabel = getDateTimeLabel( { timezoneString, gmtOffset, isLargeScreen } );
	const localIsUTC = gmtOffset === 0;

	const activityLogTypeElements = useMemo< ActivityLogTypeOption[] >( () => {
		if ( ! activityLogTypes ) {
			return [];
		}
		return Object.entries( activityLogTypes )
			.map( ( [ value, { name, count } ] ) => ( {
				value,
				label: `${ name } (${ count })`,
			} ) )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) );
	}, [ activityLogTypes ] );

	return useMemo( () => {
		const fields: Field< Activity >[] = [
			{
				id: 'published',
				type: 'datetime',
				label: dateTimeLabel,
				enableHiding: true,
				enableSorting: true,
				getValue: ( { item } ) => item.activityUnparsedTs,
				render: ( { item } ) => (
					<span>
						{ formatDateCell( {
							value: item.activityUnparsedTs,
							timezoneString,
							gmtOffset,
						} ) }
					</span>
				),
				filterBy: { operators: [] },
			},
		];

		if ( ! localIsUTC ) {
			fields.push( {
				id: 'published_utc',
				type: 'datetime',
				label: __( 'Date & time (UTC)', 'jetpack-activity-log' ),
				enableHiding: true,
				enableSorting: true,
				getValue: ( { item } ) => item.activityUnparsedTs,
				render: ( { item } ) => (
					<span>
						{ formatDateCell( {
							value: item.activityUnparsedTs,
							timezoneString,
							gmtOffset,
							formatAsUTC: true,
						} ) }
					</span>
				),
				filterBy: { operators: [] },
			} );
		}

		fields.push(
			{
				id: 'event',
				type: 'text',
				label: __( 'Event', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) =>
					`${ item.activityTitle }: ${ item.activityDescription.textDescription }`,
				render: ( { item } ) => <ActivityEvent activity={ item } />,
				filterBy: { operators: [] },
			},
			{
				id: 'actor',
				type: 'text',
				label: __( 'User', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) =>
					item.activityActor?.actorName || __( 'Unknown', 'jetpack-activity-log' ),
				render: ( { item } ) => <ActivityActor actor={ item.activityActor } />,
				filterBy: { operators: [] },
			},
			{
				id: 'activity_type',
				type: 'text',
				label: __( 'Activity type', 'jetpack-activity-log' ),
				getValue: ( { item } ) => getActivityLogTypeSlugFromName( item.activityName ),
				render: ( { item } ) => (
					<span>
						{ getActivityLogTypeDescriptionFromName( item.activityName, activityLogTypes ) }
					</span>
				),
				elements: activityLogTypeElements,
				isVisible: () => false,
				filterBy: { operators: [ 'isAny' as Operator ] },
			}
		);

		return fields;
	}, [
		timezoneString,
		gmtOffset,
		dateTimeLabel,
		activityLogTypeElements,
		activityLogTypes,
		localIsUTC,
	] );
}
