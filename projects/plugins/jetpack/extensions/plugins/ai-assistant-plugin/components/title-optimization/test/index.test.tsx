import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TitleOptimization from '..';

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	AiAssistantModal: ( { children, title }: { children: React.ReactNode; title: string } ) => (
		<section>
			<h1>{ title }</h1>
			{ children }
		</section>
	),
	ERROR_NETWORK: 'network',
	ERROR_QUOTA_EXCEEDED: 'quota',
	ERROR_SERVICE_UNAVAILABLE: 'service-unavailable',
	ERROR_UNCLEAR_PROMPT: 'unclear-prompt',
	QuotaExceededMessage: () => null,
	useAiSuggestions: () => ( {
		request: jest.fn(),
		stopSuggestion: jest.fn(),
	} ),
	usePostContent: () => ( {
		getPostContent: jest.fn(),
		isEditedPostEmpty: () => false,
	} ),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( {
		tracks: {
			recordEvent: jest.fn(),
		},
	} ),
	useAutosaveAndRedirect: () => ( {
		autosave: jest.fn(),
	} ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick }: { children: React.ReactNode; onClick?: () => void } ) => (
		<button onClick={ onClick }>{ children }</button>
	),
	Notice: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Spinner: () => <span>Loading</span>,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		editPost: jest.fn(),
		increaseAiAssistantRequestsCount: jest.fn(),
	} ),
} ) );

jest.mock( '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability', () => ( {
	getFeatureAvailability: () => false,
} ) );

jest.mock( '../style.scss', () => ( {} ) );

describe( 'TitleOptimization', () => {
	it( 'uses content-neutral wording', async () => {
		const user = userEvent.setup();
		render( <TitleOptimization placement="sidebar" busy={ false } disabled={ false } /> );

		expect( screen.getByText( 'Based on your content.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'Optimize title' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Generate title options' } ) );

		expect( screen.getByRole( 'heading', { name: 'Optimize title' } ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Reading your content and generating suggestions…' )
		).toBeInTheDocument();
	} );
} );
