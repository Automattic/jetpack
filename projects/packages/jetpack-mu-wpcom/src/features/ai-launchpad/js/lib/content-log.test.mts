import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildLogstashParams } from './content-log.ts';

describe( 'buildLogstashParams', () => {
	it( 'encodes the logstash record with a JSON-string extra, matching the server dispatch shape', () => {
		const params = JSON.parse(
			buildLogstashParams( 'content_tailored', { page_id: 7, picked_score: 1 }, 123 )
		);
		assert.equal( params.blog_id, 123 );
		assert.equal( params.feature, 'atomic_ai_launchpad' );
		assert.equal( params.message, 'content_tailored' );
		// `extra` must be a JSON string, not a nested object — log2logstash wp_json_encode()s it too.
		assert.equal( typeof params.extra, 'string' );
		assert.deepEqual( JSON.parse( params.extra ), { page_id: 7, picked_score: 1 } );
	} );
} );
