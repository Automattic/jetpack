import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import UpgradeNotice from '../components/upgrade-notice';
import { recordAiEvent } from '../lib/tracks';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	// Mirror the real Button: an href renders an anchor (role "link"), otherwise
	// a button. Keeps role-based queries faithful to the shipped component.
	Button: ( {
		children,
		onClick,
		disabled,
		href,
		className,
		style,
		label,
		'aria-hidden': ariaHidden,
	} ) =>
		href ? (
			<a
				href={ href }
				onClick={ onClick }
				className={ className }
				style={ style }
				aria-label={ label }
			>
				{ children }
			</a>
		) : (
			<button
				type="button"
				onClick={ onClick }
				disabled={ disabled }
				className={ className }
				style={ style }
				aria-hidden={ ariaHidden }
				aria-label={ label }
			>
				{ children }
			</button>
		),
	Tooltip: ( { children } ) => children,
	Notice: ( { children, onRemove, isDismissible } ) => (
		<div>
			{ children }
			{ isDismissible !== false && (
				<button type="button" aria-label="Close" onClick={ onRemove }>
					Close
				</button>
			) }
		</div>
	),
	Spinner: () => <span className="components-spinner" />,
} ) );
jest.mock( '@automattic/jetpack-ai-client', () => ( {
	useAiFeature: jest.fn(),
	useAICheckout: jest.fn(),
} ) );
jest.mock( '../lib/tracks', () => ( { recordAiEvent: jest.fn() } ) );

const dismissBanner = jest.fn();
const hideUpgradeNotice = jest.fn();

function setup( {
	hasFeature = false,
	dismissed = false,
	forced = false,
	checkoutUrl = 'https://wordpress.com/checkout',
} ) {
	useAiFeature.mockReturnValue( { hasFeature } );
	useAICheckout.mockReturnValue( { checkoutUrl } );
	useDispatch.mockReturnValue( { dismissBanner, hideUpgradeNotice } );
	const selectors = {
		isBannerDismissed: () => dismissed,
		isUpgradeNoticeForced: () => forced,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
}

let user;

describe( 'UpgradeNotice', () => {
	beforeAll( () => {
		// jsdom doesn't implement scrollIntoView, so spyOn can't attach — define it.
		// eslint-disable-next-line jest/prefer-spy-on
		window.HTMLElement.prototype.scrollIntoView = jest.fn();
	} );
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'renders nothing when the site already has the AI feature', async () => {
		setup( { hasFeature: true } );
		const { container } = render( <UpgradeNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when dismissed and not forced', async () => {
		setup( { dismissed: true, forced: false } );
		const { container } = render( <UpgradeNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'stays visible when dismissed but forced by a fresh Generate click', async () => {
		setup( { dismissed: true, forced: true } );
		render( <UpgradeNotice /> );
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'links Upgrade to the checkout URL and records the click', async () => {
		setup( { checkoutUrl: 'https://wordpress.com/checkout/abc' } );
		render( <UpgradeNotice /> );

		const upgrade = screen.getByRole( 'link', { name: 'Upgrade' } );
		expect( upgrade ).toHaveAttribute( 'href', 'https://wordpress.com/checkout/abc' );

		// jsdom can't navigate; swallow the anchor default so the click only
		// exercises the tracking handler.
		const preventNav = event => event.preventDefault();
		document.addEventListener( 'click', preventNav );
		await user.click( upgrade );
		document.removeEventListener( 'click', preventNav );

		expect( recordAiEvent ).toHaveBeenCalledWith( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	} );

	it( 'omits the Upgrade button when no checkout URL is available', async () => {
		setup( { checkoutUrl: null } );
		render( <UpgradeNotice /> );
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'scrolls into view when forced', async () => {
		setup( { forced: true } );
		render( <UpgradeNotice /> );
		expect( window.HTMLElement.prototype.scrollIntoView ).toHaveBeenCalled();
	} );

	it( 'clears both the session and persisted dismissal on Close', async () => {
		setup( {} );
		render( <UpgradeNotice /> );

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
		expect( hideUpgradeNotice ).toHaveBeenCalledTimes( 1 );
		expect( dismissBanner ).toHaveBeenCalledTimes( 1 );
	} );
} );
