import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyFilters } from '@wordpress/hooks';
import AiAssistantPluginSidebar from '..';
import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import { useSidebarOpenFromUrl } from '../open-sidebar-from-url';

const mockEditPost = jest.fn();
const mockRecordEvent = jest.fn();
let mockIsAgentNoticeDismissed = false;

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn(),
} ) );

jest.mock( '@wordpress/preferences', () => ( { store: 'core/preferences' } ) );

// The hook's own behaviour is covered in open-sidebar-from-url.test.ts. Here we
// only need to see what the sidebar asks of it.
jest.mock( '../open-sidebar-from-url', () => ( {
	useSidebarOpenFromUrl: jest.fn( () => false ),
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
			'core/preferences': {
				get: () => mockIsAgentNoticeDismissed,
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

// Importing this for real pulls @wordpress/components, and with it the rich-text
// store, which the @wordpress/data mock above cannot satisfy.
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: ( url: string ) => url,
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
	PluginPrePublishPanel: ( {
		children,
		initialOpen,
	}: {
		children: React.ReactNode;
		initialOpen?: boolean;
	} ) => (
		<div data-testid="pre-publish-panel" data-initial-open={ String( !! initialOpen ) }>
			{ children }
		</div>
	),
	PluginDocumentSettingPanel: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="document-panel">{ children }</div>
	),
	store: 'core/editor',
} ) );

jest.mock( '@wordpress/components', () => ( {
	Icon: () => <span data-testid="agent-icon" />,
	PanelBody: ( {
		children,
		title,
		initialOpen,
	}: {
		children: React.ReactNode;
		title: string;
		initialOpen?: boolean;
		onToggle?: ( isOpen: boolean ) => void;
		className?: string;
	} ) => (
		<div
			data-testid="panel-body"
			data-title={ title }
			data-initial-open={ String( !! initialOpen ) }
		>
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
		isPressed,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		variant?: string;
		isPressed?: boolean;
		icon?: React.ReactNode;
	} ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-variant={ variant }
			aria-pressed={ isPressed }
		>
			{ children }
		</button>
	),
	Notice: ( {
		children,
		actions = [],
	}: {
		children: React.ReactNode;
		actions?: Array< { label: string; onClick: () => void } >;
	} ) => (
		<div>
			{ children }
			{ actions.map( ( { label, onClick } ) => (
				<button key={ label } onClick={ onClick }>
					{ label }
				</button>
			) ) }
		</div>
	),
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Button: Object.assign(
		( { children, onClick }: { children: React.ReactNode; onClick?: () => void } ) => (
			<button onClick={ onClick }>{ children }</button>
		),
		{ Icon: () => <span data-testid="button-icon" /> }
	),
	Link: ( { children, href }: { children: React.ReactNode; href: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
		Actions: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		ActionButton: ( {
			children,
			onClick,
		}: {
			children: React.ReactNode;
			onClick?: () => void;
		} ) => <button onClick={ onClick }>{ children }</button>,
		ActionLink: ( { children, href }: { children: React.ReactNode; href: string } ) => (
			<a href={ href }>{ children }</a>
		),
		CloseIcon: ( { onClick }: { onClick?: () => void } ) => (
			<button onClick={ onClick }>Dismiss</button>
		),
	},
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
	getFeatureAvailability: jest.fn( () => false ),
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

const AGENT_NOTICE_FEATURE = 'ai-sidebar-agent-notice';
const AGENT_NOTICE_TEXT =
	'AI tools have moved to the WordPress Agent. Look for the "Ask AI" button at the top of the screen.';

describe( 'AiAssistantPluginSidebar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( applyFilters ).mockReturnValue( null );
		jest.mocked( getFeatureAvailability ).mockReturnValue( false );
		mockIsAgentNoticeDismissed = false;
		// The notice reads this to decide whether to offer its action, so stand in
		// for a loaded Agents Manager the way production has one.
		( window as unknown as { __agentsManagerActions?: unknown } ).__agentsManagerActions = {
			isReady: true,
			setChatOpen: jest.fn(),
		};
	} );

	afterEach( () => {
		delete ( window as unknown as { __agentsManagerActions?: unknown } ).__agentsManagerActions;
		delete ( window as unknown as { agentsManagerData?: unknown } ).agentsManagerData;
	} );

	describe( 'WordPress Agent notice', () => {
		beforeEach( () => {
			jest
				.mocked( getFeatureAvailability )
				.mockImplementation( feature => feature === AGENT_NOTICE_FEATURE );
			// The notice reads this to decide whether its action button has a
			// working agent to open, the way production's server payload does.
			( window as unknown as { agentsManagerData?: unknown } ).agentsManagerData = {
				jetpackAiSidebar: { agentNoticeActionAvailable: true },
			};
		} );

		it( 'shows the notice in the Jetpack sidebar, the document panel and the pre-publish panel', () => {
			render( <AiAssistantPluginSidebar /> );

			expect(
				within( screen.getByTestId( 'jetpack-sidebar' ) ).getByText( AGENT_NOTICE_TEXT )
			).toBeInTheDocument();
			expect(
				within( screen.getByTestId( 'document-panel' ) ).getByText( AGENT_NOTICE_TEXT )
			).toBeInTheDocument();
			expect(
				within( screen.getByTestId( 'pre-publish-panel' ) ).getByText( AGENT_NOTICE_TEXT )
			).toBeInTheDocument();
		} );

		it( 'takes the place of the AI tools rather than sitting beside them', () => {
			render( <AiAssistantPluginSidebar /> );

			expect( screen.queryByText( 'Get Feedback' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Generate using AI' } )
			).not.toBeInTheDocument();
			expect( screen.queryByText( 'Learn more about Jetpack AI' ) ).not.toBeInTheDocument();
		} );

		it( 'offers the action to open the Agent', () => {
			render( <AiAssistantPluginSidebar /> );

			expect(
				within( screen.getByTestId( 'document-panel' ) ).getByRole( 'button', {
					name: 'Open WordPress Agent',
				} )
			).toBeInTheDocument();
		} );

		it.each( [
			[ 'jetpack-sidebar', 'jetpack-sidebar' ],
			[ 'document-panel', 'document-settings' ],
			[ 'pre-publish-panel', 'pre-publish' ],
		] )( 'reports %s as placement %s', async ( testId, placement ) => {
			const user = userEvent.setup();
			render( <AiAssistantPluginSidebar /> );

			await user.click(
				within( screen.getByTestId( testId ) ).getByRole( 'button', {
					name: 'Open WordPress Agent',
				} )
			);

			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_big_sky_agent_notice_click',
				expect.objectContaining( { placement } )
			);
		} );

		it( 'still replaces the AI panel, without the action, on a site merely eligible for the Agent', () => {
			( window as unknown as { agentsManagerData?: unknown } ).agentsManagerData = {
				jetpackAiSidebar: { agentNoticeActionAvailable: false },
			};

			render( <AiAssistantPluginSidebar /> );

			expect(
				within( screen.getByTestId( 'document-panel' ) ).getByText(
					'AI tools have moved to the WordPress Agent.'
				)
			).toBeInTheDocument();
			expect( screen.queryByText( 'Get Feedback' ) ).not.toBeInTheDocument();
			expect(
				within( screen.getByTestId( 'document-panel' ) ).queryByRole( 'button', {
					name: 'Open WordPress Agent',
				} )
			).not.toBeInTheDocument();
		} );

		it( 'leaves the collapsed panels alone when there is no notice to show', () => {
			jest.mocked( getFeatureAvailability ).mockReturnValue( false );

			render( <AiAssistantPluginSidebar /> );

			expect( screen.getByTestId( 'panel-body' ) ).toHaveAttribute( 'data-initial-open', 'false' );
			expect( screen.getByTestId( 'pre-publish-panel' ) ).toHaveAttribute(
				'data-initial-open',
				'false'
			);
		} );

		it( 'opens the panels that are collapsed by default, so the notice is visible', () => {
			render( <AiAssistantPluginSidebar /> );

			expect( screen.getByTestId( 'panel-body' ) ).toHaveAttribute( 'data-initial-open', 'true' );
			expect( screen.getByTestId( 'pre-publish-panel' ) ).toHaveAttribute(
				'data-initial-open',
				'true'
			);
		} );

		it( 'renders nothing once the notice is dismissed', () => {
			mockIsAgentNoticeDismissed = true;

			render( <AiAssistantPluginSidebar /> );

			expect( screen.queryByTestId( 'jetpack-sidebar' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'document-panel' ) ).not.toBeInTheDocument();
			expect( screen.queryByTestId( 'pre-publish-panel' ) ).not.toBeInTheDocument();
		} );

		it( 'stops the "Try it out" link opening a sidebar it has emptied', () => {
			mockIsAgentNoticeDismissed = true;

			render( <AiAssistantPluginSidebar /> );

			expect( useSidebarOpenFromUrl ).toHaveBeenCalledWith( false );
		} );

		it( 'still lets the "Try it out" link open the sidebar while the notice is there', () => {
			render( <AiAssistantPluginSidebar /> );

			expect( useSidebarOpenFromUrl ).toHaveBeenCalledWith( true );
		} );

		it( 'keeps the AI tools when the notice is not available for the site', () => {
			jest.mocked( getFeatureAvailability ).mockReturnValue( false );

			render( <AiAssistantPluginSidebar /> );

			expect( screen.queryByText( AGENT_NOTICE_TEXT ) ).not.toBeInTheDocument();
			expect(
				within( screen.getByTestId( 'document-panel' ) ).getByText( 'Get Feedback' )
			).toBeInTheDocument();
		} );
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
