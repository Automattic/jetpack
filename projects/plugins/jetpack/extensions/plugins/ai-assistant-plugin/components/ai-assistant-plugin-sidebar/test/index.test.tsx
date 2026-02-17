/* eslint-disable import/order */
// Component import must come after jest.mock() calls to ensure mocks are applied
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock functions
const mockApplyFilters = jest.fn();
const mockEditPost = jest.fn();
const mockRecordEvent = jest.fn();

// Set up window.Jetpack_Editor_Initial_State before importing the component
Object.defineProperty( window, 'Jetpack_Editor_Initial_State', {
	value: {
		available_blocks: {
			'ai-assistant-usage-panel': { available: false },
			'ai-featured-image-generator': { available: true },
			'ai-title-optimization': { available: false },
			'ai-title-optimization-keywords-support': { available: false },
		},
	},
	writable: true,
} );

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: ( ...args: unknown[] ) => mockApplyFilters( ...args ),
} ) );

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: ( store: string ) => unknown ) => unknown ) => {
		const stores: Record< string, unknown > = {
			'core/editor': {
				getCurrentPostType: () => 'post',
				isEditedPostEmpty: () => false,
			},
			core: {
				getPostType: () => ( { viewable: true } ),
			},
		};
		return selector( ( store: string ) => stores[ store ] );
	},
	useDispatch: ( store: string ) => {
		if ( store === 'core/editor' ) {
			return { editPost: mockEditPost };
		}
		return {};
	},
} ) );

// Mock @automattic/jetpack-ai-client
jest.mock( '@automattic/jetpack-ai-client', () => ( {
	useAICheckout: () => ( { checkoutUrl: 'https://checkout.example.com' } ),
	useAiFeature: () => ( {
		requireUpgrade: false,
		upgradeType: 'default',
		currentTier: { value: 1 },
		isOverLimit: false,
	} ),
	FairUsageNotice: () => null,
	FeaturedImage: () => <button>Generate using AI</button>,
} ) );

// Mock @automattic/jetpack-shared-extension-utils
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: mockRecordEvent } } ),
	PLAN_TYPE_FREE: 'free',
	PLAN_TYPE_UNLIMITED: 'unlimited',
	usePlanType: () => 'free',
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	JetpackEditorPanelLogo: () => <span>Logo</span>,
} ) );

// Mock @wordpress/editor
jest.mock( '@wordpress/editor', () => ( {
	PluginPrePublishPanel: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="pre-publish-panel">{ children }</div>
	),
	PluginDocumentSettingPanel: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="document-panel">{ children }</div>
	),
	store: 'core/editor',
} ) );

// Mock @wordpress/components
jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( {
		children,
		title,
	}: {
		children: React.ReactNode;
		title: string;
		initialOpen?: boolean;
		onToggle?: ( isOpen: boolean ) => void;
		className?: string;
	} ) => (
		<div data-testid="panel-body" data-title={ title }>
			{ children }
		</div>
	),
	PanelRow: ( { children, className }: { children: React.ReactNode; className?: string } ) => (
		<div data-testid="panel-row" className={ className }>
			{ children }
		</div>
	),
	BaseControl: Object.assign(
		( {
			children,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			__nextHasNoMarginBottom,
		}: {
			children: React.ReactNode;
			__nextHasNoMarginBottom?: boolean;
		} ) => <div data-testid="base-control">{ children }</div>,
		{
			VisualLabel: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
		}
	),
	Button: ( {
		children,
		onClick,
		disabled,
		variant,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		variant?: string;
	} ) => (
		<button onClick={ onClick } disabled={ disabled } data-variant={ variant }>
			{ children }
		</button>
	),
	ExternalLink: ( { children, href }: { children: React.ReactNode; href: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Notice: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

// Mock @wordpress/core-data
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

// Mock internal dependencies
jest.mock( '../../../../../blocks/ai-assistant/hooks/use-ai-product-page', () => () => ( {
	productPageUrl: 'https://product.example.com',
} ) );

jest.mock( '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability', () => ( {
	getFeatureAvailability: () => false,
} ) );

jest.mock( '../../../../../shared/jetpack-plugin-sidebar', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="jetpack-sidebar">{ children }</div>
	),
} ) );

jest.mock( '../../breve', () => ( {
	Breve: () => null,
	registerBreveHighlights: jest.fn(),
	Highlight: () => null,
} ) );

jest.mock( '../../breve/utils/get-availability', () => ( {
	getBreveAvailability: () => false,
	canWriteBriefBeEnabled: () => false,
} ) );

jest.mock( '../../feedback', () => ( { __esModule: true, default: () => null } ) );
jest.mock( '../../title-optimization', () => ( { __esModule: true, default: () => null } ) );
jest.mock( '../../usage-panel', () => ( { __esModule: true, default: () => null } ) );
jest.mock( '../upgrade', () => ( { __esModule: true, default: () => null } ) );
jest.mock( '../style.scss', () => ( {} ) );

// Import the component after all mocks are set up
import AiAssistantPluginSidebar from '..';

describe( 'AiAssistantPluginSidebar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApplyFilters.mockReturnValue( null );
	} );

	describe( 'imageGenerationHandler filter', () => {
		it( 'should call applyFilters with correct arguments for featured-image entry point', () => {
			render( <AiAssistantPluginSidebar /> );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'jetpack.ai.imageGenerationHandler',
				null,
				expect.objectContaining( {
					entryPoint: 'featured-image',
					onImageSelect: expect.any( Function ),
					extra: expect.objectContaining( {
						placement: expect.any( String ),
						disabled: false,
					} ),
				} )
			);
		} );

		it( 'should render custom "Generate image" button when filter provides a handler', () => {
			const mockHandler = jest.fn();
			mockApplyFilters.mockReturnValue( mockHandler );

			render( <AiAssistantPluginSidebar /> );

			// Should show the "Generate image" button from the filter handler
			expect( screen.getAllByRole( 'button', { name: 'Generate image' } ).length ).toBeGreaterThan(
				0
			);
		} );

		it( 'should call custom handler when clicking "Generate image" button', async () => {
			const user = userEvent.setup();
			const mockHandler = jest.fn();
			mockApplyFilters.mockReturnValue( mockHandler );

			render( <AiAssistantPluginSidebar /> );

			// Click the first "Generate image" button (from document panel)
			const generateButtons = screen.getAllByRole( 'button', { name: 'Generate image' } );
			await user.click( generateButtons[ 0 ] );

			expect( mockHandler ).toHaveBeenCalled();
		} );

		it( 'should call editPost with featured_media when onImageSelect is called', () => {
			let capturedOnImageSelect:
				| ( ( image: { id: number; url: string; mime?: string } ) => void )
				| null = null;

			mockApplyFilters.mockImplementation(
				(
					filterName: string,
					defaultValue: unknown,
					args: { onImageSelect: ( image: { id: number; url: string; mime?: string } ) => void }
				) => {
					if ( filterName === 'jetpack.ai.imageGenerationHandler' ) {
						capturedOnImageSelect = args.onImageSelect;
					}
					return null;
				}
			);

			render( <AiAssistantPluginSidebar /> );

			// Simulate external handler calling onImageSelect
			if ( capturedOnImageSelect ) {
				capturedOnImageSelect( {
					id: 123,
					url: 'https://example.com/generated-image.png',
					mime: 'image/png',
				} );
			}

			expect( mockEditPost ).toHaveBeenCalledWith( { featured_media: 123 } );
		} );

		it( 'should show Generate image button when filter provides handler', () => {
			// When imageGenerationHandler is provided via filter, the component shows
			// the custom "Generate image" button instead of the default FeaturedImage component.
			// This test verifies the condition (imageGenerationHandler || isAIFeaturedImageAvailable)
			// works correctly when imageGenerationHandler is truthy.
			const mockHandler = jest.fn();
			mockApplyFilters.mockReturnValue( mockHandler );

			render( <AiAssistantPluginSidebar /> );

			// With the handler provided, the "Generate image" button should be visible
			expect( screen.getAllByRole( 'button', { name: 'Generate image' } ).length ).toBeGreaterThan(
				0
			);
		} );
	} );
} );
