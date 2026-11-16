import { postAdapter } from './post';
import { videoAdapter } from './video';
import { getSingleReportAdapter } from '.';

describe( 'getSingleReportAdapter', () => {
	it.each( [
		[ 'the adapter of its path', { path: 'video', entity: null }, videoAdapter ],
		[
			'the post adapter for a post type page without its own',
			{ path: 'page', entity: { kind: 'postType', name: 'page' } },
			postAdapter,
		],
		[
			'its own adapter before the post one',
			{ path: 'video', entity: { kind: 'postType', name: 'attachment' } },
			videoAdapter,
		],
		[
			'none for another kind of entity',
			{ path: 'member', entity: { kind: 'root', name: 'user' } },
			undefined,
		],
		[ 'none without an entity', { path: 'recap', entity: null }, undefined ],
	] )( 'returns %s', ( _name, page, adapter ) => {
		expect( getSingleReportAdapter( page ) ).toBe( adapter );
	} );
} );
