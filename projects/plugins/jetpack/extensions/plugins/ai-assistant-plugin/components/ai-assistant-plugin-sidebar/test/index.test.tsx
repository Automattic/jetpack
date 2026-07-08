import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyFilters } from '@wordpress/hooks';
import AiAssistantPluginSidebar from '..';

const mockEditPost = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn(),
} ) );

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

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: mockRecordEvent } } ),
	PLAN_TYPE_FREE: 'free',
	PLAN_TYPE_UNLIMITED: 'unlimited',
	usePlanType: () => 'free',
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	JetpackEditorPanelLogo: () => <span>Logo</span>,
} ) );

jest.mock( '@wordpress/editor', () => ( {
	PluginPrePublishPanel: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="pre-publish-panel">{ children }</div>
	),
	PluginDocumentSettingPanel: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="document-panel">{ children }</div>
	),
	store: 'core/editor',
} ) );

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
	Notice: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Link: ( { children, href }: { children: React.ReactNode; href: string } ) => (
		<a href={ href }>{ children }</a>
	),
} ) );

jest.mock( '@wordpress/core-data', () => {
	// Runs before imports due to jest.mock hoisting; the component reads this at module scope
	Object.defineProperty( globalThis, 'Jetpack_Editor_Initial_State', {
		value: {
			available_blocks: {
				'ai-assistant-usage-panel': { available: false },
				'ai-featured-image-generator': { available: true },
				'ai-title-optimization': { available: false },
				'ai-title-optimization-keywords-support': { available: false },
			},
		},
		writable: true,
		configurable: true,
	} );
	return { store: 'core' };
} );

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

describe( 'AiAssistantPluginSidebar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( applyFilters ).mockReturnValue( null );
	} );

	describe( 'imageGenerationHandler filter', () => {
		it( 'should call applyFilters with correct arguments for featured-image entry point', () => {
			render( <AiAssistantPluginSidebar /> );

			expect( applyFilters ).toHaveBeenCalledWith(
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
			jest.mocked( applyFilters ).mockReturnValue( mockHandler );

			render( <AiAssistantPluginSidebar /> );

			expect( screen.getAllByRole( 'button', { name: 'Generate image' } ).length ).toBeGreaterThan(
				0
			);
		} );

		it( 'should call custom handler when clicking "Generate image" button', async () => {
			const user = userEvent.setup();
			const mockHandler = jest.fn();
			jest.mocked( applyFilters ).mockReturnValue( mockHandler );

			render( <AiAssistantPluginSidebar /> );

			const documentPanel = screen.getByTestId( 'document-panel' );
			const generateButton = within( documentPanel ).getByRole( 'button', {
				name: 'Generate image',
			} );
			await user.click( generateButton );

			expect( mockHandler ).toHaveBeenCalled();
		} );

		it( 'should render FeaturedImage component when filter returns null and isAIFeaturedImageAvailable is true', () => {
			jest.mocked( applyFilters ).mockReturnValue( null );

			render( <AiAssistantPluginSidebar /> );

			const documentPanel = screen.getByTestId( 'document-panel' );
			expect(
				within( documentPanel ).getByRole( 'button', { name: 'Generate using AI' } )
			).toBeInTheDocument();
			expect(
				within( documentPanel ).queryByRole( 'button', { name: 'Generate image' } )
			).not.toBeInTheDocument();
		} );

		it( 'should call editPost with featured_media when onImageSelect is called', () => {
			let capturedOnImageSelect:
				| ( ( image: { id: number; url: string; mime?: string } ) => void )
				| null = null;

			( applyFilters as jest.Mock ).mockImplementation(
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

			expect( capturedOnImageSelect ).not.toBeNull();
			capturedOnImageSelect!( {
				id: 123,
				url: 'https://example.com/generated-image.png',
				mime: 'image/png',
			} );

			expect( mockEditPost ).toHaveBeenCalledWith( { featured_media: 123 } );
		} );
	} );
} );
