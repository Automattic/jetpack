import { render } from '@testing-library/react';
import { blockWithSeoAutoGenerationExtension } from '../with-seo-auto-generation';

let mockIsAutoEnhanceEnabled = true;
const mockUpdateAltText = jest.fn();

jest.mock( '../can-auto-enhance-metadata', () => ( {
	canAutoEnhanceMetadata: () => true,
} ) );

jest.mock( '../store', () => ( {
	store: 'jetpack/seo-enhancer-test-store',
} ) );

jest.mock( '../use-seo-module-settings', () => ( {
	useSeoModuleSettings: () => ( { isEnabled: mockIsAutoEnhanceEnabled } ),
} ) );

jest.mock( '../use-seo-requests', () => ( {
	useSeoRequests: () => ( { updateAltText: mockUpdateAltText } ),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getJetpackExtensionAvailability: () => ( { available: true } ),
	useModuleStatus: () => ( { isModuleActive: true } ),
} ) );

jest.mock( '@wordpress/data', () => {
	const stores: Record< string, unknown > = {
		'core/block-editor': { getBlock: ( clientId: string ) => ( { clientId } ) },
		// The "Image alt text" box, unticked earlier in manual mode.
		'jetpack/seo-enhancer-test-store': { isImageAltTextFeatureEnabled: () => false },
	};
	const mocks = {
		useSelect: ( selector: ( select: ( store: string ) => unknown ) => unknown ) =>
			selector( ( store: string ) => stores[ store ] ),
	};
	return new Proxy( jest.requireActual( '@wordpress/data' ), {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

describe( 'blockWithSeoAutoGenerationExtension', () => {
	beforeEach( () => {
		mockUpdateAltText.mockClear();
	} );

	it.each( [
		[ 'generates alt text in auto mode', true, 1 ],
		[ 'leaves alt text alone outside auto mode', false, 0 ],
	] )( '%s when an image is inserted', ( _label, isAutoEnhanceEnabled, calls ) => {
		mockIsAutoEnhanceEnabled = isAutoEnhanceEnabled;
		const { edit: Edit } = blockWithSeoAutoGenerationExtension(
			{ edit: () => null },
			'core/image'
		);

		const { rerender } = render( <Edit clientId="image-1" attributes={ { alt: '' } } /> );
		rerender(
			<Edit clientId="image-1" attributes={ { url: 'https://example.com/a.jpg', alt: '' } } />
		);

		expect( mockUpdateAltText ).toHaveBeenCalledTimes( calls );
	} );
} );
