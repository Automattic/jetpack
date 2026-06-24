import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TracksControl from '..';

const mockInvalidateResolution = jest.fn();

jest.mock( '@wordpress/components', () => ( {
	ToolbarButton: ( { label, onClick } ) => <button onClick={ onClick }>{ label }</button>,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '../../../../../../components/caption-manager-modal', () => ( {
	__esModule: true,
	default: ( { isOpen, onTracksChange } ) =>
		isOpen ? (
			<div role="dialog" aria-label="Manage subtitles">
				<button
					onClick={ () =>
						onTracksChange( [
							{
								kind: 'captions',
								srcLang: 'en',
								label: 'English',
								src: 'english.vtt',
							},
						] )
					}
				>
					Update tracks
				</button>
			</div>
		) : null,
} ) );

jest.mock( '../../../../../../lib/url', () => ( {
	getVideoPressUrl: () => 'https://videopress.example/video',
} ) );

jest.mock( '../../icons', () => ( {
	tracksIcon: 'tracks',
} ) );

describe( 'TracksControl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'opens the shared subtitle manager modal from the block toolbar', async () => {
		const user = userEvent.setup();
		const setAttributes = jest.fn();

		render(
			<TracksControl
				attributes={ { guid: 'abc123', title: 'Test video', tracks: [] } }
				setAttributes={ setAttributes }
			/>
		);

		expect( screen.queryByText( 'Upload track' ) ).not.toBeInTheDocument();

		await user.click( screen.getByText( 'Manage subtitles' ) );
		expect( screen.getByRole( 'dialog', { name: 'Manage subtitles' } ) ).toBeInTheDocument();

		await user.click( screen.getByText( 'Update tracks' ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			tracks: [
				{
					kind: 'captions',
					srcLang: 'en',
					label: 'English',
					src: 'english.vtt',
				},
			],
		} );
		expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEmbedPreview', [
			'https://videopress.example/video',
		] );
	} );
} );
