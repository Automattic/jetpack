import { render, screen, fireEvent } from '@testing-library/react';
import { useAICheckout, useAiFeature } from '@automattic/jetpack-ai-client';
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
	Button: ( { children, onClick, disabled, href, className, style, label, 'aria-hidden': ariaHidden } ) => (
		<button
			type="button"
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
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

function setup( { hasFeature = false, dismissed = false, forced = false, checkoutUrl = 'https://wordpress.com/checkout' } ) {
	useAiFeature.mockReturnValue( { hasFeature } );
	useAICheckout.mockReturnValue( { checkoutUrl } );
	useDispatch.mockReturnValue( { dismissBanner, hideUpgradeNotice } );
	const selectors = {
		isBannerDismissed: () => dismissed,
		isUpgradeNoticeForced: () => forced,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
}

describe( 'UpgradeNotice', () => {
	beforeAll( () => {
		window.HTMLElement.prototype.scrollIntoView = jest.fn();
	} );
	beforeEach( () => jest.clearAllMocks() );

	it( 'renders nothing when the site already has the AI feature', () => {
		setup( { hasFeature: true } );
		const { container } = render( <UpgradeNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when dismissed and not forced', () => {
		setup( { dismissed: true, forced: false } );
		const { container } = render( <UpgradeNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'stays visible when dismissed but forced by a fresh Generate click', () => {
		setup( { dismissed: true, forced: true } );
		render( <UpgradeNotice /> );
		expect( screen.getByRole( 'button', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'links Upgrade to the checkout URL and records the click', () => {
		setup( { checkoutUrl: 'https://wordpress.com/checkout/abc' } );
		render( <UpgradeNotice /> );

		const upgrade = screen.getByRole( 'button', { name: 'Upgrade' } );
		expect( upgrade ).toHaveAttribute( 'href', 'https://wordpress.com/checkout/abc' );

		fireEvent.click( upgrade );
		expect( recordAiEvent ).toHaveBeenCalledWith( 'jetpack_ai_upgrade_button', {
			placement: 'content-guidelines',
		} );
	} );

	it( 'omits the Upgrade button when no checkout URL is available', () => {
		setup( { checkoutUrl: null } );
		render( <UpgradeNotice /> );
		expect( screen.queryByRole( 'button', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'scrolls into view when forced', () => {
		setup( { forced: true } );
		render( <UpgradeNotice /> );
		expect( window.HTMLElement.prototype.scrollIntoView ).toHaveBeenCalled();
	} );

	it( 'clears both the session and persisted dismissal on Close', () => {
		setup( {} );
		render( <UpgradeNotice /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );
		expect( hideUpgradeNotice ).toHaveBeenCalledTimes( 1 );
		expect( dismissBanner ).toHaveBeenCalledTimes( 1 );
	} );
} );
