import { describe, expect, it, jest } from '@jest/globals';

const createBlock = jest.fn( ( name, attributes, innerBlocks = [] ) => ( {
	name,
	attributes,
	innerBlocks,
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( { createBlock } ) );
await jest.unstable_mockModule( '@wordpress/i18n', () => ( { __: value => value } ) );

const transforms = ( await import( '../transforms.js' ) ).default;

describe( 'contact form shortcode transform', () => {
	it( 'preserves field help text', () => {
		const rawTransform = transforms.from.find( transform => 'raw' === transform.type );

		rawTransform.transform( { nodeName: 'P', textContent: '[contact-form]' } );
		rawTransform.transform( {
			nodeName: 'P',
			textContent: '[contact-field label="Email" type="email" helptext="Use your work email."]',
		} );
		const transformed = rawTransform.transform( {
			nodeName: 'P',
			textContent: '[/contact-form]',
		} );

		expect( transformed.innerBlocks[ 0 ].attributes.helpText ).toBe( 'Use your work email.' );
	} );
} );
