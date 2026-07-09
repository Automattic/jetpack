import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { ActivityActor } from './ActivityActor';
import {
	ActivityEvent,
	ActivityEventDescription,
	ActivityEventIcon,
	ActivityEventTitle,
} from './ActivityEvent';
import type { Activity, ActivityLogGroupCountResponse, ActorSummary } from './types';
import type { Field, Operator } from '@wordpress/dataviews';

export type ActivityLogTypeOption = {
	value: string;
	label: string;
};

type UseActivityFieldsArgs = {
	timezoneString?: string;
	gmtOffset?: number;
	activityLogTypes?: ActivityLogGroupCountResponse[ 'groups' ] | undefined;
	actors?: ActorSummary[];
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
 * @param args.dateFormat     - `dateI18n` format string, defaulting to
 *                            "M j, Y at g:i A" (used for the Date &
 *                            time column). Pass "F j, Y" for the
 *                            day-only group header.
 * @return The formatted date string.
 */
const formatDateCell = ( {
	timezoneString,
	gmtOffset,
	value,
	formatAsUTC,
	dateFormat = 'M j, Y \\a\\t g:i A',
}: {
	timezoneString?: string;
	gmtOffset?: number;
	value?: string | number;
	formatAsUTC?: boolean;
	dateFormat?: string;
} ): string => {
	if ( ! value ) {
		return '';
	}
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
 * `activity_type` / `actor` fields that power the filter dropdowns.
 *
 * @param args                  - Hook options.
 * @param args.timezoneString   - IANA timezone (e.g. "Europe/London").
 * @param args.gmtOffset        - Decimal hour offset from UTC.
 * @param args.activityLogTypes - Group map from /activity-log/count/group.
 * @param args.actors           - Distinct actors from /activity-log/actors,
 *                              used to populate the "Performed by" dropdown.
 * @return The fields array passed to `<DataViews fields=… />`.
 */
export function useActivityFields( {
	timezoneString,
	gmtOffset,
	activityLogTypes,
	actors,
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

	const actorElements = useMemo< ActivityLogTypeOption[] >( () => {
		if ( ! actors || actors.length === 0 ) {
			return [];
		}
		return actors
			.filter( actor => actor.id )
			.map( actor => {
				const name = actor.name || actor.id;
				const label = typeof actor.count === 'number' ? `${ name } (${ actor.count })` : name;
				return { value: actor.id, label };
			} )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) );
	}, [ actors ] );

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
			// The Activity layout renders icon / title / description in
			// dedicated mediaField / titleField / descriptionField slots,
			// so we expose three atomic fields alongside the Table
			// layout's composite `event`. DataViews' `getHideableFields`
			// excludes slot-bound fields from the Properties toggle
			// list, so these don't double-expose in the cog popover.
			{
				id: 'event_icon',
				type: 'text',
				label: __( 'Icon', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.activityIcon ?? '',
				render: ( { item } ) => <ActivityEventIcon activity={ item } />,
				filterBy: { operators: [] },
			},
			{
				id: 'event_title',
				type: 'text',
				label: __( 'Title', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.activityTitle,
				render: ( { item } ) => <ActivityEventTitle activity={ item } />,
				filterBy: { operators: [] },
			},
			{
				id: 'event_description',
				type: 'text',
				label: __( 'Description', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.activityDescription.textDescription,
				render: ( { item } ) => <ActivityEventDescription activity={ item } />,
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
				// Day-level grouping key for the Activity layout. Returns
				// e.g. "Apr 24, 2026" in the site's local timezone so
				// events on the same calendar day collapse under a
				// single group header. Never rendered as a column —
				// `enableHiding: false` keeps it out of the Properties
				// toggle (getHideableFields filters those out) and it's
				// never included in any layout's `view.fields`, so the
				// Table layout ignores it entirely.
				id: 'published_date',
				type: 'text',
				label: __( 'Date', 'jetpack-activity-log' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) =>
					formatDateCell( {
						value: item.activityUnparsedTs,
						timezoneString,
						gmtOffset,
						dateFormat: 'F j, Y',
					} ),
				render: ( { item } ) => (
					<span>
						{ formatDateCell( {
							value: item.activityUnparsedTs,
							timezoneString,
							gmtOffset,
							dateFormat: 'F j, Y',
						} ) }
					</span>
				),
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
			},
			{
				// Hidden field that powers the "Performed by" filter
				// dropdown. Elements are seeded from /activity-log/actors,
				// so each entry matches a distinct actor across the date
				// window. The actual filtering happens server-side via
				// `actor[]` on the list endpoint — `getValue` is wired up
				// only so the filter pill can render the selected label.
				id: 'actor',
				type: 'text',
				label: __( 'Performed by', 'jetpack-activity-log' ),
				getValue: ( { item } ) => item.activityActor?.actorId ?? '',
				elements: actorElements,
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
		actorElements,
		localIsUTC,
	] );
}
