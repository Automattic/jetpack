/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	IconButton,
	PanelBody,
	SandBox,
	SelectControl,
	ToggleControl,
	Toolbar,
} from '@wordpress/components';
import { compose, createHigherOrderComponent, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Loading from './loading';
import { getVideoPressUrl } from './url';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

// For Gutenberg versions that support it, use the figure block wrapper (from '@wordpress/block-editor')
// to wrap the VideoPress component the same way the underlying `core/video` block is wrapped.
// (Otherwise there's an issue with Gutenberg >= 8.1 where the VideoPress block becomes unselectable,
// see https://github.com/Automattic/jetpack/issues/15922.)
const BlockFigureWrapper = Block ? Block.figure : 'figure';

const VideoPressEdit = CoreVideoEdit =>
	class extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				media: null,
				isFetchingMedia: false,
				fallback: false,
				interactive: false,
			};
			this.posterImageButton = createRef();
		}

		static getDerivedStateFromProps( nextProps, state ) {
			if ( ! nextProps.isSelected && state.interactive ) {
				// We only want to change this when the block is not selected, because changing it when
				// the block becomes selected makes the overlap disappear too early. Hiding the overlay
				// happens on mouseup when the overlay is clicked.
				return { interactive: false };
			}

			return null;
		}

		hideOverlay = () => {
			// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
			// changing, because that happens on mouse down, and the overlay immediately disappears,
			// and the mouse event can end up in the preview content. We can't use onClick on
			// the overlay to hide it either, because then the editor misses the mouseup event, and
			// thinks we're multi-selecting blocks.
			this.setState( { interactive: true } );
		};

		componentDidMount() {
			const { guid } = this.props.attributes;
			if ( ! guid ) {
				this.setGuid();
			}
		}

		componentDidUpdate( prevProps ) {
			const { attributes, invalidateCachedEmbedPreview, url } = this.props;

			if ( attributes.id !== prevProps.attributes.id ) {
				this.setGuid();
			}

			if ( url && url !== prevProps.url ) {
				// Due to a current bug in Gutenberg (https://github.com/WordPress/gutenberg/issues/16831), the
				// `SandBox` component is not rendered again when the injected `html` prop changes. To work around that,
				// we invalidate the cached preview of the embed VideoPress player in order to force the rendering of a
				// new instance of the `SandBox` component that ensures the injected `html` will be rendered.
				invalidateCachedEmbedPreview( url );
			}
		}

		fallbackToCore = () => {
			this.props.setAttributes( { guid: undefined } );
			this.setState( { fallback: true } );
		};

		setGuid = async () => {
			const { attributes, setAttributes } = this.props;
			const { id } = attributes;

			if ( ! id ) {
				setAttributes( { guid: undefined } );
				return;
			}

			try {
				this.setState( { isFetchingMedia: true } );
				const media = await apiFetch( { path: `/wp/v2/media/${ id }` } );
				this.setState( { isFetchingMedia: false } );

				const { id: currentId } = this.props.attributes;
				if ( id !== currentId ) {
					// Video was changed in the editor while fetching data for the previous video;
					return;
				}

				this.setState( { media } );
				const guid = get( media, 'jetpack_videopress_guid' );
				if ( guid ) {
					setAttributes( { guid } );
				} else {
					this.fallbackToCore();
				}
			} catch ( e ) {
				this.setState( { isFetchingMedia: false } );
				this.fallbackToCore();
			}
		};

		switchToEditing = () => {
			this.props.setAttributes( {
				id: undefined,
				guid: undefined,
				src: undefined,
			} );
		};

		onSelectPoster = image => {
			const { setAttributes } = this.props;
			setAttributes( { poster: image.url } );
		};

		onRemovePoster = () => {
			const { setAttributes } = this.props;
			setAttributes( { poster: '' } );

			// Move focus back to the Media Upload button.
			this.posterImageButton.current.focus();
		};

		toggleAttribute = attribute => {
			return newValue => {
				this.props.setAttributes( { [ attribute ]: newValue } );
			};
		};

		getAutoplayHelp = checked => {
			return checked
				? __( 'Note: Autoplaying videos may cause usability issues for some visitors.', 'jetpack' )
				: null;
		};

		render() {
			const {
				attributes,
				className,
				instanceId,
				isFetchingPreview,
				isSelected,
				isUploading,
				preview,
				setAttributes,
			} = this.props;
			const { fallback, isFetchingMedia, interactive } = this.state;
			const { autoplay, caption, controls, loop, muted, poster, preload } = attributes;

			const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;

			const blockSettings = (
				<Fragment>
					<BlockControls>
						<Toolbar>
							<IconButton
								className="components-icon-button components-toolbar__control"
								label={ __( 'Edit video', 'jetpack' ) }
								onClick={ this.switchToEditing }
								icon="edit"
							/>
						</Toolbar>
					</BlockControls>
					<InspectorControls>
						<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
							<ToggleControl
								label={ __( 'Autoplay', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'autoplay' ) }
								checked={ autoplay }
								help={ this.getAutoplayHelp }
							/>
							<ToggleControl
								label={ __( 'Loop', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'loop' ) }
								checked={ loop }
							/>
							<ToggleControl
								label={ __( 'Muted', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'muted' ) }
								checked={ muted }
							/>
							<ToggleControl
								label={ __( 'Playback Controls', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'controls' ) }
								checked={ controls }
							/>
							<SelectControl
								label={ __( 'Preload', 'jetpack' ) }
								value={ preload }
								onChange={ value => setAttributes( { preload: value } ) }
								options={ [
									{ value: 'auto', label: _x( 'Auto', 'VideoPress preload setting', 'jetpack' ) },
									{
										value: 'metadata',
										label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack' ),
									},
									{ value: 'none', label: _x( 'None', 'VideoPress preload setting', 'jetpack' ) },
								] }
							/>
							<MediaUploadCheck>
								<BaseControl
									className="editor-video-poster-control"
									label={ __( 'Poster Image', 'jetpack' ) }
								>
									<MediaUpload
										title={ __( 'Select Poster Image', 'jetpack' ) }
										onSelect={ this.onSelectPoster }
										allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
										render={ ( { open } ) => (
											<Button
												isDefault
												onClick={ open }
												ref={ this.posterImageButton }
												aria-describedby={ videoPosterDescription }
											>
												{ ! poster
													? __( 'Select Poster Image', 'jetpack' )
													: __( 'Replace image', 'jetpack' ) }
											</Button>
										) }
									/>
									<p id={ videoPosterDescription } hidden>
										{ poster
											? sprintf( __( 'The current poster image url is %s', 'jetpack' ), poster )
											: __( 'There is no poster image currently selected', 'jetpack' ) }
									</p>
									{ !! poster && (
										<Button onClick={ this.onRemovePoster } isLink isDestructive>
											{ __( 'Remove Poster Image' ) }
										</Button>
									) }
								</BaseControl>
							</MediaUploadCheck>
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);

			if ( isUploading ) {
				return (
					<Fragment>
						{ blockSettings }
						<Loading text={ __( 'Uploading…', 'jetpack' ) } />
					</Fragment>
				);
			}

			if ( isFetchingMedia || isFetchingPreview ) {
				return (
					<Fragment>
						{ blockSettings }
						<Loading text={ __( 'Generating preview…', 'jetpack' ) } />
					</Fragment>
				);
			}

			if ( fallback || ! preview ) {
				return <CoreVideoEdit { ...this.props } />;
			}

			const { html, scripts } = preview;

			// Disabled because the overlay div doesn't actually have a role or functionality
			// as far as the user is concerned. We're just catching the first click so that
			// the block can be selected without interacting with the embed preview that the overlay covers.
			/* eslint-disable jsx-a11y/no-static-element-interactions */
			return (
				<Fragment>
					{ blockSettings }
					<BlockFigureWrapper
						className={ classnames( className, 'wp-block-embed', 'is-type-video' ) }
					>
						<div className="wp-block-embed__wrapper">
							<SandBox html={ html } scripts={ scripts } />
						</div>

						{ /*
							Disable the video player when the block isn't selected,
							so the user clicking on it won't play the
							video when the controls are enabled.
						*/
						! interactive && (
							<div
								className="block-library-embed__interactive-overlay"
								onMouseUp={ this.hideOverlay }
							/>
						) }
						{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
							<RichText
								tagName="figcaption"
								placeholder={ __( 'Write caption…', 'jetpack' ) }
								value={ caption }
								onChange={ value => setAttributes( { caption: value } ) }
								inlineToolbar
							/>
						) }
					</BlockFigureWrapper>
				</Fragment>
			);
		}
	};

export default createHigherOrderComponent(
	compose( [
		withSelect( ( select, ownProps ) => {
			const { autoplay, controls, guid, loop, muted, poster, preload, src } = ownProps.attributes;
			const { getEmbedPreview, isRequestingEmbedPreview } = select( 'core' );

			const url = getVideoPressUrl( guid, {
				autoplay,
				controls,
				loop,
				muted,
				poster,
				preload,
			} );
			const preview = !! url && getEmbedPreview( url );

			const isFetchingEmbedPreview = !! url && isRequestingEmbedPreview( url );
			const isUploading = isBlobURL( src );

			return {
				isFetchingPreview: isFetchingEmbedPreview,
				isUploading,
				preview,
				url,
			};
		} ),
		withDispatch( dispatch => {
			const invalidateCachedEmbedPreview = url => {
				dispatch( 'core/data' ).invalidateResolution( 'core', 'getEmbedPreview', [ url ] );
			};
			return {
				invalidateCachedEmbedPreview,
			};
		} ),
		withInstanceId,
		VideoPressEdit,
	] ),
	'withVideoPressEdit'
);
