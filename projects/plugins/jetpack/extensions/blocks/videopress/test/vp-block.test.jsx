import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import withVideoPressEdit, { VpBlock } from '../edit';

const mockSandBoxProps = jest.fn();

jest.mock( '@automattic/jetpack-shared-extension-utils/icons', () => ( {
	VideoPressIcon: () => null,
} ) );

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@wordpress/blob', () => ( { isBlobURL: jest.fn() } ) );
jest.mock( '@wordpress/block-editor', () => {
	const React = jest.requireActual( 'react' );
	const RichText = () => null;
	RichText.isEmpty = value => ! value;

	return {
		BlockControls: ( { children } ) => React.createElement( React.Fragment, null, children ),
		InspectorControls: ( { children } ) => React.createElement( React.Fragment, null, children ),
		MediaUpload: () => null,
		MediaUploadCheck: ( { children } ) => React.createElement( React.Fragment, null, children ),
		RichText,
		useBlockProps: props => props,
	};
} );
jest.mock( '@wordpress/components', () => {
	const React = jest.requireActual( 'react' );
	const EmptyComponent = () => null;

	return {
		BaseControl: EmptyComponent,
		Button: EmptyComponent,
		PanelBody: EmptyComponent,
		ResizableBox: ( { children } ) => React.createElement( 'div', null, children ),
		SandBox: props => {
			mockSandBoxProps( props );
			return React.createElement( 'div', { 'data-testid': 'sandbox' } );
		},
		SelectControl: EmptyComponent,
		ToggleControl: EmptyComponent,
		ToolbarButton: EmptyComponent,
		ToolbarGroup: EmptyComponent,
		Tooltip: EmptyComponent,
	};
} );
jest.mock( '@wordpress/compose', () => ( {
	compose: hocs => hocs[ hocs.length - 1 ],
	createHigherOrderComponent: transform => transform,
	usePrevious: jest.fn(),
	withInstanceId: component => component,
} ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	withDispatch: () => component => component,
	withSelect: () => component => component,
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	_x: text => text,
	sprintf: text => text,
} ) );
jest.mock( '@wordpress/icons', () => ( { Icon: () => null } ) );
jest.mock( '@wordpress/ui', () => ( { Link: () => null } ) );
jest.mock( '../components', () => ( { VideoPressBlockProvider: ( { children } ) => children } ) );
jest.mock( '../loading', () => () => null );
jest.mock( '../resumable-upload', () => () => null );
jest.mock( '../seekbar-color-settings', () => () => null );
jest.mock( '../tracks-editor', () => () => null );
jest.mock( '../uploading-editor', () => ( { UploadingEditor: () => null } ) );
jest.mock( '../url', () => ( { getVideoPressUrl: jest.fn() } ) );
jest.mock( '../utils', () => ( {
	getClassNames: jest.fn(),
	removeFileNameExtension: jest.fn(),
} ) );

describe( 'VpBlock', () => {
	beforeEach( () => {
		mockSandBoxProps.mockClear();
		delete window.videopressAjax;
		delete window.videoPressEditorState;
	} );

	it( 'renders the legacy preview in a same-origin sandbox', () => {
		render(
			<VpBlock
				attributes={ {
					align: undefined,
					className: '',
					maxWidth: '100%',
					videoPressClassNames: 'wp-video-shortcode',
				} }
				caption=""
				hideOverlay={ jest.fn() }
				html="<iframe src='https://videopress.com/e/example' />"
				interactive
				isSelected={ false }
				scripts={ [ 'https://example.com/preview.js' ] }
				setAttributes={ jest.fn() }
				shouldRenderLoadingBlock={ false }
			/>
		);

		expect( screen.getByTestId( 'sandbox' ) ).toBeInTheDocument();
		expect( mockSandBoxProps ).toHaveBeenCalledWith(
			expect.objectContaining( {
				allowSameOrigin: true,
				scripts: [ 'https://example.com/preview.js' ],
			} )
		);
	} );
} );

describe( 'VideoPressEdit setTracks', () => {
	const VideoPressEdit = withVideoPressEdit( () => null );
	const storedTracks = [
		{ src: 'auto_en.vtt', kind: 'subtitles', srcLang: 'en', label: 'English' },
	];

	it.each( [
		[ 'leaves equal tracks alone', storedTracks, false ],
		[ 'writes changed tracks', [], true ],
	] )( '%s', async ( _name, videoPressTracks, shouldWrite ) => {
		apiFetch.mockResolvedValue( {
			tracks: { subtitles: { en: { src: 'auto_en.vtt', label: 'English' } } },
		} );
		const setAttributes = jest.fn();
		const edit = new VideoPressEdit( { attributes: { videoPressTracks }, setAttributes } );

		edit.setTracks( 'abcd1234' );
		await new Promise( process.nextTick );

		expect( setAttributes.mock.calls ).toEqual(
			shouldWrite ? [ [ { videoPressTracks: storedTracks } ] ] : []
		);
	} );
} );
