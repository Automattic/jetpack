import { describe, expect, it } from '@jest/globals';
import {
	getResponseFieldColumns,
	getResponseFieldValue,
	mergeResponseFieldColumns,
} from '../response-field-columns.tsx';

const collectionResponse = fields => ( { id: 1, fields } );

describe( 'getResponseFieldColumns', () => {
	it( 'derives one column per field, keyed by the field key', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				{ key: '1_Name', label: 'Name', value: 'Ada', type: 'name' },
				{ key: '2_Email', label: 'Email', value: 'ada@example.com', type: 'email' },
			] ),
		] );

		expect( columns ).toEqual( [
			{ id: 'field:1_Name', key: '1_Name', label: 'Name' },
			{ id: 'field:2_Email', key: '2_Email', label: 'Email' },
		] );
	} );

	it( 'unions fields across responses, so a field only some responses carry still gets a column', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [ { key: '1_Name', label: 'Name', value: 'Ada' } ] ),
			collectionResponse( [
				{ key: '1_Name', label: 'Name', value: 'Grace' },
				{ key: '2_Phone', label: 'Phone', value: '555' },
			] ),
		] );

		expect( columns.map( column => column.key ) ).toEqual( [ '1_Name', '2_Phone' ] );
	} );

	it( 'decodes entities in the column label', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Tom &amp; Jerry', value: 'x' } ] ),
		] );

		expect( column.label ).toBe( 'Tom & Jerry' );
	} );

	it( 'reads the legacy label-value shape, keying columns by label', () => {
		const columns = getResponseFieldColumns( [
			{ id: 1, fields: { Name: 'Ada', Message: 'Hello' } },
		] );

		expect( columns ).toEqual( [
			{ id: 'field:Name', key: 'Name', label: 'Name' },
			{ id: 'field:Message', key: 'Message', label: 'Message' },
		] );
	} );

	it( 'returns nothing for responses without fields', () => {
		expect( getResponseFieldColumns( [ { id: 1 }, { id: 2, fields: [] } ] ) ).toEqual( [] );
		expect( getResponseFieldColumns( undefined ) ).toEqual( [] );
	} );
} );

describe( 'getResponseFieldValue', () => {
	const valueOf = ( value, key = 'k' ) =>
		getResponseFieldValue( collectionResponse( [ { key, label: 'L', value } ] ), key );

	it( 'renders a plain string', () => {
		expect( valueOf( 'Social Media' ) ).toBe( 'Social Media' );
	} );

	it( 'joins a multiple-choice array', () => {
		expect( valueOf( [ 'Keynote', 'Workshop', 'Panel' ] ) ).toBe( 'Keynote, Workshop, Panel' );
	} );

	it( 'names a single uploaded file and counts several', () => {
		expect( valueOf( { files: [ { name: 'proposal.pdf' } ] } ) ).toBe( 'proposal.pdf' );
		expect( valueOf( { files: [ { name: 'a.pdf' }, { name: 'b.pdf' } ] } ) ).toBe( '2 files' );
		expect( valueOf( { files: [] } ) ).toBe( '' );
	} );

	it( 'lists the chosen image-select options', () => {
		expect(
			valueOf( {
				type: 'image-select',
				choices: [ { selected: 'Riverside Hall' }, { selected: 'b', label: 'Garden Room' } ],
			} )
		).toBe( 'Riverside Hall, Garden Room' );
	} );

	it( 'decodes entities in the value', () => {
		expect( valueOf( 'Tom &amp; Jerry' ) ).toBe( 'Tom & Jerry' );
	} );

	it( 'renders an empty string for missing, empty and unrecognized values', () => {
		expect( valueOf( null ) ).toBe( '' );
		expect( valueOf( undefined ) ).toBe( '' );
		expect( valueOf( '   ' ) ).toBe( '' );
		expect( valueOf( { unexpected: true } ) ).toBe( '' );
		expect( getResponseFieldValue( collectionResponse( [] ), 'missing' ) ).toBe( '' );
	} );

	it( 'renders a rating as submitted', () => {
		expect( valueOf( '4/5' ) ).toBe( '4/5' );
	} );
} );

describe( 'mergeResponseFieldColumns', () => {
	const a = { id: 'field:a', key: 'a', label: 'A' };
	const b = { id: 'field:b', key: 'b', label: 'B' };

	it( 'appends columns that are new', () => {
		expect( mergeResponseFieldColumns( [ a ], [ a, b ] ) ).toEqual( [ a, b ] );
	} );

	it( 'keeps the same reference when nothing is new, so the view does not churn', () => {
		const previous = [ a, b ];
		expect( mergeResponseFieldColumns( previous, [ a ] ) ).toBe( previous );
	} );

	it( 'keeps columns that the current page no longer carries', () => {
		expect( mergeResponseFieldColumns( [ a, b ], [] ) ).toEqual( [ a, b ] );
	} );
} );
