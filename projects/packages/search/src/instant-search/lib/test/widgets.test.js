import { normalizeWidgets } from '../widgets';

const validWidget = { widget_id: 'widget-1', filters: [ { filter_id: 'category' } ] };

test( 'returns an array of well-formed widgets unchanged', () => {
	expect( normalizeWidgets( [ validWidget ] ) ).toEqual( [ validWidget ] );
} );

test( 'returns an empty array for undefined', () => {
	expect( normalizeWidgets( undefined ) ).toEqual( [] );
} );

test( 'returns an empty array for null', () => {
	expect( normalizeWidgets( null ) ).toEqual( [] );
} );

test( 'returns an empty array when given a non-array object', () => {
	expect( normalizeWidgets( { widget_id: 'widget-1' } ) ).toEqual( [] );
} );

test( 'returns an empty array when given a string', () => {
	expect( normalizeWidgets( 'not-an-array' ) ).toEqual( [] );
} );

test( 'drops entries missing a widget_id', () => {
	expect( normalizeWidgets( [ { filters: [] } ] ) ).toEqual( [] );
} );

test( 'drops entries missing a filters array', () => {
	expect( normalizeWidgets( [ { widget_id: 'widget-1' } ] ) ).toEqual( [] );
} );

test( 'drops entries that are empty objects', () => {
	expect( normalizeWidgets( [ {} ] ) ).toEqual( [] );
} );

test( 'drops entries that are arrays or null', () => {
	expect( normalizeWidgets( [ [], null, validWidget ] ) ).toEqual( [ validWidget ] );
} );

test( 'drops malformed entries within a widget filters array', () => {
	const widget = {
		widget_id: 'widget-1',
		filters: [ null, {}, [], { filter_id: 'category' } ],
	};
	expect( normalizeWidgets( [ widget ] ) ).toEqual( [
		{ widget_id: 'widget-1', filters: [ { filter_id: 'category' } ] },
	] );
} );
