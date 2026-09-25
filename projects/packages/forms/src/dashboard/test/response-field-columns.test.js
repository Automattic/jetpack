import { describe, expect, it } from '@jest/globals';
import {
	getFieldLink,
	getFrozenColumnsClassName,
	getResponseTableView,
	isSameColumnChoice,
	keepColumnChoice,
	getResponseField,
	getResponseFieldColumns,
	getResponseFieldValue,
	mergeResponseFieldColumns,
} from '../response-field-columns.tsx';

const collectionResponse = fields => ( { id: 1, fields } );

// A column as `getResponseFieldColumns` would build it, for the lookup helpers.
const columnFor = ( { id = '', key = '', label = 'L', type = 'text' } = {} ) => ( {
	id: `field:${ id || key }`,
	fieldId: id,
	key,
	label,
	type,
} );

describe( 'getResponseFieldColumns', () => {
	it( 'derives one column per field, keyed by the field key', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				{ key: '1_Name', label: 'Name', value: 'Ada', type: 'name' },
				{ key: '2_Email', label: 'Email', value: 'ada@example.com', type: 'email' },
			] ),
		] );

		expect( columns ).toEqual( [
			{ id: 'field:1_Name', fieldId: '', key: '1_Name', label: 'Name', type: 'name' },
			{ id: 'field:2_Email', fieldId: '', key: '2_Email', label: 'Email', type: 'email' },
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

	it( 'infers a type from the label for legacy responses that carry none', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Rating', value: '4/5' } ] ),
		] );

		expect( column.type ).toBe( 'rating' );
	} );

	it( 'falls back to text when the label matches no known field type', () => {
		// `inferFieldTypeFromLabel` matches on a label *prefix*, so a renamed field
		// ("Please rate our website") is not recognized and its column renders as
		// text. The response inspector behaves the same way, which is the point.
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Please rate our website', value: '4/5' } ] ),
		] );

		expect( column.type ).toBe( 'text' );
	} );

	it( 'keeps an explicit field type over the label guess', () => {
		const [ column ] = getResponseFieldColumns( [
			collectionResponse( [ { key: 'k', label: 'Name', value: 'x', type: 'rating' } ] ),
		] );

		expect( column.type ).toBe( 'rating' );
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

		// The legacy shape carries no type, so it is inferred from the label the way
		// the response inspector does.
		expect( columns ).toEqual( [
			{ id: 'field:Name', fieldId: '', key: 'Name', label: 'Name', type: 'name' },
			{ id: 'field:Message', fieldId: '', key: 'Message', label: 'Message', type: 'textarea' },
		] );
	} );

	it( 'returns nothing for responses without fields', () => {
		expect( getResponseFieldColumns( [ { id: 1 }, { id: 2, fields: [] } ] ) ).toEqual( [] );
		expect( getResponseFieldColumns( undefined ) ).toEqual( [] );
	} );
} );

describe( 'getResponseFieldValue', () => {
	const valueOf = ( value, key = 'k' ) =>
		getResponseFieldValue(
			collectionResponse( [ { key, label: 'L', value } ] ),
			columnFor( { key } )
		);

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
		expect(
			getResponseFieldValue( collectionResponse( [] ), columnFor( { key: 'missing' } ) )
		).toBe( '' );
	} );

	it( 'renders a rating as submitted', () => {
		expect( valueOf( '4/5' ) ).toBe( '4/5' );
	} );
} );

const DESKTOP_VIEW = { titleField: 'from', fields: [ 'date', 'field:1_Name', 'ip' ] };
const COLUMNS = [ { id: 'field:1_Name', fieldId: '', key: '1_Name', label: 'Name', type: 'text' } ];

describe( 'getResponseTableView', () => {
	it( 'hands DataViews the view untouched on a wide screen', () => {
		expect( getResponseTableView( DESKTOP_VIEW, false ) ).toBe( DESKTOP_VIEW );
	} );

	it( 'drops every column but the title and actions on a narrow screen', () => {
		const view = getResponseTableView( DESKTOP_VIEW, true );

		expect( view.fields ).toEqual( [] );
		// The title column is DataViews' own, so it survives; the caller's view is
		// left alone so widening the window restores the columns.
		expect( view.titleField ).toBe( 'from' );
		expect( DESKTOP_VIEW.fields ).toEqual( [ 'date', 'field:1_Name', 'ip' ] );
	} );
} );

describe( 'keepColumnChoice', () => {
	it( 'persists what DataViews reports on a wide screen', () => {
		const incoming = { ...DESKTOP_VIEW, sort: { field: 'date', direction: 'asc' } };

		expect( keepColumnChoice( incoming, DESKTOP_VIEW, false ) ).toBe( incoming );
	} );

	it( 'keeps the real columns when a narrow screen reports a change', () => {
		// Sorting on a phone must not write the collapsed column set back over the
		// columns the user chose on a wide screen.
		const incoming = { ...DESKTOP_VIEW, fields: [], sort: { field: 'date' } };
		const kept = keepColumnChoice( incoming, DESKTOP_VIEW, true );

		expect( kept.fields ).toEqual( [ 'date', 'field:1_Name', 'ip' ] );
		expect( kept.sort ).toEqual( { field: 'date' } );
	} );
} );

describe( 'getFrozenColumnsClassName', () => {
	it( 'freezes the leading columns once there are answers to scroll past', () => {
		expect( getFrozenColumnsClassName( COLUMNS, DESKTOP_VIEW, false ) ).toBe( 'has-field-columns' );
	} );

	it( 'does not freeze when there are no answer columns', () => {
		expect( getFrozenColumnsClassName( [], DESKTOP_VIEW, false ) ).toBeUndefined();
	} );

	it( 'does not freeze on a narrow screen, where nothing scrolls sideways', () => {
		expect( getFrozenColumnsClassName( COLUMNS, DESKTOP_VIEW, true ) ).toBeUndefined();
	} );

	it( 'does not freeze when the title column is hidden', () => {
		// The stylesheet freezes the checkbox column's next sibling. Without a title
		// column that is an answer column, which must not be frozen in its place.
		expect(
			getFrozenColumnsClassName( COLUMNS, { ...DESKTOP_VIEW, showTitle: false }, false )
		).toBeUndefined();
		expect(
			getFrozenColumnsClassName( COLUMNS, { ...DESKTOP_VIEW, titleField: undefined }, false )
		).toBeUndefined();
	} );
} );

describe( 'getFieldLink', () => {
	it( 'opens an address in a mail client', () => {
		expect( getFieldLink( 'email', 'ada@example.com' ) ).toEqual( {
			href: 'mailto:ada@example.com',
			openInNewTab: false,
		} );
	} );

	it( 'dials a phone number, without the spaces it is displayed with', () => {
		expect( getFieldLink( 'telephone', '+1 415 555 0101' ) ).toEqual( {
			href: 'tel:+14155550101',
			openInNewTab: false,
		} );
		expect( getFieldLink( 'phone', '555 0101' ).href ).toBe( 'tel:5550101' );
	} );

	it( 'opens a web address in a new tab', () => {
		expect( getFieldLink( 'url', 'https://example.com/a-page' ) ).toEqual( {
			href: 'https://example.com/a-page',
			openInNewTab: true,
		} );
		expect( getFieldLink( 'url', 'http://example.com' ).openInNewTab ).toBe( true );
	} );

	it( 'leaves a value that does not look like its type as plain text', () => {
		// The response inspector applies the same two guards, so the table matches it.
		expect( getFieldLink( 'email', 'not an address' ) ).toBeNull();
		expect( getFieldLink( 'url', 'example.com' ) ).toBeNull();
		expect( getFieldLink( 'url', 'javascript:alert(1)' ) ).toBeNull();
	} );

	it( 'leaves every other field type as plain text', () => {
		expect( getFieldLink( 'text', 'https://example.com' ) ).toBeNull();
		expect( getFieldLink( 'textarea', 'ada@example.com' ) ).toBeNull();
		expect( getFieldLink( 'select', 'Newsletter' ) ).toBeNull();
	} );
} );

describe( 'getResponseField', () => {
	it( 'returns the field so a caller can read its raw value, not just the text', () => {
		const response = collectionResponse( [
			{ key: 'k', label: 'Sessions', value: [ 'Keynote', 'Panel' ], type: 'checkbox-multiple' },
		] );

		expect(
			getResponseField( response, columnFor( { key: 'k', label: 'Sessions' } ) ).value
		).toEqual( [ 'Keynote', 'Panel' ] );
		expect(
			getResponseField( response, columnFor( { key: 'missing', label: 'Missing' } ) )
		).toBeUndefined();
	} );
} );

describe( 'mergeResponseFieldColumns', () => {
	const a = { id: 'field:a', fieldId: 'a', key: '1_A', label: 'A', type: 'text' };
	const b = { id: 'field:b', fieldId: 'b', key: '2_B', label: 'B', type: 'text' };

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

/**
 * A field as the collection format stores it, carrying both identifiers.
 *
 * @param {object} field         - The field parts.
 * @param {string} field.id      - The form field id from the form schema.
 * @param {string} field.key     - The response's own `<position>_<label>` key.
 * @param {string} field.label   - The field label.
 * @param {*}      [field.value] - The stored answer.
 * @param {string} [field.type]  - The form field type.
 * @return {object} The response field.
 */
const identifiedField = ( { id, key, label, value = 'x', type = 'text' } ) => ( {
	id,
	key,
	label,
	value,
	type,
} );

describe( 'field identity across form edits', () => {
	it( 'keeps one column when a field moves and its positional key changes', () => {
		// A response stores its keys as `<position>_<label>`, so moving Email ahead of
		// Name renumbers both. Keyed on that, one field becomes two columns.
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				identifiedField( { id: 'g5-name', key: '1_Name', label: 'Name' } ),
				identifiedField( { id: 'g5-email', key: '2_Email', label: 'Email' } ),
			] ),
			collectionResponse( [
				identifiedField( { id: 'g5-email', key: '1_Email', label: 'Email' } ),
				identifiedField( { id: 'g5-name', key: '2_Name', label: 'Name' } ),
			] ),
		] );

		expect( columns.map( column => column.id ) ).toEqual( [ 'field:g5-name', 'field:g5-email' ] );
	} );

	it( 'reads each answer from its own field when responses disagree on order', () => {
		const reordered = collectionResponse( [
			identifiedField( { id: 'g5-email', key: '1_Email', label: 'Email', value: 'grace@x.com' } ),
			identifiedField( { id: 'g5-name', key: '2_Name', label: 'Name', value: 'Grace' } ),
		] );

		// Read positionally, the Name column would take `1_Email` and file the address
		// under the wrong header.
		expect(
			getResponseFieldValue(
				reordered,
				columnFor( { id: 'g5-name', key: '1_Name', label: 'Name' } )
			)
		).toBe( 'Grace' );
	} );

	it( 'shows nothing when an identified response simply lacks the field', () => {
		const withoutName = collectionResponse( [
			identifiedField( { id: 'g5-email', key: '1_Email', label: 'Email', value: 'grace@x.com' } ),
		] );

		expect(
			getResponseFieldValue(
				withoutName,
				columnFor( { id: 'g5-name', key: '1_Name', label: 'Name' } )
			)
		).toBe( '' );
	} );

	it( 'falls back to the label for a response predating form field ids', () => {
		expect(
			getResponseFieldValue(
				{ id: 2, fields: { Name: 'Grace' } },
				columnFor( { id: 'g5-name', key: '1_Name', label: 'Name' } )
			)
		).toBe( 'Grace' );
	} );

	it( 'gives a field one column whether or not the response carrying it was identified', () => {
		const columns = getResponseFieldColumns( [
			collectionResponse( [ identifiedField( { id: 'g5-name', key: '1_Name', label: 'Name' } ) ] ),
			{ id: 2, fields: { Name: 'Grace' } },
		] );

		expect( columns.map( column => column.id ) ).toEqual( [ 'field:g5-name' ] );
	} );

	it( 'keeps two columns for two identified fields that share a label', () => {
		// Distinct ids mean genuinely distinct fields, however alike their headers read.
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				identifiedField( { id: 'g5-name', key: '1_Name', label: 'Name' } ),
				identifiedField( { id: 'g5-name-2', key: '2_Name', label: 'Name' } ),
			] ),
		] );

		expect( columns.map( column => column.id ) ).toEqual( [ 'field:g5-name', 'field:g5-name-2' ] );
	} );

	it( 'tells two same-labelled fields apart after one of them has moved', () => {
		// Both fallbacks are useless here: the label is ambiguous, and the swap means the
		// positional key now belongs to the other field. Only the form field id can say
		// which answer goes under which header.
		const columns = getResponseFieldColumns( [
			collectionResponse( [
				identifiedField( { id: 'g5-name', key: '1_Name', label: 'Name', value: 'Ada' } ),
				identifiedField( { id: 'g5-name-2', key: '2_Name', label: 'Name', value: 'Lovelace' } ),
			] ),
		] );
		const swapped = collectionResponse( [
			identifiedField( { id: 'g5-name-2', key: '1_Name', label: 'Name', value: 'Hopper' } ),
			identifiedField( { id: 'g5-name', key: '2_Name', label: 'Name', value: 'Grace' } ),
		] );

		expect( getResponseFieldValue( swapped, columns[ 0 ] ) ).toBe( 'Grace' );
		expect( getResponseFieldValue( swapped, columns[ 1 ] ) ).toBe( 'Hopper' );
	} );

	it( 'does not append an unidentified column for a field already known by id', () => {
		const known = {
			id: 'field:g5-name',
			fieldId: 'g5-name',
			key: '1_Name',
			label: 'Name',
			type: 'text',
		};
		const legacy = { id: 'field:Name', fieldId: '', key: 'Name', label: 'Name', type: 'text' };

		expect( mergeResponseFieldColumns( [ known ], [ legacy ] ) ).toEqual( [ known ] );
	} );
} );

describe( 'getResponseTableView, reconciling a restored choice', () => {
	const KNOWN = new Set( [ 'date', 'field:a', 'source' ] );

	it( 'withholds a column DataViews has no field for', () => {
		// DataViews renders a cell for every id it is given and skips the ones it cannot
		// resolve, leaving a blank column with no header menu — and the properties panel
		// lists the fields it knows rather than the columns on screen, so the user has no
		// way to take it off again.
		const view = { titleField: 'from', fields: [ 'date', 'field:deleted', 'source' ] };

		expect( getResponseTableView( view, false, KNOWN ).fields ).toEqual( [ 'date', 'source' ] );
	} );

	it( 'shows a column only once, however often the choice names it', () => {
		const view = { titleField: 'from', fields: [ 'date', 'field:a', 'field:a', 'source' ] };

		expect( getResponseTableView( view, false, KNOWN ).fields ).toEqual( [
			'date',
			'field:a',
			'source',
		] );
	} );

	it( 'hands the view straight back when every column resolves', () => {
		const view = { titleField: 'from', fields: [ 'date', 'field:a', 'source' ] };

		expect( getResponseTableView( view, false, KNOWN ) ).toBe( view );
	} );

	it( 'still drops every column on a narrow screen', () => {
		const view = { titleField: 'from', fields: [ 'date', 'field:a' ] };

		expect( getResponseTableView( view, true, KNOWN ).fields ).toEqual( [] );
	} );
} );

describe( 'keepColumnChoice, putting back what DataViews never saw', () => {
	const KNOWN = new Set( [ 'date', 'field:a', 'source', 'ip' ] );

	it( 'keeps a withheld column, in the place the user left it', () => {
		// `field:pending` belongs to a field whose responses have not loaded yet. DataViews
		// was never shown it, so it cannot report it back — and taking its answer at face
		// value would drop a column the user chose.
		const current = { fields: [ 'date', 'field:pending', 'field:a', 'source' ] };
		const incoming = { fields: [ 'date', 'field:a', 'source' ] };

		expect( keepColumnChoice( incoming, current, false, KNOWN ).fields ).toEqual( [
			'date',
			'field:pending',
			'field:a',
			'source',
		] );
	} );

	it( 'keeps a withheld leading column at the front', () => {
		const current = { fields: [ 'field:pending', 'date' ] };
		const incoming = { fields: [ 'date' ] };

		expect( keepColumnChoice( incoming, current, false, KNOWN ).fields ).toEqual( [
			'field:pending',
			'date',
		] );
	} );

	it( "carries the user's reordering of the columns DataViews did see", () => {
		const current = { fields: [ 'date', 'field:pending', 'field:a', 'source' ] };
		const incoming = { fields: [ 'source', 'date', 'field:a' ] };

		expect( keepColumnChoice( incoming, current, false, KNOWN ).fields ).toEqual( [
			'source',
			'date',
			'field:pending',
			'field:a',
		] );
	} );

	it( 'passes the view through when nothing was withheld', () => {
		const current = { fields: [ 'date', 'field:a' ] };
		const incoming = { fields: [ 'field:a', 'date' ] };

		expect( keepColumnChoice( incoming, current, false, KNOWN ) ).toBe( incoming );
	} );
} );

describe( 'isSameColumnChoice', () => {
	it( 'tells a change of columns from a change of anything else', () => {
		expect( isSameColumnChoice( [ 'date', 'ip' ], [ 'date', 'ip' ] ) ).toBe( true );
		expect( isSameColumnChoice( [ 'date', 'ip' ], [ 'ip', 'date' ] ) ).toBe( false );
		expect( isSameColumnChoice( [ 'date' ], [ 'date', 'ip' ] ) ).toBe( false );
		expect( isSameColumnChoice( undefined, [] ) ).toBe( true );
	} );
} );

describe( 'column identity does not depend on the order responses arrive in', () => {
	// A form holding responses from before and after form field ids: sorted one way the
	// identified response comes first, sorted the other way it does not. The column id
	// has to come out the same either way, or a stored choice keyed on one of them
	// strands a column the next session cannot resolve.
	const identified = collectionResponse( [
		identifiedField( { id: 'g5-name', key: '1_Name', label: 'Name', value: 'Ada' } ),
	] );
	const legacy = { id: 2, fields: { Name: 'Grace' } };

	it( 'prefers the form field id whichever response is seen first', () => {
		expect( getResponseFieldColumns( [ identified, legacy ] ).map( c => c.id ) ).toEqual( [
			'field:g5-name',
		] );
		expect( getResponseFieldColumns( [ legacy, identified ] ).map( c => c.id ) ).toEqual( [
			'field:g5-name',
		] );
	} );

	it( 'still reads the answer off the response that carries no id', () => {
		const [ column ] = getResponseFieldColumns( [ legacy, identified ] );

		expect( getResponseFieldValue( legacy, column ) ).toBe( 'Grace' );
		expect( getResponseFieldValue( identified, column ) ).toBe( 'Ada' );
	} );
} );
