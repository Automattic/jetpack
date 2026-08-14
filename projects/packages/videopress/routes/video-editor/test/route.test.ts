import { route } from '../route';

// The route module is wp-build's per-route configuration contract: the build
// discovers routes/*/route.tsx and mounts the sibling stage.tsx with these
// options. There is no behavior to exercise — this exists to pin that the
// module keeps exporting an options object (intentionally empty today), since
// removing or reshaping the export would silently unregister the route.
describe( 'video-editor route', () => {
	it( 'exports an empty route options object', () => {
		expect( route ).toEqual( {} );
	} );
} );
