const fs = require( 'fs' );
const https = require( 'https' );
const path = require( 'path' );

[
	'ar',
	'de-ch',
	'de',
	'de_formal',
	'el-po',
	'es-cl',
	'es-mx',
	'es',
	'fr-be',
	'fr-ca',
	'fr-ch',
	'fr',
	'he',
	'id',
	'it',
	'ja',
	'ko',
	'nl',
	'pt-br',
	'ro',
	'ru',
	'sv',
	'tr',
	'zh-cn',
	'zh-sg',
	'zh-tw',
].forEach( lang => {
	const url = `https://widgets.wp.com/help-center/languages/${ lang }-v1.1.json`;
	const dir = path.resolve( 'src', 'features', 'help-center', 'languages' );
	const dest = path.resolve( dir, `${ lang }-help-center.json` );

	fs.mkdirSync( dir, { recursive: true } );

	https.get( url, response => {
		let data = '';

		response.on( 'data', chunk => {
			data += chunk;
		} );

		response
			.on( 'end', () => {
				const dataParsed = JSON.parse( data );
				dataParsed[ '' ][ 'plural-forms' ] = dataParsed[ '' ].plural_forms;
				dataParsed[ '' ].lang = dataParsed[ '' ].language;

				const date = new Date( response.headers[ 'last-modified' ] );

				const JED = {
					'translation-revision-date': date.toISOString(),
					generator: 'Jetpack',
					domain: 'jetpack-mu-wpcom',
					locale_data: {
						messages: dataParsed,
					},
				};

				fs.writeFileSync( dest, JSON.stringify( JED ) );
			} )
			.on( 'error', error => {
				// eslint-disable-next-line no-console
				console.error( `Downloading Help Center languages (${ lang }) failed with error:`, error );
			} );
	} );
} );
