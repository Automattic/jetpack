import { render, screen } from '@testing-library/react';
import { SeoEnhancer } from '../seo-enhancer';

let mockIsEnabled = false;

jest.mock( '../store', () => ( {
	store: 'jetpack/seo-enhancer-test-store',
} ) );

jest.mock( '../use-seo-module-settings', () => ( {
	useSeoModuleSettings: () => ( {
		isEnabled: mockIsEnabled,
		toggleEnhancer: jest.fn(),
		isToggling: false,
	} ),
} ) );

jest.mock( '../use-seo-requests', () => ( {
	useSeoRequests: () => ( {
		updateSeoData: jest.fn(),
		isBusy: false,
	} ),
} ) );

jest.mock( '../seo-enhancer-task-list', () => ( {
	SeoEnhancerTaskList: () => null,
} ) );

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	getAllBlocks: () => [],
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => {
	const analytics = { tracks: { recordEvent: jest.fn() } };
	return { useAnalytics: () => analytics };
} );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const stores: Record< string, unknown > = {
		'jetpack/seo-enhancer-test-store': {
			isBusy: () => false,
			isAnyImageBusy: () => false,
			getEnabledFeatures: () => [],
		},
		'core/block-editor': {
			getBlocks: () => [],
		},
	};
	const mocks = {
		useSelect: ( selector: ( select: ( store: string ) => unknown ) => unknown ) =>
			selector( ( store: string ) => stores[ store ] ),
		useDispatch: () => ( { setFeatureEnabled: jest.fn() } ),
	};
	// Keep the real registry so @wordpress/components' own stores still work.
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

describe( 'SeoEnhancer', () => {
	it( 'hides the auto-generate toggle where automatic generation cannot run', () => {
		mockIsEnabled = true;

		render( <SeoEnhancer disableAutoEnhance={ true } /> );

		expect( screen.queryByLabelText( 'Auto-generate metadata' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the manual button while automatic generation is switched off', () => {
		mockIsEnabled = false;

		render( <SeoEnhancer disableAutoEnhance={ false } /> );

		expect( screen.getByRole( 'button', { name: 'Generate metadata' } ) ).toBeInTheDocument();
	} );

	it( 'hides the manual button while automatic mode is available and on', () => {
		mockIsEnabled = true;

		render( <SeoEnhancer disableAutoEnhance={ false } /> );

		expect( screen.queryByRole( 'button', { name: 'Generate metadata' } ) ).not.toBeInTheDocument();
	} );
} );
