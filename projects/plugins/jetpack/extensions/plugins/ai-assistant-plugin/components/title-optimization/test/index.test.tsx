import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TitleOptimization from '..';

const mockRecordEvent = jest.fn();
const mockIncreaseAiAssistantRequestsCount = jest.fn();
const mockRequestJwt = jest.fn();
const mockFetch = jest.fn();

// Replace global fetch before any component code runs.
const originalFetch = global.fetch;
global.fetch = mockFetch;

jest.mock(
	'@automattic/jetpack-ai-client',
	() => ( {
		ERROR_CONTEXT_TOO_LARGE: 'error_context_too_large',
		ERROR_NETWORK: 'error_network',
		ERROR_QUOTA_EXCEEDED: 'error_quota_exceeded',
		ERROR_SERVICE_UNAVAILABLE: 'error_service_unavailable',
		ERROR_UNCLEAR_PROMPT: 'error_unclear_prompt',
		QuotaExceededMessage: () => <div>Quota exceeded</div>,
		usePostContent: () => ( {
			getPostContent: () => 'Example post content',
			isEditedPostEmpty: () => false,
		} ),
		AiAssistantModal: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		requestJwt: ( ...args: unknown[] ) => mockRequestJwt( ...args ),
	} ),
	{ virtual: true }
);

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: mockRecordEvent } } ),
	useAutosaveAndRedirect: () => ( { autosave: jest.fn() } ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: ( store: string ) => {
		if ( store === 'core/editor' ) {
			return { editPost: jest.fn() };
		}
		if ( store === 'wordpress-com/plans' ) {
			return { increaseAiAssistantRequestsCount: mockIncreaseAiAssistantRequestsCount };
		}
		return {};
	},
	useSelect: ( callback: ( select: ( store: string ) => unknown ) => unknown ) =>
		callback( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { getCurrentPostId: () => 77 };
			}
			return {};
		} ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( {
		children,
		onClick,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	} ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	Spinner: () => <div>Loading</div>,
	ExternalLink: ( { children, href }: { children: React.ReactNode; href: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Notice: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	TextareaControl: ( {
		label,
		help,
		value,
		onChange,
	}: {
		label: string;
		help: string;
		value: string;
		onChange: ( value: string ) => void;
	} ) => {
		const handleChange = ( event: React.ChangeEvent< HTMLTextAreaElement > ) => {
			onChange( event.target.value );
		};

		return (
			<div>
				<span>{ label }</span>
				<small>{ help }</small>
				<textarea aria-label={ label } value={ value } onChange={ handleChange } />
			</div>
		);
	},
	RadioControl: () => null,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( str: string ) => str,
} ) );

jest.mock( '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability', () => ( {
	getFeatureAvailability: () => false,
} ) );

jest.mock( '../style.scss', () => ( {} ) );
jest.mock( '../title-optimization-options.scss', () => ( {} ) );
jest.mock( '../title-optimization-keywords.scss', () => ( {} ) );

describe( 'TitleOptimization', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockRequestJwt.mockResolvedValue( { token: 'test-token', blogId: '123' } );
		mockFetch.mockResolvedValue( {
			ok: true,
			json: async () => ( {
				choices: [
					{
						message: {
							content: '[{"title":"Optimized Title","explanation":"Good clarity"}]',
						},
					},
				],
			} ),
		} as Response );
	} );

	afterAll( () => {
		global.fetch = originalFetch;
	} );

	it( 'sends orchestrator request with correct payload', async () => {
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( mockRequestJwt ).toHaveBeenCalled();
			expect( mockFetch ).toHaveBeenCalledWith(
				'https://public-api.wordpress.com/wpcom/v2/ai/agent',
				expect.objectContaining( {
					method: 'POST',
					headers: expect.objectContaining( {
						Authorization: 'Bearer test-token',
						'Content-Type': 'application/json',
					} ),
				} )
			);
		} );

		// Verify the request body
		const callArgs = mockFetch.mock.calls[ 0 ];
		const body = JSON.parse( callArgs[ 1 ].body as string );
		expect( body ).toMatchObject( {
			agent_id: 'wp-orchestrator',
			ability: 'wpcom/optimize-title',
			feature: 'jetpack-ai-title-optimization',
			stream: false,
			site_id: 123,
			input: {
				messages: [
					{
						role: 'jetpack-ai',
						context: {
							type: 'title-optimization',
							content: 'Example post content',
							keywords: '',
						},
					},
				],
				post_id: 77,
			},
		} );
	} );

	it( 'displays title options after successful response', async () => {
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Optimized Title' ) ).toBeInTheDocument();
		} );

		expect( mockIncreaseAiAssistantRequestsCount ).toHaveBeenCalled();
	} );

	it( 'handles API error responses', async () => {
		mockFetch.mockResolvedValue( {
			ok: false,
			status: 503,
		} as Response );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'The generation of your suggested titles failed. Please try again.' )
			).toBeInTheDocument();
		} );
	} );

	it( 'handles quota exceeded error', async () => {
		mockFetch.mockResolvedValue( {
			ok: false,
			status: 429,
		} as Response );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Quota exceeded' ) ).toBeInTheDocument();
		} );
	} );

	it( 'tracks analytics events on generate', async () => {
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_ai_title_optimization_generate',
				expect.objectContaining( {
					placement: 'sidebar',
					has_keywords: false,
					is_retry: false,
				} )
			);
		} );
	} );

	it( 'handles network errors gracefully', async () => {
		mockFetch.mockRejectedValue( new Error( 'Network failure' ) );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'The generation of your suggested titles failed. Please try again.' )
			).toBeInTheDocument();
		} );
	} );
} );
