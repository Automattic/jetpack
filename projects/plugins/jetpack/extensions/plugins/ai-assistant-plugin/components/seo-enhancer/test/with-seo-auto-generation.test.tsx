import { render } from '@testing-library/react';

let mockIsAutoEnhanceEnabled = true;
const mockUpdateAltText = jest.fn();

jest.mock( '../can-auto-enhance-metadata', () => ( {
	canAutoEnhanceMetadata: () => true,
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
	const actual = jest.requireActual( '@wordpress/data' );
	const blockEditor = { getBlock: ( clientId: string ) => ( { clientId } ) };
	const mocks = {
		useSelect: ( selector: ( select: ( store: unknown ) => unknown ) => unknown ) =>
			selector( store => ( store === 'core/block-editor' ? blockEditor : actual.select( store ) ) ),
	};
	return new Proxy( actual, {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

describe( 'blockWithSeoAutoGenerationExtension', () => {
	beforeAll( () => {
		// The manual-mode "Image alt text" box, unticked earlier in this browser.
		localStorage.setItem(
			'jetpack-seo-enhancer-features',
			JSON.stringify( { 'images-alt-text': false } )
		);
	} );

	beforeEach( () => {
		mockUpdateAltText.mockClear();
	} );

	afterAll( () => {
		localStorage.clear();
	} );

	it.each( [
		[ 'generates alt text in auto mode', true, 1 ],
		[ 'leaves alt text alone outside auto mode', false, 0 ],
	] )( '%s when an image is inserted', async ( _label, isAutoEnhanceEnabled, calls ) => {
		mockIsAutoEnhanceEnabled = isAutoEnhanceEnabled;
		const { blockWithSeoAutoGenerationExtension } = await import( '../with-seo-auto-generation' );
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
