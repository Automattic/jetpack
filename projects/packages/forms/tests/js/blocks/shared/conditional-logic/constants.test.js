import {
	countRules,
	normalizeLogic,
	startsHidden,
} from '../../../../../src/blocks/shared/conditional-logic/constants.js';

const withRules = ( action, count ) =>
	normalizeLogic( {
		enabled: count > 0,
		action,
		groups: count
			? [
					{
						logicalOperator: 'all',
						rules: Array.from( { length: count }, () => ( {
							field: 'a',
							operator: 'is',
							value: 'x',
						} ) ),
					},
			  ]
			: [],
	} );

/**
 * The toolbar icon and the builder's opening line both report this, so it lives in one place
 * rather than being decided twice.
 */
describe( 'startsHidden', () => {
	it( 'is true for a show rule, which reveals a field that begins hidden', () => {
		expect( startsHidden( withRules( 'show', 1 ) ) ).toBe( true );
	} );

	it( 'is false for a hide rule, which removes a field that begins visible', () => {
		expect( startsHidden( withRules( 'hide', 1 ) ) ).toBe( false );
	} );

	// The action defaults to `show`, so a field with no conditions would otherwise read as
	// hidden -- when in fact nothing is conditional about it at all.
	it( 'is false for a field with no conditions', () => {
		expect( startsHidden( withRules( 'show', 0 ) ) ).toBe( false );
	} );
} );

describe( 'countRules', () => {
	it( 'counts across the groups', () => {
		expect( countRules( withRules( 'show', 3 ) ) ).toBe( 3 );
		expect( countRules( withRules( 'show', 0 ) ) ).toBe( 0 );
	} );
} );
