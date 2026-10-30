/**
 * Internal dependencies
 */
import { ReportParamsField } from '../../packages/fields/src/field-report-params';
import { buildControlFields } from './controls';

describe( 'buildControlFields', () => {
	it( 'resolves a declared field through its registered type', () => {
		const elements = [ { value: 'last-7-days', label: 'Last 7 days' } ];
		const fields = buildControlFields( [ { id: 'range', type: 'jpa/report-params', elements } ] );

		expect( fields ).toHaveLength( 1 );
		expect( fields[ 0 ] ).toMatchObject( { id: 'range', elements, Edit: ReportParamsField } );
	} );

	it.each( [
		[ 'none for an empty list', [], [] ],
		[ 'the default date control for null', null, [ 'reportParams' ] ],
	] )( 'builds %s', ( _, controls, ids ) => {
		const fields = buildControlFields( controls );

		expect( fields.map( field => field.id ) ).toEqual( ids );
		expect( fields.every( field => field.Edit === ReportParamsField ) ).toBe( true );
	} );
} );
