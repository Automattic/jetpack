import { provideJetpackConfig } from '../jetpack-config';

type WithJetpackConfig = typeof globalThis & { jetpackConfig?: object };

describe( 'provideJetpackConfig', () => {
	afterEach( () => {
		delete ( globalThis as WithJetpackConfig ).jetpackConfig;
	} );

	it( 'exposes the My Jetpack consumer slug as the jetpackConfig global', () => {
		provideJetpackConfig();

		expect( ( globalThis as WithJetpackConfig ).jetpackConfig ).toEqual( {
			consumer_slug: 'my_jetpack',
		} );
	} );
} );
