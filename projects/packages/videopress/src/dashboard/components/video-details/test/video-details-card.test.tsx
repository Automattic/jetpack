import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetFeatures, setFeatures } from '../../../test-utils/features';
import { makeLibraryItem } from '../../../test-utils/library-item';
import VideoDetailsCard from '../video-details-card';

// ChaptersSummary builds its deep link through useLinkProps.
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useLinkProps: ( { to }: { to: string } ) => ( { href: to } ),
} ) );

// The thumbnail row carries its own poster mutation and frame picker, both
// covered by thumbnail-control.test.tsx. Stubbed here so this suite needs no
// QueryClient and no apiFetch.
jest.mock( '../thumbnail-control', () => ( {
	__esModule: true,
	default: () => <div data-testid="thumbnail-control" />,
} ) );

const video = makeLibraryItem( { filename: 'holiday-clip.mp4' } );
const DESCRIPTION = '00:00 Intro\n00:30 Middle';

const renderCard = ( overrides: { confirmNavigation?: () => boolean } = {} ) => {
	const onChange = jest.fn();
	const onOpenChapters = jest.fn();
	const utils = render(
		<VideoDetailsCard
			video={ video }
			title="My Clip"
			description={ DESCRIPTION }
			onChange={ onChange }
			onOpenChapters={ onOpenChapters }
			confirmNavigation={ overrides.confirmNavigation }
		/>
	);
	return { ...utils, onChange, onOpenChapters };
};

beforeEach( () => {
	setFeatures( { chaptersEditor: true } );
} );

afterEach( () => {
	resetFeatures();
} );

describe( 'VideoDetailsCard', () => {
	it( 'heads the card "Video details"', () => {
		renderCard();

		expect( screen.getByText( 'Video details' ) ).toBeInTheDocument();
	} );

	it( 'shows the file name as a labelled read-out', () => {
		renderCard();

		expect( screen.getByText( 'File name' ) ).toBeInTheDocument();
		expect( screen.getByText( 'holiday-clip.mp4' ) ).toBeInTheDocument();
	} );

	/*
	 * The backstop against a future primitive swap. Both fields are reached by
	 * accessible name from routes/video/test/stage.test.tsx, so a change that
	 * drops or renames either label breaks the stage suite in a way that is
	 * hard to read. Fail here instead, next to the cause.
	 */
	it( 'exposes Title and Description by their accessible names', () => {
		renderCard();

		expect( screen.getByLabelText( 'Title' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Description' ) ).toBeInTheDocument();
	} );

	it( 'reports edits to both fields through onChange', async () => {
		const user = userEvent.setup();
		const { onChange } = renderCard();

		await user.type( screen.getByLabelText( 'Title' ), '!' );
		expect( onChange ).toHaveBeenCalledWith( { title: 'My Clip!' } );

		await user.type( screen.getByLabelText( 'Description' ), '!' );
		expect( onChange ).toHaveBeenCalledWith( { description: `${ DESCRIPTION }!` } );
	} );

	it( 'renders the chapters summary over the current description', () => {
		renderCard();

		expect( screen.getByText( 'Chapters (2)' ) ).toBeInTheDocument();
	} );

	it( 'renders the thumbnail control', () => {
		renderCard();

		expect( screen.getByTestId( 'thumbnail-control' ) ).toBeInTheDocument();
	} );

	// confirmNavigation has to keep reaching ChaptersSummary: the deep link is
	// the same exit as the Editor sub-nav tab, so without the guard it becomes
	// a silent-discard path sitting under the description.
	it( 'forwards confirmNavigation to the chapters deep link', () => {
		const confirmNavigation = jest.fn( () => false );
		renderCard( { confirmNavigation } );

		const link = screen.getByRole( 'link', { name: 'Edit chapters in the editor' } );
		const clickEvent = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		link.dispatchEvent( clickEvent );

		expect( confirmNavigation ).toHaveBeenCalled();
		expect( clickEvent.defaultPrevented ).toBe( true );
	} );
} );
