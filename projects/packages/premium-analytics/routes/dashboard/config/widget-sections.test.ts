import { selectSectionWidgetTypes, type SectionScopedWidgetModuleRecord } from './widget-sections';
import type { WidgetName, WidgetType } from '@wordpress/widget-primitives';

const RECORDS: SectionScopedWidgetModuleRecord[] = [
	{ name: 'jpa/total-views', sections: [ 'traffic' ] },
	{ name: 'jpa/popular-days', sections: [ 'traffic', 'insights' ] },
	{ name: 'jpa/tags', sections: null },
	// An empty scope names no section, so it is addable from none.
	{ name: 'jpa/hello-world', sections: [] },
	// Served by a build that predates the field, the way WPCOM's public-api can
	// serve this route from its own checkout.
	{ name: 'jpa/shares' },
];

const WIDGET_TYPES: WidgetType[] = RECORDS.map( record => ( {
	apiVersion: 1,
	name: record.name as WidgetName,
	title: record.name,
	renderModule: `${ record.name }/render`,
} ) );

const NOTHING_PLACED: ReadonlySet< string > = new Set();

describe( 'selectSectionWidgetTypes', () => {
	it( 'keeps a type whose scope names the section', () => {
		const names = selectSectionWidgetTypes( WIDGET_TYPES, RECORDS, 'traffic', NOTHING_PLACED ).map(
			type => type.name
		);

		expect( names ).toEqual( [ 'jpa/total-views', 'jpa/popular-days', 'jpa/tags', 'jpa/shares' ] );
	} );

	it( 'drops a type whose scope leaves the section out', () => {
		const names = selectSectionWidgetTypes( WIDGET_TYPES, RECORDS, 'insights', NOTHING_PLACED ).map(
			type => type.name
		);

		expect( names ).toEqual( [ 'jpa/popular-days', 'jpa/tags', 'jpa/shares' ] );
	} );

	it( 'treats a missing or null scope as every section', () => {
		const names = selectSectionWidgetTypes(
			WIDGET_TYPES,
			RECORDS,
			'subscribers',
			NOTHING_PLACED
		).map( type => type.name );

		expect( names ).toEqual( [ 'jpa/tags', 'jpa/shares' ] );
	} );

	it( 'reads an empty scope as no section at all', () => {
		// Distinct from a missing scope: `[]` names nothing, so it is offered
		// nowhere, while absent means everywhere.
		const names = selectSectionWidgetTypes( WIDGET_TYPES, RECORDS, 'traffic', NOTHING_PLACED ).map(
			type => type.name
		);

		// The pair is the point: both are "no sections named", and only one of
		// them means "every section".
		expect( names ).not.toContain( 'jpa/hello-world' );
		expect( names ).toContain( 'jpa/shares' );
	} );

	it( 'keeps an out-of-scope type the section already places', () => {
		// The reader added it before the scope existed, or an older default
		// seeded it. Dropping it would render the instance as "Missing widget".
		const names = selectSectionWidgetTypes(
			WIDGET_TYPES,
			RECORDS,
			'insights',
			new Set( [ 'jpa/total-views' ] )
		).map( type => type.name );

		expect( names ).toContain( 'jpa/total-views' );
	} );

	it( 'keeps a type whose record has not arrived', () => {
		// The types and the records resolve independently; scoping a type away
		// on a missing record would blank the grid mid-load.
		const names = selectSectionWidgetTypes( WIDGET_TYPES, null, 'insights', NOTHING_PLACED ).map(
			type => type.name
		);

		expect( names ).toEqual( WIDGET_TYPES.map( type => type.name ) );
	} );
} );
