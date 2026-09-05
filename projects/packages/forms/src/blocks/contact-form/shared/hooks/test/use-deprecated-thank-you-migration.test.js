import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const markNextChangeAsNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} ),
} ) );

const { default: useDeprecatedThankYouMigration } = await import(
	'../use-deprecated-thank-you-migration.js'
);

describe( 'useDeprecatedThankYouMigration', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'derives confirmationType from a redirect customThankyou', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useDeprecatedThankYouMigration( {
				attributes: { customThankyou: 'redirect' },
				setAttributes,
			} )
		);

		expect( setAttributes ).toHaveBeenCalledWith( { confirmationType: 'redirect' } );
	} );

	it.each( [ 'noSummary', 'message' ] )(
		'derives disableSummary from a %s customThankyou',
		customThankyou => {
			const setAttributes = jest.fn();

			renderHook( () =>
				useDeprecatedThankYouMigration( { attributes: { customThankyou }, setAttributes } )
			);

			expect( setAttributes ).toHaveBeenCalledWith( { disableSummary: true } );
		}
	);

	it( 'marks the migration as not persistent so the entity stays clean', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useDeprecatedThankYouMigration( {
				attributes: { customThankyou: 'redirect' },
				setAttributes,
			} )
		);

		expect( markNextChangeAsNotPersistent ).toHaveBeenCalledTimes( 1 );
		expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			setAttributes.mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'writes nothing when the newer attributes already say the same thing', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useDeprecatedThankYouMigration( {
				attributes: {
					customThankyou: 'redirect',
					confirmationType: 'redirect',
					disableSummary: false,
				},
				setAttributes,
			} )
		);

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markNextChangeAsNotPersistent ).not.toHaveBeenCalled();
	} );

	it( 'writes nothing for a form that never used customThankyou', () => {
		const setAttributes = jest.fn();

		renderHook( () =>
			useDeprecatedThankYouMigration( { attributes: { customThankyou: '' }, setAttributes } )
		);

		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'tolerates missing attributes', () => {
		const setAttributes = jest.fn();

		renderHook( () => useDeprecatedThankYouMigration( { attributes: undefined, setAttributes } ) );

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );
