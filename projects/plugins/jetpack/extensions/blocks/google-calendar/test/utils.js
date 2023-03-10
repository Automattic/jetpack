import { convertShareableUrl, extractAttributesFromIframe, parseEmbed } from '../utils';

const shareableUrl = 'https://calendar.google.com/calendar?cid=Z2xlbi5kYXZpZXNAYThjLmNvbQ';
const shareableData = {
	url: 'https://calendar.google.com/calendar/embed?src=glen.davies%40a8c.com',
};

const iframeEmbed =
	'<iframe src="https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland" style="border: 0" width="800" height="600" frameborder="0" scrolling="no"></iframe>';
const iframeData = {
	url: 'https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland',
	height: '600',
	width: '800',
};

describe( 'extractAttributesFromIframe', () => {
	it( 'should extract url, width and height from iframe embed', () => {
		expect( extractAttributesFromIframe( iframeEmbed ) ).toEqual( iframeData );
	} );

	it( 'should extract url, width and height from iframe embed regardless of attribute order', () => {
		const reorderedEmbed =
			'<iframe  height="600" width="800" stuff="rubbish" src="https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland" ></iframe>';
		expect( extractAttributesFromIframe( reorderedEmbed ) ).toEqual( iframeData );
	} );

	it( 'should return undefined if attributes not found in iframe code', () => {
		expect( extractAttributesFromIframe( '<iframe></iframe>' ) ).toBeUndefined();
	} );
} );

describe( 'convertShareableUrl', () => {
	it( 'should return undefined when url does not match shareable link regex', () => {
		expect( convertShareableUrl( 'http://invalid-url' ) ).toBeUndefined();
	} );

	it( 'should return converted calendar embed url', () => {
		expect( convertShareableUrl( shareableUrl ) ).toEqual( shareableData.url );
	} );
} );

describe( 'parseEmbed', () => {
	it( 'should return url, width and height when given iframe embed', () => {
		expect( parseEmbed( iframeEmbed ) ).toEqual( iframeData );
	} );

	it( 'should return embed url when given shareable link', () => {
		expect( parseEmbed( shareableUrl ) ).toEqual( shareableData );
	} );

	it( 'should return supplied string as url if not iframe or shareable link', () => {
		const url = 'http://calendar.google.com/';
		expect( parseEmbed( url ) ).toEqual( { url } );
	} );
} );
