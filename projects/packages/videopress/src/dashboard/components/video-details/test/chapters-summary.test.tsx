import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChaptersSummary from '../chapters-summary';

// Capture the ToOptions the summary hands the router so the deep-link
// contract (the Chapters tab path) is asserted, not just the label.
const mockUseLinkProps = jest.fn( ( options: { to: string } ) => ( { href: options.to } ) );
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useLinkProps: ( options: unknown ) => mockUseLinkProps( options as { to: string } ),
} ) );

// Three recognized chapter lines surrounded by prose the parser must skip.
const DESCRIPTION = [
	'A video about things.',
	'',
	'00:00 Intro',
	'00:30 Middle',
	'01:10 End',
	'',
	'Thanks for watching!',
].join( '\n' );

const renderSummary = (
	overrides: { description?: string; confirmNavigation?: () => boolean } = {}
) => {
	const onOpenHelp = jest.fn();
	const utils = render(
		<ChaptersSummary
			video={ { id: '42' } }
			description={ overrides.description ?? DESCRIPTION }
			onOpenHelp={ onOpenHelp }
			confirmNavigation={ overrides.confirmNavigation }
		/>
	);
	return { ...utils, onOpenHelp };
};

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'ChaptersSummary', () => {
	it( 'counts the recognized chapter lines in the description', () => {
		renderSummary();

		expect( screen.getByText( 'Chapters (3)' ) ).toBeInTheDocument();
	} );

	it( 'counts zero when the description has no chapter lines', () => {
		renderSummary( { description: 'Just prose, no timestamps.' } );

		expect( screen.getByText( 'Chapters (0)' ) ).toBeInTheDocument();
	} );

	it( 'deep-links to the Chapters tab', () => {
		renderSummary();

		const link = screen.getByRole( 'link', { name: 'Edit chapters' } );
		expect( link ).toHaveAttribute( 'href', '/video/42/chapters' );
		expect( mockUseLinkProps ).toHaveBeenCalledWith( { to: '/video/42/chapters' } );
	} );

	it( 'opens the help modal from the help link', async () => {
		const user = userEvent.setup();
		const { onOpenHelp } = renderSummary();

		await user.click( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) );

		expect( onOpenHelp ).toHaveBeenCalled();
	} );

	// The deep link is the same exit as the Chapters sub-nav tab, so it must
	// honor the same dirty-form guard — otherwise it is a silent-discard path
	// sitting right under the description textarea.
	it( 'blocks the deep link when confirmNavigation returns false', () => {
		const confirmNavigation = jest.fn( () => false );
		renderSummary( { confirmNavigation } );

		const link = screen.getByRole( 'link', { name: 'Edit chapters' } );
		const clickEvent = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		link.dispatchEvent( clickEvent );

		expect( confirmNavigation ).toHaveBeenCalled();
		expect( clickEvent.defaultPrevented ).toBe( true );

		// And when the guard allows it, the click proceeds unprevented.
		confirmNavigation.mockReturnValue( true );
		const allowedClick = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		link.dispatchEvent( allowedClick );
		expect( allowedClick.defaultPrevented ).toBe( false );
	} );
} );
