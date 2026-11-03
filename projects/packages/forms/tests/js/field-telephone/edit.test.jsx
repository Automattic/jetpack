import { expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';

const markNextChangeAsNotPersistent = jest.fn();

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: () => ( { __unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent } ),
} ) );
await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
	useInnerBlocksProps: () => ( {} ),
	BlockContextProvider: ( { children } ) => children,
	BlockControls: ( { children } ) => children,
	RichText: () => null,
} ) );
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	BaseControl: ( { children } ) => children,
	TextControl: () => null,
	ToggleControl: () => null,
	ToolbarButton: () => null,
	ToolbarGroup: ( { children } ) => children,
} ) );
await jest.unstable_mockModule( '@wordpress/i18n', () => ( { __: value => value } ) );
await jest.unstable_mockModule( '@wordpress/icons', () => ( { globe: {} } ) );
await jest.unstable_mockModule( 'clsx', () => ( { default: () => '' } ) );
await jest.unstable_mockModule( '../../../src/blocks/shared/hooks/use-field-selected.js', () => ( {
	default: () => ( { isInnerBlockSelected: false, hasPlaceholder: false } ),
} ) );
await jest.unstable_mockModule( '../../../src/blocks/shared/hooks/use-form-wrapper.js', () => ( {
	default: () => {},
} ) );
await jest.unstable_mockModule(
	'../../../src/blocks/shared/hooks/use-jetpack-field-styles.js',
	() => ( {
		default: () => ( { blockStyle: {} } ),
	} )
);
await jest.unstable_mockModule(
	'../../../src/blocks/shared/hooks/use-sync-required-indicator.js',
	() => ( {
		default: () => {},
	} )
);
await jest.unstable_mockModule(
	'../../../src/blocks/shared/components/jetpack-field-controls.jsx',
	() => ( {
		default: () => null,
	} )
);

const { default: PhoneFieldEdit } = await import( '../../../src/blocks/field-telephone/edit.jsx' );

it( 'marks telephone initialization nonpersistent before setting its default country', () => {
	const setAttributes = jest.fn();
	render( <PhoneFieldEdit attributes={ {} } clientId="phone" setAttributes={ setAttributes } /> );

	expect( setAttributes ).toHaveBeenCalledWith( { showCountrySelector: true, default: 'US' } );
	expect( markNextChangeAsNotPersistent.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
		setAttributes.mock.invocationCallOrder[ 0 ]
	);
} );
