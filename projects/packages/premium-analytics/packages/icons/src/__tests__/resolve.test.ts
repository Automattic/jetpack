/**
 * External dependencies
 */
import { calendar, chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { chartLine } from '../library';
import { lookupWidgetIcon, resolveWidgetIcon } from '../resolve';

describe( 'lookupWidgetIcon', () => {
	it.each( [
		{ reference: 'jpa/chart-line', icon: chartLine, source: "the dashboard's own icon" },
		{
			reference: 'jpa/chart-bar',
			icon: chartBar,
			source: '@wordpress/icons by its kebab-case name',
		},
		{
			reference: 'jpa/calendar',
			icon: calendar,
			source: "the WordPress glyph, not the dashboard's namesake",
		},
	] )( 'finds $reference: $source', ( { reference, icon } ) => {
		expect( lookupWidgetIcon( reference ) ).toBe( icon );
	} );

	it.each( [
		[ 'jpa/no-such-icon', 'a name outside the collection' ],
		[ 'jpa/constructor', 'a prototype key, not an icon' ],
		[ 'core/chart-bar', 'a foreign collection' ],
		[ 'chart-bar', 'a name with no collection' ],
	] )( 'finds nothing for %s: %s', reference => {
		expect( lookupWidgetIcon( reference ) ).toBeNull();
	} );
} );

describe( 'resolveWidgetIcon', () => {
	it( 'resolves what the lookup finds', async () => {
		await expect( resolveWidgetIcon( 'jpa/chart-line' ) ).resolves.toBe( chartLine );
	} );
} );
