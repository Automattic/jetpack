/**
 * Internal dependencies
 */
import { extractAttributesFromIframe } from '../utils';

describe( 'extractAttributesFromIframe', () => {
	it( 'should extract url, width and height from iframe embed', () => {
		const iframeEmbed = '<iframe src="https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland" style="border: 0" width="800" height="600" frameborder="0" scrolling="no"></iframe>'
		expect( extractAttributesFromIframe( iframeEmbed ) ).toEqual( {
			url: 'https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland',
			height: '600',
			width: '800',
		} );
	} );
} );

describe( 'extractAttributesFromIframe', () => {
	it( 'should extract url, width and height from iframe embed regardless of attribute order', () => {
		const iframeEmbed = '<iframe  height="600" width="800" stuff="rubbish" src="https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland" ></iframe>'
		expect( extractAttributesFromIframe( iframeEmbed ) ).toEqual( {
			url: 'https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland',
			height: '600',
			width: '800',
		} );
	} );
} );

describe( 'extractAttributesFromIframe', () => {
	it( 'should return undefined if attributes not found in iframe code', () => {
		const iframeEmbed = '<iframe></iframe>'
		expect( extractAttributesFromIframe( iframeEmbed ) ).toBeUndefined();
	} );
} );
