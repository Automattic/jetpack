const mockApiFetch = jest.fn( () => Promise.resolve( {} ) );
const mockSetShowHelpCenter = jest.fn();
const mockScriptData = jest.fn< Record< string, unknown > | undefined, [] >();
let mockHelpCenter: { setShowHelpCenter?: jest.Mock } | undefined;

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => mockHelpCenter,
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: () => mockScriptData(),
} ) );

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Link: ( {
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: ( event: React.MouseEvent ) => void;
	} ) => (
		<a href={ href } onClick={ onClick }>
			{ children }
		</a>
	),
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div role="status">{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <strong>{ children }</strong>,
		Description: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
		CloseIcon: ( { label, onClick }: { label: string; onClick: () => void } ) => (
			<button onClick={ onClick }>{ label }</button>
		),
	},
} ) );

// Imports must come after the jest.mock factories above.
import { fireEvent, render, screen } from '@testing-library/react';
import SubscriberCountNotice from '../_inc/subscribers/components/subscriber-count-notice';

const shownData = {
	showSubscriberCountNotice: true,
	subscriberCountNoticeMetaKey: 'jetpack_newsletter_subscriber_count_notice_dismissed',
};

describe( 'SubscriberCountNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockHelpCenter = undefined;
		mockScriptData.mockReturnValue( shownData );
	} );

	it( 'renders nothing when the server did not ask for it', () => {
		mockScriptData.mockReturnValue( { ...shownData, showSubscriberCountNotice: false } );
		const { container } = render( <SubscriberCountNotice /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the agreed copy', () => {
		render( <SubscriberCountNotice /> );
		expect( screen.getByText( 'Your subscriber count is now more accurate.' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: 'Happiness Engineers are here to help' } )
		).toHaveAttribute( 'href', 'https://wordpress.com/help/contact' );
	} );

	it( 'hides on dismiss and stamps the dismissal meta', () => {
		render( <SubscriberCountNotice /> );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { meta: { [ shownData.subscriberCountNoticeMetaKey ]: true } },
		} );
	} );

	it( 'opens the Help Center in place when its store is available', () => {
		mockHelpCenter = { setShowHelpCenter: mockSetShowHelpCenter };
		render( <SubscriberCountNotice /> );
		const link = screen.getByRole( 'link', { name: 'Happiness Engineers are here to help' } );

		// `fireEvent` returns false when the handler cancelled the navigation.
		// eslint-disable-next-line testing-library/prefer-user-event
		expect( fireEvent.click( link ) ).toBe( false );
		expect( mockSetShowHelpCenter ).toHaveBeenCalledWith( true );
	} );

	it( 'falls back to the contact page link without the Help Center', () => {
		render( <SubscriberCountNotice /> );
		const link = screen.getByRole( 'link', { name: 'Happiness Engineers are here to help' } );

		// eslint-disable-next-line testing-library/prefer-user-event
		expect( fireEvent.click( link ) ).toBe( true );
		expect( mockSetShowHelpCenter ).not.toHaveBeenCalled();
	} );
} );
