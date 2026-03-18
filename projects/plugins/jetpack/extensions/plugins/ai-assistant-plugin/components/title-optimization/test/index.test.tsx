import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TitleOptimization from '..';

const mockRecordEvent = jest.fn();
const mockIncreaseAiAssistantRequestsCount = jest.fn();
const mockSendMessage = jest.fn();

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
	} ),
	{ virtual: true }
);

jest.mock(
	'@automattic/agenttic-client',
	() => ( {
		createClient: () => ( {
			sendMessage: ( ...args: unknown[] ) => mockSendMessage( ...args ),
		} ),
		createJetpackAuthProvider: () => jest.fn(),
		createTextMessage: ( text: string ) => ( {
			role: 'user',
			parts: [ { type: 'text', text } ],
			kind: 'message',
			messageId: 'test-msg-id',
			metadata: { timestamp: Date.now() },
		} ),
		extractToolCallsFromMessage: ( message: {
			parts: Array< { type: string; data?: Record< string, unknown > } >;
		} ) => {
			if ( ! message?.parts ) {
				return [];
			}
			return message.parts.filter(
				( p: { type: string; data?: Record< string, unknown > } ) =>
					p.type === 'data' && p.data && 'toolCallId' in p.data
			);
		},
		extractTextFromMessage: ( message: { parts: Array< { type: string; text?: string } > } ) => {
			if ( ! message?.parts ) {
				return '';
			}
			return message.parts
				.filter( ( p: { type: string } ) => p.type === 'text' )
				.map( ( p: { text?: string } ) => p.text || '' )
				.join( ' ' );
		},
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

/**
 * Helper to create a successful TaskUpdate response with tool call data.
 * @param titles
 * @return Mock TaskUpdate with tool call data.
 */
function createToolCallResponse( titles: Array< { title: string; explanation: string } > ) {
	return {
		id: 'task-abc123',
		status: {
			state: 'completed',
			message: {
				role: 'agent',
				parts: [
					{
						type: 'data',
						data: {
							toolCallId: 'call-1',
							toolId: 'wpcom__optimize_title',
							arguments: { titles },
						},
					},
				],
				kind: 'message',
				messageId: 'msg-1',
			},
		},
		final: true,
		text: '',
	};
}

/**
 * Helper to create a successful TaskUpdate response with plain text.
 * @param text
 * @return Mock TaskUpdate with text content.
 */
function createTextResponse( text: string ) {
	return {
		id: 'task-abc123',
		status: {
			state: 'completed',
			message: {
				role: 'agent',
				parts: [ { type: 'text', text } ],
				kind: 'message',
				messageId: 'msg-1',
			},
		},
		final: true,
		text,
	};
}

describe( 'TitleOptimization', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSendMessage.mockResolvedValue(
			createToolCallResponse( [ { title: 'Optimized Title', explanation: 'Good clarity' } ] )
		);
	} );

	it( 'sends request via agenttic-client with correct message payload', async () => {
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( mockSendMessage ).toHaveBeenCalled();
		} );

		// Verify the message payload
		const callArgs = mockSendMessage.mock.calls[ 0 ][ 0 ];
		const messageText = JSON.parse( callArgs.message.parts[ 0 ].text );
		expect( messageText ).toMatchObject( {
			ability: 'wpcom/optimize-title',
			feature: 'jetpack-ai-title-optimization',
			mode: 'ui',
			content: 'Example post content',
			keywords: '',
			post_id: 77,
		} );
		expect( messageText.site_id ).toBeDefined();
	} );

	it( 'displays title options from tool call response', async () => {
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Optimized Title' ) ).toBeInTheDocument();
		} );

		expect( mockIncreaseAiAssistantRequestsCount ).toHaveBeenCalled();
	} );

	it( 'displays title options from plain text status messages', async () => {
		mockSendMessage.mockResolvedValue(
			createTextResponse(
				`Here are optimized title options:

1) Fresh Pan de Sal and Manila-Style Breads Each Morning
2) Inside a Manila-Style Bakery: Warm Pan de Sal at Dawn
3) A Neighborhood Manila Bakery, Oven to Table
4) Taste Manila Mornings: Pan de Sal and Filipino Breads`
			)
		);

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'Fresh Pan de Sal and Manila-Style Breads Each Morning' )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Inside a Manila-Style Bakery: Warm Pan de Sal at Dawn' )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'A Neighborhood Manila Bakery, Oven to Table' )
			).toBeInTheDocument();
		} );
		expect(
			screen.queryByText( 'Taste Manila Mornings: Pan de Sal and Filipino Breads' )
		).not.toBeInTheDocument();
	} );

	it( 'displays title options from bulleted text status messages', async () => {
		mockSendMessage.mockResolvedValue(
			createTextResponse(
				`Here are optimized title options:

- Fresh Pan de Sal, Baked Each Morning | Cozy Bakery
- Manila-Style Pan de Sal, Baked Fresh Every Morning
- Taste Manila: Fresh Pan de Sal & Filipino Breads
- Cozy Bakery: Fresh Pan de Sal and Manila-Style Breads`
			)
		);

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'Fresh Pan de Sal, Baked Each Morning | Cozy Bakery' )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Manila-Style Pan de Sal, Baked Fresh Every Morning' )
			).toBeInTheDocument();
			expect(
				screen.getByText( 'Taste Manila: Fresh Pan de Sal & Filipino Breads' )
			).toBeInTheDocument();
		} );
		expect(
			screen.queryByText( 'Cozy Bakery: Fresh Pan de Sal and Manila-Style Breads' )
		).not.toBeInTheDocument();
	} );

	it( 'handles HTTP error responses with status codes', async () => {
		mockSendMessage.mockRejectedValue( new Error( 'HTTP error! status: 503' ) );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'The generation of your suggested titles failed. Please try again.' )
			).toBeInTheDocument();
		} );
	} );

	it( 'handles quota exceeded error', async () => {
		mockSendMessage.mockRejectedValue( new Error( 'HTTP error! status: 429' ) );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Quota exceeded' ) ).toBeInTheDocument();
		} );
	} );

	it( 'handles failed task state', async () => {
		mockSendMessage.mockResolvedValue( {
			id: 'task-abc123',
			status: {
				state: 'failed',
				error: { code: -32000, message: 'Internal error' },
			},
			final: true,
			text: '',
		} );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'The generation of your suggested titles failed. Please try again.' )
			).toBeInTheDocument();
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
		mockSendMessage.mockRejectedValue( new Error( 'Network failure' ) );

		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		await waitFor( () => {
			expect(
				screen.getByText( 'The generation of your suggested titles failed. Please try again.' )
			).toBeInTheDocument();
		} );
	} );
} );
