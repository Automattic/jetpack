import debugFactory from 'debug';

const debug = debugFactory( 'jetpack:ai-assistant' );

export async function askJetpack( question ) {
	let fullMessage;
	let source;
	try {
		source = await askQuestion( question );
	} catch ( err ) {
		debug( 'Error', err );
		return source;
	}
	source.addEventListener( 'error', err => {
		debug( 'Error', err );
	} );

	source.addEventListener( 'message', e => {
		if ( e.data === '[DONE]' ) {
			source.close();
			debug( 'Done. Full message: ' + fullMessage );
			return;
		}

		const data = JSON.parse( e.data );
		const chunk = data.choices[ 0 ].delta.content;
		if ( chunk ) {
			fullMessage += chunk;
			debug( chunk );
		}
	} );
	return source;
}

/**
 * Leaving this here to make it easier to debug the streaming API calls for now
 *
 * @param {string} question - The query to send to the API
 */
export async function askQuestion( question ) {
	const { blogId, token } = await requestToken();

	const url = new URL(
		'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/jetpack-openai-query'
	);
	url.searchParams.append( 'question', question );
	url.searchParams.append( 'token', token );

	const source = new EventSource( url.toString() );
	return source;
}

export async function requestToken() {
	const apiNonce = window.JP_CONNECTION_INITIAL_STATE.apiNonce;

	const request = await fetch( '/wp-json/jetpack/v4/jetpack-ai-jwt?_cacheBuster=' + Date.now(), {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': apiNonce,
		},
	} );

	if ( ! request.ok ) {
		throw new Error( 'JWT request failed' );
	}

	const data = await request.json();
	return {
		token: data.token,
		blogId: data.blog_id,
	};
}
