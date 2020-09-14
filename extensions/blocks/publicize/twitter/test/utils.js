/**
 * @jest-environment jsdom
 */

/**
 * Internal dependencies
 */
import { contentAttributesChanged } from '../utils';

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
