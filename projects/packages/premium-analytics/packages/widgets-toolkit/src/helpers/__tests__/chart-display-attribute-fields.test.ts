/**
 * Internal dependencies
 */
import {
	CHART_DISPLAY_CHART_TYPES,
	chartTypeAttributeField,
} from '../chart-display-attribute-fields';

describe( 'chartTypeAttributeField', () => {
	it( 'offers every chart type the shared list names', () => {
		expect( chartTypeAttributeField().elements ).toEqual(
			CHART_DISPLAY_CHART_TYPES.map( ( { id, label, icon } ) => ( { value: id, label, icon } ) )
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
