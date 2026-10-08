/**
 * External dependencies
 */
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { calendar, chartLine } from '../library';
import { resolveWidgetIcon } from '../resolve';

describe( 'resolveWidgetIcon', () => {
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
			source: "the dashboard's icon over the library's namesake",
		},
	] )( 'resolves $reference to $source', async ( { reference, icon } ) => {
		await expect( resolveWidgetIcon( reference ) ).resolves.toBe( icon );
	} );

	it.each( [
		[ 'jpa/no-such-icon', 'an unknown name' ],
		[ 'jpa/constructor', 'a prototype key, not an icon' ],
		[ 'core/chart-bar', 'a foreign collection' ],
		[ 'chart-bar', 'a name with no collection' ],
	] )( 'resolves %s to null: %s', async reference => {
		await expect( resolveWidgetIcon( reference ) ).resolves.toBeNull();
	} );
} );
