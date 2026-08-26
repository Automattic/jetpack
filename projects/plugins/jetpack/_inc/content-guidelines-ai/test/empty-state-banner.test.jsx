import { useAiFeature } from '@automattic/jetpack-ai-client';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import EmptyStateBanner from '../components/empty-state-banner';
import useGenerateAll from '../hooks/use-generate-all';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: ( {
		children,
		onClick,
		disabled,
		href,
		className,
		style,
		label,
		'aria-hidden': ariaHidden,
	} ) => (
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
jest.mock( '@automattic/jetpack-ai-client', () => ( { useAiFeature: jest.fn() } ) );
// @wordpress/notices pulls in @wordpress/components transitively; mock it so
// that chain (rich-text -> combineReducers) never loads under the test's
// partial @wordpress/data mock.
jest.mock( '@wordpress/notices', () => ( { store: {} } ) );
jest.mock( '../hooks/use-generate-all' );

const generate = jest.fn();
const dismissBanner = jest.fn();

function setup( { dismissed = false, hasFeature = true } ) {
	useGenerateAll.mockReturnValue( { generate } );
	useAiFeature.mockReturnValue( { hasFeature } );
	useDispatch.mockReturnValue( { dismissBanner } );
	useSelect.mockImplementation( map => map( () => ( { isBannerDismissed: () => dismissed } ) ) );
}

let user;

describe( 'EmptyStateBanner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'renders nothing once dismissed', async () => {
		setup( { dismissed: true } );
		const { container } = render( <EmptyStateBanner /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing without an AI plan', async () => {
		setup( { hasFeature: false } );
		const { container } = render( <EmptyStateBanner /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the banner when active and generates on Get started', async () => {
		setup( {} );
		render( <EmptyStateBanner /> );

		expect( screen.getByText( /generate your guidelines/i ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Get started' } ) );
		expect( dismissBanner ).toHaveBeenCalledTimes( 1 );
		expect( generate ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dismisses without generating on Close', async () => {
		setup( {} );
		render( <EmptyStateBanner /> );

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
		expect( dismissBanner ).toHaveBeenCalledTimes( 1 );
		expect( generate ).not.toHaveBeenCalled();
	} );
} );
