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
} );
