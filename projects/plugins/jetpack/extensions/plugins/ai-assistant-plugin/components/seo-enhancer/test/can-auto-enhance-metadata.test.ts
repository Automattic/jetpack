import { isSimpleSite } from '@automattic/jetpack-script-data';
import { canAutoEnhanceMetadata } from '../can-auto-enhance-metadata';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn(),
} ) );

const setSeoState = ( isEnabled: boolean ) => {
	window.Jetpack_Editor_Initial_State = {
		'ai-assistant': { 'is-seo-enabled': isEnabled },
	} as unknown as Window[ 'Jetpack_Editor_Initial_State' ];
};

describe( 'canAutoEnhanceMetadata', () => {
	afterEach( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'is false on Simple sites regardless of the SEO feature', () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( true );
		setSeoState( true );

		expect( canAutoEnhanceMetadata() ).toBe( false );
	} );

	it( 'is false when the SEO feature is effectively off', () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( false );
		setSeoState( false );

		expect( canAutoEnhanceMetadata() ).toBe( false );
	} );

	it( 'is true off-Simple when the SEO feature is on', () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( false );
		setSeoState( true );

		expect( canAutoEnhanceMetadata() ).toBe( true );
	} );

	it( 'treats a missing state as enabled', () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( false );

		expect( canAutoEnhanceMetadata() ).toBe( true );
	} );
} );
