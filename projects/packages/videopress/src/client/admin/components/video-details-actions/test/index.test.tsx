import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoDetailsActions from '..';
import type { CaptionManagerModalProps } from '../../../../components/caption-manager-modal/types';

let lastCaptionManagerProps: CaptionManagerModalProps | undefined;

jest.mock( '@automattic/jetpack-components', () => ( {
	ThemeProvider: ( { children } ) => <>{ children }</>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, disabled, href, onClick } ) => (
		<button type="button" disabled={ disabled } data-href={ href } onClick={ onClick }>
			{ children }
		</button>
	),
	Dropdown: ( { renderContent, renderToggle } ) => (
		<div>
			{ renderToggle( { isOpen: true, onToggle: jest.fn() } ) }
			{ renderContent( { onClose: jest.fn() } ) }
		</div>
	),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	download: 'download-icon',
	formatListBullets: 'captions-icon',
	media: 'media-icon',
	moreVertical: 'more-icon',
	trash: 'trash-icon',
} ) );

jest.mock( '@wordpress/url', () => ( {
	addQueryArgs: ( url: string ) => url,
} ) );

jest.mock( '../../../../components/caption-manager-modal', () => ( {
	__esModule: true,
	default: ( props: CaptionManagerModalProps ) => {
		lastCaptionManagerProps = props;
		return props.isOpen ? <div role="dialog">Caption manager</div> : null;
	},
} ) );

jest.mock( '../../../hooks/use-video', () => ( {
	__esModule: true,
	default: () => ( {
		data: {
			guid: 'video-guid',
			posterImage: 'https://example.com/poster.jpg',
			title: 'Video title',
			url: 'https://example.com/video.mp4',
		},
		deleteVideo: jest.fn(),
	} ),
} ) );

jest.mock( '../../delete-video-confirmation-modal', () => ( {
	__esModule: true,
	default: () => <div>Delete video modal</div>,
} ) );

beforeEach( () => {
	lastCaptionManagerProps = undefined;
	jest.clearAllMocks();
} );

describe( 'VideoDetailsActions captions action', () => {
	it( 'opens the shared caption manager modal from the video details dropdown', async () => {
		const user = userEvent.setup();

		render( <VideoDetailsActions videoId={ 42 } onDelete={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Manage captions' } ) );

		expect( screen.getByRole( 'dialog' ) ).toHaveTextContent( 'Caption manager' );
		expect( lastCaptionManagerProps ).toMatchObject( {
			guid: 'video-guid',
			poster: 'https://example.com/poster.jpg',
			title: 'Video title',
			videoSrc: 'https://example.com/video.mp4',
		} );
	} );
} );
