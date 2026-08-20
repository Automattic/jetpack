/**
 * Internal dependencies
 */
// The tab sets come from `config/tabs` directly rather than each report's
// `config` barrel, which re-exports `fields.tsx` and would pull JSX and the
// router in. Same reason `registry.ts` imports them this way.
import { getCommentsReportTabs, getTabTitle as getCommentsTabTitle } from './comments/config/tabs';
import {
	getReportLocationsTabs,
	getTabTitle as getLocationsTabTitle,
} from './locations/config/tabs';
import { getReportPostsTabs, getTabTitle as getPostsTabTitle } from './posts/config/tabs';
import { REPORTS } from './registry';
import { getReportUtmTabs, getTabTitle as getUtmTabTitle } from './utm/config/tabs';

/**
 * Flatten a tab set into `[ report, tab label, section heading ]` rows.
 *
 * @param report      - The report the set belongs to.
 * @param getTabs     - The set's ordered tabs.
 * @param getTabTitle - The set's heading resolver.
 * @return One row per tab.
 */
function tabHeadings< TabId extends string >(
	report: string,
	getTabs: () => { id: TabId; label: string }[],
	getTabTitle: ( id: TabId ) => string
): [ string, string, string ][] {
	return getTabs().map( ( { id, label } ) => [ report, label, getTabTitle( id ) ] );
}

const TAB_HEADINGS = [
	...tabHeadings( 'Posts & Pages', getReportPostsTabs, getPostsTabTitle ),
	...tabHeadings( 'Comments', getCommentsReportTabs, getCommentsTabTitle ),
	...tabHeadings( 'Locations', getReportLocationsTabs, getLocationsTabTitle ),
	...tabHeadings( 'UTM', getReportUtmTabs, getUtmTabTitle ),
];

const REPORT_NAMES = Object.entries( REPORTS ).map( ( [ key, report ] ) => [
	key,
	report.id,
	report.getLabel(),
	report.getTitle(),
] );

/*
 * The crumb names the report and the heading names its records, one `report`
 * apart. That convention drifts a string at a time, so it is asserted rather
 * than written down.
 */
describe( 'report names', () => {
	it.each( REPORT_NAMES )( '%s heads its records with its own label', ( key, id, label, title ) => {
		expect( title ).toBe( `${ label } report` );
		expect( id ).toBe( key );
	} );

	it.each( TAB_HEADINGS )( '%s heads the %s section with its tab', ( _report, label, title ) => {
		expect( title ).toBe( `${ label } report` );
	} );
} );
