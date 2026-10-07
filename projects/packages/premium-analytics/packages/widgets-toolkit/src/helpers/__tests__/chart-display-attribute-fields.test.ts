/**
 * Internal dependencies
 */
import { chartTypeAttributeField } from '../chart-display-attribute-fields';

describe( 'chartTypeAttributeField', () => {
	it( 'names the dashboard field type and carries no options', () => {
		expect( chartTypeAttributeField() ).toEqual( {
			id: 'chartType',
			label: 'Chart type',
			type: 'jpa/line-or-bar',
			relevance: 'high',
		} );
	} );
} );
