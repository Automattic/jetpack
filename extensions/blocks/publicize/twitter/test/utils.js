/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import { contentAttributesChanged, checkForTagsInContentAttributes } from '../utils';

describe( 'contentAttributesChanged', () => {
	it( 'should return false for unsupported blocks', () => {
		const prevProps = {
			attributes: {
				content: 'foo',
			},
		};

		const props = {
			attributes: {
				content: 'bar',
			},
			name: 'fake/block',
		};

		expect( contentAttributesChanged( prevProps, props ) ).toBeFalsy();
	} );

	it( 'should return true for changed content props', () => {
		const prevProps = {
			attributes: {
				content: 'foo',
			},
		};

		const props = {
			attributes: {
				content: 'bar',
			},
			name: 'core/paragraph',
		};

		expect( contentAttributesChanged( prevProps, props ) ).toBeTruthy();
	} );

	it( 'should return false for changed other props', () => {
		const prevProps = {
			attributes: {
				content: 'foo',
				align: 'left',
			},
		};

		const props = {
			attributes: {
				content: 'foo',
				align: 'right',
			},
			name: 'core/paragraph',
		};

		expect( contentAttributesChanged( prevProps, props ) ).toBeFalsy();
	} );
} );

describe( 'checkForTagsInContentAttributes', () => {
	it( 'should return false for unsupported blocks', () => {
		const props = {
			attributes: {
				content: '<strong>bar</strong>',
			},
			name: 'fake/block',
		};
		const tags = [ 'strong' ];

		expect( checkForTagsInContentAttributes( props, tags ) ).toBeFalsy();
	} );

	it( 'should return false if the tags are not in the content', () => {
		const props = {
			attributes: {
				content: '<i>bar</i>',
			},
			name: 'core/paragraph',
		};
		const tags = [ 'strong', 'em', 'b' ];

		expect( checkForTagsInContentAttributes( props, tags ) ).toBeFalsy();
	} );

	it( 'should return true if the tags are in the content', () => {
		const props = {
			attributes: {
				content: '<i>bar</i>',
			},
			name: 'core/paragraph',
		};
		const tags = [ 'strong', 'em', 'b', 'i' ];

		expect( checkForTagsInContentAttributes( props, tags ) ).toBeTruthy();
	} );

	it( 'should return true if the tags are in only one attribute', () => {
		const props = {
			attributes: {
				value: '<s>bar</s>',
				citation: '<i>bar</i>',
			},
			name: 'core/quote',
		};
		const tags = [ 'strong', 'em', 'b', 'i' ];

		expect( checkForTagsInContentAttributes( props, tags ) ).toBeTruthy();
	} );
} );
