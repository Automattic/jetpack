/**
 * Internal dependencies
 */
import {
	CHART_DISPLAY_CHART_TYPES,
	chartTypeAttributeField,
	granularityAttributeField,
} from '../chart-display-attribute-fields';

describe( 'granularityAttributeField', () => {
	it( 'offers the buckets the widget asked for, in the order it asked for them', () => {
		const field = granularityAttributeField( [ 'auto', 'day', 'week', 'month' ] );

		expect( field.elements ).toEqual( [
			{ value: 'auto', label: 'Auto' },
			{ value: 'day', label: 'By days' },
			{ value: 'week', label: 'By weeks' },
			{ value: 'month', label: 'By months' },
		] );
	} );

	// The detail charts do not follow the dashboard range, so they pass explicit
	// buckets and must not be handed an `Auto` option they cannot honour.
	it( 'offers only the buckets passed, so a list without `auto` has no `Auto`', () => {
		const field = granularityAttributeField( [ 'day', 'week', 'month' ] );

		expect( field.elements?.map( element => element.value ) ).toEqual( [ 'day', 'week', 'month' ] );
	} );

	// `relevance: 'high'` is what makes the host render the control in the widget
	// body rather than burying it in the options popup.
	it( 'is a high-relevance `granularity` field', () => {
		const field = granularityAttributeField( [ 'day' ] );

		expect( field ).toMatchObject( { id: 'granularity', label: 'Group by', relevance: 'high' } );
	} );
} );

describe( 'chartTypeAttributeField', () => {
	it( 'offers every chart type the shared list names', () => {
		expect( chartTypeAttributeField().elements ).toEqual(
			CHART_DISPLAY_CHART_TYPES.map( ( { id, label } ) => ( { value: id, label } ) )
		);
	} );

	it( 'is a high-relevance `chartType` field', () => {
		expect( chartTypeAttributeField() ).toMatchObject( {
			id: 'chartType',
			label: 'Chart type',
			relevance: 'high',
		} );
	} );
} );
