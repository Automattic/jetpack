/**
 * External dependencies
 */
import { computePrimaryRange, parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { useCallback, useMemo, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { FIXTURE_SITE_TIME_ZONE } from '../../../../../packages/widgets-toolkit/src/__fixtures__/wp-date-settings';

export type StoryWindowArgs = {
	/*
	 * The preset the page opens on, as the URL carries it.
	 */
	preset: 'last-7-days' | 'last-30-days' | 'all-time';

	/*
	 * Where All time starts, as the summary states it; undefined while it resolves.
	 */
	allTimeStart?: string;
};

/**
 * The item the page's controls edit, as the stage keeps it: the report window the page
 * writes to the URL and the All time anchor, plus the range the header states.
 *
 * @param {StoryWindowArgs} args - The args.
 * @return The item, its change handler and the range.
 */
export function useStoryWindow( { preset, allTimeStart }: StoryWindowArgs ) {
	const [ reportParams, setReportParams ] = useState< Record< string, unknown > >( { preset } );

	const data = useMemo( () => ( { reportParams, allTimeStart } ), [ reportParams, allTimeStart ] );

	const onChange = useCallback( ( edits: Record< string, unknown > ) => {
		if ( edits.reportParams ) {
			setReportParams( edits.reportParams as Record< string, unknown > );
		}
	}, [] );

	const range = useMemo( () => {
		const from = parseSiteDateTime( reportParams.from );
		const to = parseSiteDateTime( reportParams.to );
		return from && to ? { from, to } : computePrimaryRange( preset, FIXTURE_SITE_TIME_ZONE );
	}, [ reportParams, preset ] );

	return { data, onChange, range };
}
