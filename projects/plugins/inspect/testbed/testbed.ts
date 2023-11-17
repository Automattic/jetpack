/**
 *
 * deno run --allow-net testbed.ts
 *
 */

// eslint-disable-next-line
import { serve } from 'https://deno.land/std@0.147.0/http/server.ts';

const handler = ( request: Request ) => {
	// Give the user back all of the request data as JSON:

	const body = JSON.stringify(
		{
			note: 'The server received the following:',
			method: request.method,
			url: request.url,
			headers: Object.fromEntries( request.headers ),
			body: request.body,
			params: Object.fromEntries( new URL( request.url ).searchParams.entries() ),
		},
		null,
		4
	);

	// eslint-disable-next-line
	console.log( 'Received a request', body );
	return new Response( body, {
		headers: new Headers( {
			'Content-Type': 'application/json',
		} ),
	} );
};

serve( handler, { port: 3001 } );
