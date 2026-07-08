import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isStudioEnabled } from '../../../utils/studio';
import ChaptersSummary from '../chapters-summary';

// Capture the ToOptions the summary hands the router so the deep-link
// contract (path + `?tool=chapters` search) is asserted, not just the label.
const mockUseLinkProps = jest.fn( ( options: { to: string } ) => ( { href: options.to } ) );
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useLinkProps: ( options: unknown ) => mockUseLinkProps( options as { to: string } ),
} ) );

jest.mock( '../../../utils/studio', () => ( {
	__esModule: true,
	isStudioEnabled: jest.fn( () => true ),
} ) );
const mockedIsStudioEnabled = isStudioEnabled as jest.Mock;

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

const renderSummary = ( overrides: { description?: string } = {} ) => {
	const onOpenHelp = jest.fn();
	const utils = render(
		<ChaptersSummary
			video={ { id: '42' } }
			description={ overrides.description ?? DESCRIPTION }
			onOpenHelp={ onOpenHelp }
		/>
	);
	return { ...utils, onOpenHelp };
};

beforeEach( () => {
	jest.clearAllMocks();
	mockedIsStudioEnabled.mockReturnValue( true );
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

	it( 'deep-links to the editor Chapters tool when Studio is enabled', () => {
		renderSummary();

		const link = screen.getByRole( 'link', { name: 'Edit chapters in the editor' } );
		expect( link ).toHaveAttribute( 'href', '/video/42/editor' );
		// The `?tool=chapters` half of the URL is the router's job; assert
		// the ToOptions we hand it (initialToolFromLocation reads it back).
		expect( mockUseLinkProps ).toHaveBeenCalledWith( {
			to: '/video/42/editor',
			search: { tool: 'chapters' },
		} );
	} );

	it( 'hides the editor link when Studio is disabled', () => {
		mockedIsStudioEnabled.mockReturnValue( false );
		renderSummary();

		// The /video/$id/editor route is stripped from the registry with the
		// flag off, so no dead link — but the count and help link remain.
		expect(
			screen.queryByRole( 'link', { name: 'Edit chapters in the editor' } )
		).not.toBeInTheDocument();
		expect( mockUseLinkProps ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Chapters (3)' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) ).toBeInTheDocument();
	} );

	it( 'opens the help modal from the help link', async () => {
		const user = userEvent.setup();
		const { onOpenHelp } = renderSummary();

		await user.click( screen.getByRole( 'link', { name: 'Learn how chapters work' } ) );

		expect( onOpenHelp ).toHaveBeenCalled();
	} );
} );
