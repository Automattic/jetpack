import { describe, expect, it, jest } from '@jest/globals';

const createBlock = jest.fn( ( name, attributes, innerBlocks = [] ) => ( {
	name,
	attributes,
	innerBlocks,
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( { createBlock } ) );
await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: value => value,
	sprintf: ( value, replacement ) => value.replace( '%s', replacement ),
} ) );

const transforms = ( await import( '../transforms.js' ) ).default;

describe( 'field transforms', () => {
	it( 'preserves help text when changing field type', () => {
		const emailTransform = transforms.to.find( transform =>
			transform.blocks?.includes( 'jetpack/field-email' )
		);

		const transformed = emailTransform.transform( { helpText: 'Use your work email.' } );

		expect( transformed.attributes.helpText ).toBe( 'Use your work email.' );
	} );
} );
