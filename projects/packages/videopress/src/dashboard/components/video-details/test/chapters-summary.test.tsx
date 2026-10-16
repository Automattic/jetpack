import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetFeatures, setFeatures } from '../../../test-utils/features';
import ChaptersSummary from '../chapters-summary';

// Capture the ToOptions the summary hands the router so the deep-link
// contract (the Editor tab path) is asserted, not just the label.
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
	// The deep link is gated; most cases here are about the link, so default
	// the suite to enabled and let the gate tests below flip it back.
	setFeatures( { chaptersEditor: true } );
} );

afterEach( () => {
	resetFeatures();
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

	it( 'deep-links to the Editor tab', () => {
		renderSummary();

		const link = screen.getByRole( 'link', { name: 'Edit chapters in the editor' } );
		expect( link ).toHaveAttribute( 'href', '/video/42/editor' );
		expect( mockUseLinkProps ).toHaveBeenCalledWith( { to: '/video/42/editor' } );
	} );

	it( 'opens the help modal from the help link', async () => {
		const user = userEvent.setup();
		const { onOpenHelp } = renderSummary();

		await user.click( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) );

		expect( onOpenHelp ).toHaveBeenCalled();
	} );

	// The deep link is the same exit as the Editor sub-nav tab, so it must
	// honor the same dirty-form guard — otherwise it is a silent-discard path
	// sitting right under the description textarea.
	it( 'blocks the deep link when confirmNavigation returns false', () => {
		const confirmNavigation = jest.fn( () => false );
		renderSummary( { confirmNavigation } );

		const link = screen.getByRole( 'link', { name: 'Edit chapters in the editor' } );
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

	describe( 'chapters editor gate', () => {
		it( 'hides the editor deep link when the chapters editor is off', () => {
			setFeatures( { chaptersEditor: false } );
			renderSummary();

			expect(
				screen.queryByRole( 'link', { name: 'Edit chapters in the editor' } )
			).not.toBeInTheDocument();

			// The count and the help link are not gated: with the editor off the
			// description textarea is still the chapter-editing surface.
			expect( screen.getByText( 'Chapters (3)' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) ).toBeInTheDocument();
		} );

		// The `/video/$id/editor` route is stripped from the registry when the
		// gate is off, so building a location for it would make the router warn.
		it( 'does not build a router location for the unregistered route', () => {
			setFeatures( { chaptersEditor: false } );
			renderSummary();

			expect( mockUseLinkProps ).not.toHaveBeenCalled();
		} );

		it( 'shows the editor deep link when the chapters editor is on', () => {
			setFeatures( { chaptersEditor: true } );
			renderSummary();

			expect(
				screen.getByRole( 'link', { name: 'Edit chapters in the editor' } )
			).toBeInTheDocument();
		} );
	} );
} );
