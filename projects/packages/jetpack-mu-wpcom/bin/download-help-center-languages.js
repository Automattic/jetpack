const https = require( 'https' );

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
	const dest = require( 'path' ).resolve(
		'src',
		'features',
		'help-center',
		'languages',
		`${ lang }-help-center.json`
	);

	https.get( url, response => {
		let data = '';

		response.on( 'data', chunk => {
			data += chunk;
		} );

		response.on( 'end', () => {
			const dataParsed = JSON.parse( data );
			dataParsed[ '' ][ 'plural-forms' ] = dataParsed[ '' ].plural_forms;
			dataParsed[ '' ].lang = dataParsed[ '' ].language;

			const JED = {
				'translation-revision-date': new Date().toISOString(),
				generator: 'Jetpack',
				domain: 'jetpack-mu-wpcom',
				locale_data: {
					messages: dataParsed,
				},
			};

			require( 'fs' ).writeFileSync( dest, JSON.stringify( JED ) );
		} );
	} );
} );
