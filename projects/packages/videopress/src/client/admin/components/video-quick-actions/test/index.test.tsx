import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectVideoQuickActions } from '..';
import type { CaptionManagerModalProps } from '../../../../components/caption-manager-modal/types';

let lastCaptionManagerProps: CaptionManagerModalProps | undefined;

jest.mock( '@automattic/jetpack-components', () => ( {
	Button: ( {
		children,
		icon,
		onBlur,
		onClick,
		onFocus,
		onMouseEnter,
		onMouseLeave,
		disabled,
		'aria-label': ariaLabel,
	} ) => (
		<button
			type="button"
			aria-label={ ariaLabel }
			onBlur={ onBlur }
			onClick={ onClick }
			onFocus={ onFocus }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			disabled={ disabled }
		>
			{ children ?? icon }
		</button>
	),
	Text: ( { children } ) => <span>{ children }</span>,
	ThemeProvider: ( { children } ) => <>{ children }</>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Dropdown: ( { renderToggle } ) => (
		<div>{ renderToggle( { isOpen: false, onToggle: jest.fn() } ) }</div>
	),
	Popover: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	formatListBullets: 'captions-icon',
	globe: 'site-default-icon',
	image: 'image-icon',
	trash: 'trash-icon',
} ) );

jest.mock( '../../../../components/icons/crossed-eye-icon', () => 'private-icon' );

jest.mock( '../../../../components/icons/uncrossed-eye-icon', () => 'public-icon' );

jest.mock( '../../../../components/caption-manager-modal', () => ( {
	__esModule: true,
	default: ( props: CaptionManagerModalProps ) => {
		lastCaptionManagerProps = props;
		return props.isOpen ? <div role="dialog">Caption manager</div> : null;
	},
} ) );

jest.mock( '../../../hooks/use-permission', () => ( {
	usePermission: () => ( { canPerformAction: true } ),
} ) );

jest.mock( '../../../hooks/use-playback-token', () => ( {
	__esModule: true,
	default: () => ( { isFetchingPlaybackToken: false } ),
} ) );

jest.mock( '../../../hooks/use-poster-edit', () => ( {
	__esModule: true,
	default: () => ( {
		frameSelectorIsOpen: false,
		handleCloseSelectFrame: jest.fn(),
		handleConfirmFrame: jest.fn(),
		handleOpenSelectFrame: jest.fn(),
		handleVideoFrameSelected: jest.fn(),
		selectedTime: null,
		selectAndUpdatePosterImageFromLibrary: jest.fn(),
		updatePosterImageFromFrame: jest.fn(),
	} ),
} ) );

jest.mock( '../../../hooks/use-video', () => ( {
	__esModule: true,
	default: () => ( {
		data: {
			guid: 'video-guid',
			posterImage: 'https://example.com/poster.jpg',
			privacySetting: 0,
			title: 'Video title',
			url: 'https://example.com/video.mp4',
		},
		deleteVideo: jest.fn(),
		isUpdatingPoster: false,
		isUpdatingPrivacy: false,
		updateVideoPrivacy: jest.fn(),
	} ),
} ) );

jest.mock( '../../delete-video-confirmation-modal', () => ( {
	__esModule: true,
	default: () => <div>Delete video modal</div>,
} ) );

jest.mock( '../../video-thumbnail', () => ( {
	VideoThumbnailDropdownButtons: () => <div>Thumbnail actions</div>,
} ) );

jest.mock( '../../video-thumbnail-selector-modal', () => ( {
	__esModule: true,
	default: () => <div>Thumbnail selector modal</div>,
} ) );

beforeEach( () => {
	lastCaptionManagerProps = undefined;
	jest.clearAllMocks();
} );

describe( 'ConnectVideoQuickActions captions action', () => {
	it( 'opens the shared caption manager modal for library quick actions', async () => {
		const user = userEvent.setup();

		render( <ConnectVideoQuickActions videoId={ 42 } /> );

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
