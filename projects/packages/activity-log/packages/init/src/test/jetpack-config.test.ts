import { provideJetpackConfig } from '../jetpack-config';

type WithJetpackConfig = typeof globalThis & { jetpackConfig?: object };

afterEach( () => {
	delete ( globalThis as WithJetpackConfig ).jetpackConfig;
} );

it( 'replaces a host page jetpackConfig with the Activity Log consumer slug', () => {
	( globalThis as WithJetpackConfig ).jetpackConfig = { consumer_slug: 'my_jetpack' };

	provideJetpackConfig();

	expect( ( globalThis as WithJetpackConfig ).jetpackConfig ).toEqual( {
		consumer_slug: 'jetpack-activity-log',
	} );
} );
