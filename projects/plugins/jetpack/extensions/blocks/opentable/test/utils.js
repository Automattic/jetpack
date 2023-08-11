import { getAttributesFromEmbedCode } from '../utils';

const widgetEmbedCode =
	"<script type='text/javascript' src='//www.opentable.com/widget/reservation/loader?rid=1&type=standard&theme=standard&iframe=true&domain=com&lang=en-US&newtab=false&ot_source=Restaurant%20website'></script>";

const invalidEmbedCode =
	"<script type='text/javascript' src='https://www.widgets-r-us.com/widget/widgetygoddness?rid=1&type=standard&theme=standard&iframe=true&domain=com&lang=en-US&newtab=false&ot_source=Restaurant%20website'></script>";

const marketingUrl =
	'https://www.opentable.com/vongs-thai-kitchen-reservations-chicago?restref=1&lang=en-US&ot_source=Restaurant%20website';

const customUrl1 =
	'https://www.opentable.com/restref/client/?restref=412810&lang=en-US&ot_source=Restaurant%20website&corrid=e413926b-0352-46d6-a8d8-d1d525932310';

const customUrl2 =
	'https://www.opentable.com/restref/client/?restref=1&lang=es-MX&ot_source=Restaurant%20website&corrid=09f44cc6-f0cb-4e98-9298-f4ba8cc20183';

const customUrl3 =
	'https://www.opentable.com/restref/client/?rid=1&corrid=010a3136-569e-42a5-a381-e111887b4cf5';

const invalidUrl =
	'https://www.widgets-r-us.com/widget/widgetygoddness?rid=1&type=standard&theme=standard&iframe=true&domain=com&lang=en-US&newtab=false&ot_source=Restaurant%20website';

describe( 'getAttributesFromEmbedCode', () => {
	test( 'Widget embed code', () => {
		expect( getAttributesFromEmbedCode( widgetEmbedCode ) ).toEqual( {
			domain: 'com',
			iframe: 'true',
			lang: 'en-US',
			newtab: 'false',
			rid: [ '1' ],
			style: 'standard',
		} );
	} );

	test( 'Marketing URL', () => {
		expect( getAttributesFromEmbedCode( marketingUrl ) ).toEqual( {
			lang: 'en-US',
			rid: [ '1' ],
		} );
	} );

	test( 'Custom URL 1', () => {
		expect( getAttributesFromEmbedCode( customUrl1 ) ).toEqual( {
			lang: 'en-US',
			rid: [ '412810' ],
		} );
	} );

	test( 'Custom URL 2', () => {
		expect( getAttributesFromEmbedCode( customUrl2 ) ).toEqual( {
			lang: 'es-MX',
			rid: [ '1' ],
		} );
	} );

	test( 'Custom URL 3', () => {
		expect( getAttributesFromEmbedCode( customUrl3 ) ).toEqual( {
			rid: [ '1' ],
		} );
	} );

	test( 'Invaild Embed Code', () => {
		expect( getAttributesFromEmbedCode( invalidEmbedCode ) ).toBeUndefined();
	} );

	test( 'Invaild URL', () => {
		expect( getAttributesFromEmbedCode( invalidUrl ) ).toBeUndefined();
	} );
} );
