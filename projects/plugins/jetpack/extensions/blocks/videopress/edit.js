/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { isBlobURL } from '@wordpress/blob';
import {
	BaseControl,
	Button,
	PanelBody,
	SandBox,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { compose, createHigherOrderComponent, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	BlockControls,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { get, indexOf } from 'lodash';

/**
 * Internal dependencies
 */
import Loading from './loading';
import { getVideoPressUrl } from './url';
import { getClassNames } from './utils';
import SeekbarColorSettings from './seekbar-color-settings';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const VideoPressEdit = CoreVideoEdit =>
	class extends Component {
		constructor() {
			super( ...arguments );
			this.state = {
				media: null,
				isFetchingMedia: false,
				fallback: false,
				interactive: false,
				rating: null,
				lastRequestedMediaId: null,
				isUpdatingRating: false,
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

		async componentDidMount() {
			const { guid } = this.props.attributes;
			if ( ! guid ) {
				await this.setGuid();
			}

			this.setRating();
		}

		setRating = async () => {
			const id = get( this.props, 'attributes.id' );
			const media = await this.requestMedia( id );
			const rating = get( media, 'jetpack_videopress.rating' );

			if ( rating ) {
				this.setState( { rating } );
			}
		};

		async componentDidUpdate( prevProps ) {
			const { attributes, invalidateCachedEmbedPreview, preview, setAttributes, url } = this.props;

			if ( attributes.id !== prevProps.attributes.id ) {
				await this.setGuid();
				this.setRating();
			}

			if ( url && url !== prevProps.url ) {
				// Due to a current bug in Gutenberg (https://github.com/WordPress/gutenberg/issues/16831), the
				// `SandBox` component is not rendered again when the injected `html` prop changes. To work around that,
				// we invalidate the cached preview of the embed VideoPress player in order to force the rendering of a
				// new instance of the `SandBox` component that ensures the injected `html` will be rendered.
				invalidateCachedEmbedPreview( url );
			}

			if ( preview ) {
				const sandboxClassnames = getClassNames(
					preview.html,
					classnames( 'wp-block-embed', 'is-type-video', 'is-provider-videopress' ),
					false
				);

				// We set videoPressClassNames attribute to be used in ./save.js
				setAttributes( { videoPressClassNames: sandboxClassnames } );
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
				const media = await this.requestMedia( id );

				if ( null === media ) {
					return;
				}

				const guid = get( media, 'jetpack_videopress.guid' );
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

		requestMedia = async id => {
			if ( ! id ) {
				return null;
			}

			if ( null !== this.state.media && this.state.lastRequestedMediaId === id ) {
				return this.state.media;
			}

			this.setState( { isFetchingMedia: true } );
			const media = await apiFetch( { path: `/wp/v2/media/${ id }` } )
				.catch( () => {
					// Renders the fallback in the editor when there is an error fetching the media. Do not clear
					// the guid, as this would cause the placeholder to render on the frontend for posts saved in
					// this state, resulting in inconsistent behavior.
					this.setState( { fallback: true } );
					return null;
				} )
				.finally( () => {
					this.setState( { isFetchingMedia: false } );
				} );

			const { id: currentId } = this.props.attributes;
			if ( id !== currentId ) {
				// Video was changed in the editor while fetching data for the previous video;
				return null;
			}

			this.setState( { media, lastRequestedMediaId: id } );
			return media;
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

		onChangeRating = rating => {
			const { id } = this.props.attributes;
			const originalRating = this.state.rating;

			if ( ! id ) {
				return;
			}

			if ( -1 === indexOf( [ 'G', 'PG-13', 'R-17', 'X-18' ], rating ) ) {
				return;
			}

			this.setState( { isUpdatingRating: true, rating } );

			const revertSetting = () => this.setState( { rating: originalRating } );

			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: {
					id: id,
					rating: rating,
				},
			} )
				.then( result => {
					// check for wpcom status field, if set
					if ( status in result && 200 !== result.status ) {
						revertSetting();
						return;
					}
				} )
				.catch( () => revertSetting() )
				.finally( () => this.setState( { isUpdatingRating: false } ) );
		};

		render() {
			const {
				attributes,
				instanceId,
				isFetchingPreview,
				isUploading,
				preview,
				setAttributes,
			} = this.props;
			const { fallback, isFetchingMedia, isUpdatingRating, interactive, rating } = this.state;
			const { autoplay, caption, controls, loop, muted, playsinline, poster, preload } = attributes;

			const videoPosterDescription = `video-block__poster-image-description-${ instanceId }`;

			const blockSettings = (
				<Fragment>
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								className="components-icon-button components-toolbar__control"
								label={ __( 'Edit video', 'jetpack' ) }
								onClick={ this.switchToEditing }
								icon="edit"
							/>
						</ToolbarGroup>
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
							<ToggleControl
								label={ __( 'Play Inline', 'jetpack' ) }
								onChange={ this.toggleAttribute( 'playsinline' ) }
								checked={ playsinline }
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
											? sprintf(
													/* translators: Placeholder is an image URL. */
													__( 'The current poster image url is %s', 'jetpack' ),
													poster
											  )
											: __( 'There is no poster image currently selected', 'jetpack' ) }
									</p>
									{ !! poster && (
										<Button onClick={ this.onRemovePoster } isLink isDestructive>
											{ __( 'Remove Poster Image', 'jetpack' ) }
										</Button>
									) }
								</BaseControl>
							</MediaUploadCheck>
						</PanelBody>

						<SeekbarColorSettings { ...{ attributes, setAttributes } } />

						<PanelBody title={ __( 'Video File Settings', 'jetpack' ) }>
							<SelectControl
								label={ _x( 'Rating', 'The age rating for this video.', 'jetpack' ) }
								value={ rating }
								disabled={ isFetchingMedia || isUpdatingRating }
								options={ [
									{
										label: _x( 'G', 'Video rating for "General Audiences".', 'jetpack' ),
										value: 'G',
									},
									{
										label: _x(
											'PG-13',
											'Video rating for "Parental Guidance", unsuitable for children under 13.',
											'jetpack'
										),
										value: 'PG-13',
									},
									{
										label: _x(
											'R',
											'Video rating for "Restricted", not recommended for children under 17.',
											'jetpack'
										),
										value: 'R-17',
									},
									{
										label: _x( 'X', 'Video rating for "Explicit" content.', 'jetpack' ),
										value: 'X-18',
									},
								] }
								onChange={ this.onChangeRating }
							/>
						</PanelBody>
					</InspectorControls>
				</Fragment>
			);

			const isFetching = ! isUploading && ( isFetchingMedia || isFetchingPreview );
			const useCoreVideo = ! isUploading && ! isFetching && ( fallback || ! preview );
			const useCoreVideoOrLoading = isUploading || isFetching || useCoreVideo;

			// In order for the media placeholder to keep its state for error messages, we need to keep the CoreVideoEdit component in the tree
			if ( useCoreVideoOrLoading ) {
				return (
					<Fragment>
						<div className={ ! isUploading && ! isFetching ? 'videopress-block-hide' : '' }>
							{ blockSettings }
							<Loading
								text={
									isUploading
										? __( 'Uploading…', 'jetpack' )
										: __( 'Generating preview…', 'jetpack' )
								}
							/>
						</div>
						<div className={ ! useCoreVideo ? 'videopress-block-hide' : '' }>
							<CoreVideoEdit { ...this.props } />;
						</div>
					</Fragment>
				);
			}

			const { html, scripts } = preview;

			// Disabled because the overlay div doesn't actually have a role or functionality
			// as far as the user is concerned. We're just catching the first click so that
			// the block can be selected without interacting with the embed preview that the overlay covers.
			/* eslint-disable jsx-a11y/no-static-element-interactions */
			return (
				<Fragment>
					{ blockSettings }
					<VpBlock
						{ ...this.props }
						hideOverlay={ this.hideOverlay }
						html={ html }
						scripts={ scripts }
						interactive={ interactive }
						caption={ caption }
					/>
				</Fragment>
			);
		}
	};

// The actual, final rendered video player markup
// In a separate function component so that `useBlockProps` could be called.
const VpBlock = props => {
	const {
		html,
		scripts,
		interactive,
		caption,
		isSelected,
		hideOverlay,
		attributes,
		setAttributes,
	} = props;

	const { align, className, videoPressClassNames } = attributes;

	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-video', className, videoPressClassNames, {
			[ `align${ align }` ]: align,
		} ),
	} );

	return (
		<figure { ...blockProps }>
			<div className="wp-block-embed__wrapper">
				<SandBox html={ html } scripts={ scripts } type={ videoPressClassNames } />
			</div>

			{
				/*
					Disable the video player when the block isn't selected,
					so the user clicking on it won't play the
					video when the controls are enabled.
				*/
				! interactive && (
					<div className="block-library-embed__interactive-overlay" onMouseUp={ hideOverlay } />
				)
			}
			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…', 'jetpack' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
};

export default createHigherOrderComponent(
	compose( [
		withSelect( ( select, ownProps ) => {
			const {
				autoplay,
				controls,
				guid,
				loop,
				muted,
				playsinline,
				poster,
				preload,
				seekbarColor,
				seekbarLoadingColor,
				seekbarPlayedColor,
				src,
			} = ownProps.attributes;
			const { getEmbedPreview, isRequestingEmbedPreview } = select( 'core' );

			const url = getVideoPressUrl( guid, {
				autoplay,
				controls,
				loop,
				muted,
				playsinline,
				poster,
				preload,
				seekbarColor,
				seekbarLoadingColor,
				seekbarPlayedColor,
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
