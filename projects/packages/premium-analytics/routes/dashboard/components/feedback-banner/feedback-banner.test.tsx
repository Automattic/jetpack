/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_FEEDBACK_BANNER_KEY, DASHBOARD_PREFERENCES_SCOPE } from '../../hooks/constants';
import { resetFeedbackBannerForTesting } from '../../hooks/use-feedback-banner/use-feedback-banner';
import { FeedbackBanner } from './feedback-banner';

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => () => {},
	// The real modal's two exits, which is all the banner reacts to.
	FeedbackModal: ( {
		source,
		onSubmit,
		onClose,
	}: {
		source: string;
		onSubmit?: () => void;
		onClose: () => void;
	} ) => (
		<div>
			<span>Feedback modal from { source }</span>
			{ /* Send and Done are two steps in the real modal: it thanks the
			     reader in between, so the banner sees the two calls apart. */ }
			<button type="button" onClick={ onSubmit }>
				Send feedback
			</button>
			<button type="button" onClick={ onClose }>
				Done
			</button>
			<button type="button" onClick={ onClose }>
				Cancel
			</button>
		</div>
	),
} ) );

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | null ) => void;
};

describe( 'FeedbackBanner', () => {
	beforeEach( () => {
		resetFeedbackBannerForTesting();
		// The preferences store registers on the shared default registry, so
		// clear the key between tests.
		( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
			DASHBOARD_PREFERENCES_SCOPE,
			DASHBOARD_FEEDBACK_BANNER_KEY,
			null
		);
	} );

	it( 'asks for feedback on the new tab', () => {
		const { container } = render( <FeedbackBanner enabled /> );

		// The notice speaks its message through `@wordpress/a11y`, which mirrors
		// the text into a live region on `document.body`.
		expect( container ).toHaveTextContent(
			"Tell us what's better, what's worse, and what you miss about the new Traffic tab."
		);
	} );

	it( 'renders nothing until the surface is ready', () => {
		const { container } = render( <FeedbackBanner enabled={ false } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'hands the reader the modal and waits behind it', async () => {
		const user = userEvent.setup();
		render( <FeedbackBanner enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Leave feedback' } ) );

		expect( screen.getByText( 'Feedback modal from banner' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Leave feedback' } ) ).toBeInTheDocument();
	} );

	it( 'is still there for a reader who backs out of the modal', async () => {
		const user = userEvent.setup();
		render( <FeedbackBanner enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Leave feedback' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( screen.queryByText( 'Feedback modal from banner' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Leave feedback' } ) ).toBeInTheDocument();
	} );

	it( 'goes away once the answer is sent, before the modal is done thanking', async () => {
		const user = userEvent.setup();
		const { container } = render( <FeedbackBanner enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Leave feedback' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Send feedback' } ) );

		expect( screen.queryByRole( 'button', { name: 'Leave feedback' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'goes away when dismissed', async () => {
		const user = userEvent.setup();
		const { container } = render( <FeedbackBanner enabled /> );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
