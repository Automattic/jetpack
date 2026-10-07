import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoPressEdit from '../edit';

jest.mock( '..', () => ( { title: 'VideoPress', description: 'Video' } ) );
jest.mock( '@automattic/jetpack-connection', () => ( {} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: {} } ),
} ) );
jest.mock( '../../../../lib/connection', () => ( {
	isStandaloneActive: () => true,
	isSiteConnected: () => true,
	isVideoPressActive: () => true,
	isVideoPressModuleActive: () => true,
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	store: 'block-editor',
	useBlockProps: () => ( {} ),
	BlockControls: ( { children } ) => children,
	InspectorControls: () => null,
} ) );
jest.mock( '@wordpress/blocks', () => ( {} ) );
jest.mock( '@wordpress/components', () => ( {
	withNotices: component => component,
	ToolbarButton: ( { label, onClick } ) => <button onClick={ onClick }>{ label }</button>,
	PanelBody: () => null,
	ToggleControl: () => null,
} ) );
const mockInvalidateResolution = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
} ) );
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.mock( '../../../hooks/use-preview', () => ( {
	usePreview: () => ( { preview: { html: '<iframe />' }, isRequestingEmbedPreview: false } ),
} ) );
jest.mock( '../../../hooks/use-sync-media', () => ( {
	useSyncMedia: () => ( { videoData: {} } ),
} ) );
jest.mock( '../components/banner/connect-banner', () => () => null );
jest.mock( '../components/chapters-control', () => () => null );
jest.mock( '../components/color-panel', () => () => null );
jest.mock( '../components/details-panel', () => () => null );
jest.mock( '../components/playback-panel', () => () => null );
jest.mock( '../components/poster-image-block-control', () => () => null );
jest.mock( '../components/poster-panel', () => () => null );
jest.mock( '../components/privacy-and-rating-panel', () => () => null );
jest.mock( '../components/replace-control', () => () => null );
jest.mock( '../components/tracks-control', () => () => null );
jest.mock( '../components/videopress-uploader', () => () => null );
jest.mock( '../../../../components/trim-cut-modal/lazy', () => ( {
	__esModule: true,
	default: ( { onProcessed } ) => <button onClick={ onProcessed }>Finish processing</button>,
} ) );
jest.mock( '../components/player', () => ( {
	__esModule: true,
	default: () => <iframe title="Video preview" />,
} ) );

afterEach( () => {
	delete window.videoPressEditorState;
} );

it( 'reloads the player after processing even when the GUID and embed markup have not changed', async () => {
	window.videoPressEditorState = { trimCutEnabled: true } as Window[ 'videoPressEditorState' ];
	const user = userEvent.setup();
	const setAttributes = jest.fn();
	render(
		<VideoPressEdit
			attributes={ {
				guid: 'clip123',
				id: 42,
				cacheHtml: '<iframe />',
				posterData: { previewOnHover: true },
			} }
			setAttributes={ setAttributes }
			isSelected
			clientId="video-block"
		/>
	);
	const originalPlayer = screen.getByTitle( 'Video preview' );
	await user.click( screen.getByRole( 'button', { name: 'Trim & cut' } ) );
	expect( screen.getByTitle( 'Video preview' ) ).toBe( originalPlayer );
	await user.click( screen.getByRole( 'button', { name: 'Finish processing' } ) );
	expect( screen.getByTitle( 'Video preview' ) ).not.toBe( originalPlayer );
	expect( originalPlayer ).not.toBeInTheDocument();
	expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEmbedPreview', [
		expect.stringContaining( 'autoPlay=true' ),
	] );
	expect( setAttributes ).not.toHaveBeenCalled();
} );
