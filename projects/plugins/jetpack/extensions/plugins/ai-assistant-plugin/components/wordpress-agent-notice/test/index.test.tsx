import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import WordPressAgentNotice, {
	DISMISSED_PREFERENCE,
	PREFERENCE_SCOPE,
	useWordPressAgentNotice,
} from '..';
import { resumeWordPressAgentChat, setWordPressAgentChatOpen } from '../open-agent';

const mockRecordEvent = jest.fn();
let mockCurrentTier: { slug?: string } | undefined;
let mockSiteType: 'simple' | 'woa' | 'jetpack' = 'simple';
let mockPostType: string | undefined = 'post';
let mockIsAgentReady = true;
let mockIsChatOnScreen = false;
let mockIsFeatureAvailable = true;

jest.mock( '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability', () => ( {
	getFeatureAvailability: () => mockIsFeatureAvailable,
} ) );

jest.mock( '../open-agent', () => ( {
	setWordPressAgentChatOpen: jest.fn(),
	resumeWordPressAgentChat: jest.fn(),
	useIsWordPressAgentReady: () => mockIsAgentReady,
	useIsWordPressAgentChatVisible: () => mockIsChatOnScreen,
} ) );

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: mockRecordEvent } } ),
} ) );

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	useAiFeature: () => ( { currentTier: mockCurrentTier } ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: () => mockSiteType,
} ) );

// The component reads the post type off the shared registry by store name, so
// stand up a matching store rather than mocking the data layer.
register(
	createReduxStore( 'core/editor', {
		reducer: ( state = {} ) => state,
		selectors: { getCurrentPostType: () => mockPostType },
	} )
);

const isDismissed = () => select( preferencesStore ).get( PREFERENCE_SCOPE, DISMISSED_PREFERENCE );

const propertiesOf = ( eventName: string ) =>
	mockRecordEvent.mock.calls.find( ( [ name ] ) => name === eventName )?.[ 1 ];

describe( 'WordPressAgentNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		dispatch( preferencesStore ).set( PREFERENCE_SCOPE, DISMISSED_PREFERENCE, undefined );
		mockCurrentTier = { slug: 'ai-assistant-tier-free' };
		mockSiteType = 'simple';
		mockPostType = 'post';
		mockIsAgentReady = true;
		mockIsChatOnScreen = false;
		mockIsFeatureAvailable = true;
	} );

	describe( 'useWordPressAgentNotice', () => {
		const stateFor = ( isAvailable: boolean, hasDismissed: boolean ) => {
			mockIsFeatureAvailable = isAvailable;
			dispatch( preferencesStore ).set(
				PREFERENCE_SCOPE,
				DISMISSED_PREFERENCE,
				hasDismissed || undefined
			);
			return renderHook( () => useWordPressAgentNotice() ).result.current;
		};

		it( 'shows the notice where the site has the Agent and nobody has dismissed it', () => {
			expect( stateFor( true, false ) ).toEqual( { isVisible: true, isDismissed: false } );
		} );

		it( 'shows nothing where the site has the Agent and the notice was dismissed', () => {
			expect( stateFor( true, true ) ).toEqual( { isVisible: false, isDismissed: true } );
		} );

		it( 'leaves the AI panel alone where the site has no Agent', () => {
			expect( stateFor( false, false ) ).toEqual( { isVisible: false, isDismissed: false } );
		} );

		it( 'leaves the AI panel alone where the site lost the Agent after a dismissal', () => {
			// Otherwise switching the feature off would delete the panel for anyone
			// who had dismissed the notice while it was on.
			expect( stateFor( false, true ) ).toEqual( { isVisible: false, isDismissed: false } );
		} );
	} );

	describe( 'when the chat is already on screen', () => {
		beforeEach( () => {
			mockIsChatOnScreen = true;
		} );

		it( 'disables the action, which would open a chat that is already open', () => {
			render( <WordPressAgentNotice placement="document-settings" /> );

			// aria-disabled rather than the disabled attribute, so the button stays
			// focusable and announces why.
			expect( screen.getByRole( 'button', { name: /WordPress Agent/ } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'does nothing when the disabled action is clicked', async () => {
			const user = userEvent.setup();
			render( <WordPressAgentNotice placement="document-settings" /> );

			await user.click( screen.getByRole( 'button', { name: /WordPress Agent/ } ) );

			expect( setWordPressAgentChatOpen ).not.toHaveBeenCalled();
			expect( mockRecordEvent ).not.toHaveBeenCalled();
		} );

		it( 'says why the action is disabled, rather than only dimming it', () => {
			render( <WordPressAgentNotice placement="document-settings" /> );

			expect(
				screen.getByRole( 'button', { name: 'WordPress Agent is already open' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'before the Agents Manager arrives', () => {
		beforeEach( () => {
			mockIsAgentReady = false;
		} );

		it( 'still says where the AI tools went', () => {
			render( <WordPressAgentNotice placement="document-settings" /> );

			expect(
				screen.getByText(
					'AI tools have moved to the WordPress Agent. Look for the "Ask AI" button at the top of the screen.'
				)
			).toBeInTheDocument();
		} );

		it( 'offers no action it cannot carry out', () => {
			render( <WordPressAgentNotice placement="document-settings" /> );

			expect( screen.queryByRole( 'button', { name: 'WordPress Agent' } ) ).not.toBeInTheDocument();
		} );

		it( 'can still be dismissed', async () => {
			const user = userEvent.setup();
			render( <WordPressAgentNotice placement="document-settings" /> );

			await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

			expect( isDismissed() ).toBe( true );
		} );
	} );

	it( 'links to the documentation, through the Jetpack redirect service', () => {
		render( <WordPressAgentNotice placement="document-settings" /> );

		const link = screen.getByRole( 'link', { name: /Learn more/ } );
		expect( link ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-ai-docs-wordpress-agent' )
		);
	} );

	it( 'keeps the documentation link when the Agent has not loaded', () => {
		mockIsAgentReady = false;
		render( <WordPressAgentNotice placement="document-settings" /> );

		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toBeInTheDocument();
	} );

	it( 'tells the reader where the AI tools went', () => {
		render( <WordPressAgentNotice placement="document-settings" /> );

		expect(
			screen.getByText(
				'AI tools have moved to the WordPress Agent. Look for the "Ask AI" button at the top of the screen.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows the Agent icon in the description, hidden from screen readers', () => {
		render( <WordPressAgentNotice placement="document-settings" /> );

		// The icon is hidden from assistive technology on purpose, so it has no
		// role or name to query by.
		// eslint-disable-next-line testing-library/no-node-access
		const icon = screen.getByText( /AI tools have moved/ ).querySelector( 'svg' );

		expect( icon ).toBeInTheDocument();
		// The words next to it describe the icon, so announcing it would repeat them.
		expect( icon ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'opens the WordPress Agent when the action is clicked', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( setWordPressAgentChatOpen ).toHaveBeenCalledWith( true );
	} );

	it( 'opens the chat on its default screen, not wherever it was last left', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( resumeWordPressAgentChat ).toHaveBeenCalled();
		// Resetting after the open would show the old screen first.
		expect( ( resumeWordPressAgentChat as jest.Mock ).mock.invocationCallOrder[ 0 ] ).toBeLessThan(
			( setWordPressAgentChatOpen as jest.Mock ).mock.invocationCallOrder[ 0 ]
		);
	} );

	it( 'records the placement when the action is clicked', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="jetpack-sidebar" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( propertiesOf( 'jetpack_ai_agent_notice_click' ) ).toMatchObject( {
			placement: 'jetpack-sidebar',
		} );
	} );

	it( 'records the site type, plan tier and post type with each event', async () => {
		const user = userEvent.setup();
		mockCurrentTier = { slug: 'ai-assistant-tier-1' };
		mockPostType = 'page';
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		const expected = {
			site_type: 'simple',
			current_tier_slug: 'ai-assistant-tier-1',
			post_type: 'page',
		};
		expect( propertiesOf( 'jetpack_ai_agent_notice_click' ) ).toMatchObject( expected );
		expect( propertiesOf( 'jetpack_ai_agent_notice_dismiss' ) ).toMatchObject( expected );
	} );

	it.each( [ 'woa', 'jetpack' ] as const )( 'reports a %s site as itself', async siteType => {
		const user = userEvent.setup();
		mockSiteType = siteType;
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( propertiesOf( 'jetpack_ai_agent_notice_click' ) ).toMatchObject( {
			site_type: siteType,
		} );
	} );

	it( 'omits the post type outside a post context', async () => {
		const user = userEvent.setup();
		mockPostType = undefined;
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( propertiesOf( 'jetpack_ai_agent_notice_click' ) ).not.toHaveProperty( 'post_type' );
	} );

	it( 'omits the plan tier when the site has no tier', async () => {
		const user = userEvent.setup();
		mockCurrentTier = undefined;
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( propertiesOf( 'jetpack_ai_agent_notice_click' ) ).not.toHaveProperty(
			'current_tier_slug'
		);
	} );

	it( 'keeps the notice for next time when the action is clicked', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'WordPress Agent' } ) );

		expect( isDismissed() ).toBeFalsy();
	} );

	it( 'stores the dismissal so every placement hides the notice', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="pre-publish" /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( isDismissed() ).toBe( true );
	} );

	it( 'records the placement when the notice is dismissed', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="pre-publish" /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( propertiesOf( 'jetpack_ai_agent_notice_dismiss' ) ).toMatchObject( {
			placement: 'pre-publish',
		} );
	} );

	it( 'announces the dismissal, which the reader did ask for', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="document-settings" /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( speak ).toHaveBeenCalledWith( 'Notice dismissed.', 'polite' );
	} );

	it( 'does not open the Agent when the notice is dismissed', async () => {
		const user = userEvent.setup();
		render( <WordPressAgentNotice placement="pre-publish" /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( setWordPressAgentChatOpen ).not.toHaveBeenCalled();
	} );
} );
