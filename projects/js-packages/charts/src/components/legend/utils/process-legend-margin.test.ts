import { processLegendMargin } from './process-legend-margin';

describe( 'processLegendMargin', () => {
	describe( 'undefined input', () => {
		test( 'returns empty object when legendMargin is undefined', () => {
			const result = processLegendMargin( undefined );
			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when legendMargin is not provided', () => {
			const result = processLegendMargin();
			expect( result ).toEqual( {} );
		} );
	} );

	describe( 'string input', () => {
		test( 'returns margin property when legendMargin is a string', () => {
			const result = processLegendMargin( '10px' );
			expect( result ).toEqual( { margin: '10px' } );
		} );

		test( 'handles complex margin string values', () => {
			const result = processLegendMargin( '10px 20px 30px 40px' );
			expect( result ).toEqual( { margin: '10px 20px 30px 40px' } );
		} );

		test( 'handles margin string with different units', () => {
			const result = processLegendMargin( '1rem 2em' );
			expect( result ).toEqual( { margin: '1rem 2em' } );
		} );
	} );

	describe( 'object input with numbers', () => {
		test( 'converts number values to px strings', () => {
			const result = processLegendMargin( { top: 10, right: 15, bottom: 10, left: 15 } );
			expect( result ).toEqual( {
				marginTop: '10px',
				marginRight: '15px',
				marginBottom: '10px',
				marginLeft: '15px',
			} );
		} );

		test( 'handles single margin property', () => {
			const result = processLegendMargin( { top: 20 } );
			expect( result ).toEqual( { marginTop: '20px' } );
		} );

		test( 'handles zero values', () => {
			const result = processLegendMargin( { top: 0, right: 0 } );
			expect( result ).toEqual( {
				marginTop: '0px',
				marginRight: '0px',
			} );
		} );
	} );

	describe( 'object input with strings', () => {
		test( 'preserves string values as-is', () => {
			const result = processLegendMargin( {
				top: '1rem',
				right: '2em',
				bottom: '0.5rem',
				left: '10px',
			} );
			expect( result ).toEqual( {
				marginTop: '1rem',
				marginRight: '2em',
				marginBottom: '0.5rem',
				marginLeft: '10px',
			} );
		} );

		test( 'handles mixed string units', () => {
			const result = processLegendMargin( { top: '1rem', bottom: '10%' } );
			expect( result ).toEqual( {
				marginTop: '1rem',
				marginBottom: '10%',
			} );
		} );
	} );

	describe( 'object input with mixed types', () => {
		test( 'handles numbers and strings together', () => {
			const result = processLegendMargin( {
				top: '1rem',
				right: 20,
				bottom: '0.5em',
				left: 10,
			} );
			expect( result ).toEqual( {
				marginTop: '1rem',
				marginRight: '20px',
				marginBottom: '0.5em',
				marginLeft: '10px',
			} );
		} );
	} );

	describe( 'object input with undefined values', () => {
		test( 'filters out undefined values', () => {
			const result = processLegendMargin( {
				top: 10,
				right: undefined,
				bottom: undefined,
				left: 15,
			} );
			expect( result ).toEqual( {
				marginTop: '10px',
				marginLeft: '15px',
			} );
		} );

		test( 'handles partial object with some undefined values', () => {
			const result = processLegendMargin( {
				top: undefined,
				right: 20,
				bottom: undefined,
				left: undefined,
			} );
			expect( result ).toEqual( {
				marginRight: '20px',
			} );
		} );

		test( 'returns empty object when all properties are undefined', () => {
			const result = processLegendMargin( {
				top: undefined,
				right: undefined,
				bottom: undefined,
				left: undefined,
			} );
			expect( result ).toEqual( {} );
		} );
	} );

	describe( 'edge cases', () => {
		test( 'handles empty object', () => {
			const result = processLegendMargin( {} );
			expect( result ).toEqual( {} );
		} );

		test( 'handles negative number values', () => {
			const result = processLegendMargin( { top: -10, right: -5 } );
			expect( result ).toEqual( {
				marginTop: '-10px',
				marginRight: '-5px',
			} );
		} );

		test( 'handles empty string', () => {
			const result = processLegendMargin( '' );
			expect( result ).toEqual( { margin: '' } );
		} );

		test( 'handles string values in object format', () => {
			const result = processLegendMargin( {
				top: '0',
				right: 'auto',
				bottom: 'inherit',
				left: 'initial',
			} );
			expect( result ).toEqual( {
				marginTop: '0',
				marginRight: 'auto',
				marginBottom: 'inherit',
				marginLeft: 'initial',
			} );
		} );
	} );
} );
