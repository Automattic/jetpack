/**
 * External dependencies
 */
import { every, get, isArray, noop, startsWith } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, FormFileUpload, DropZone, withFilters } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { keyboardReturn } from '@wordpress/icons';
import { MediaUpload, MediaUploadCheck, URLPopover } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

const InsertFromURLPopover = ( { src, onChange, onSubmit, onClose } ) => (
	<URLPopover onClose={ onClose }>
		<form className="block-editor-media-placeholder__url-input-form" onSubmit={ onSubmit }>
			<input
				className="block-editor-media-placeholder__url-input-field"
				type="url"
				aria-label={ __( 'URL', 'jetpack' ) }
				placeholder={ __( 'Paste or type URL', 'jetpack' ) }
				onChange={ onChange }
				value={ src }
			/>
			<Button
				className="block-editor-media-placeholder__url-input-submit-button"
				icon={ keyboardReturn }
				label={ __( 'Apply', 'jetpack' ) }
				type="submit"
			/>
		</form>
	</URLPopover>
);

export class MediaPlaceholder extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			src: '',
			isURLInputVisible: false,
		};
		this.onChangeSrc = this.onChangeSrc.bind( this );
		this.onSubmitSrc = this.onSubmitSrc.bind( this );
		this.onUpload = this.onUpload.bind( this );
		this.onFilesUpload = this.onFilesUpload.bind( this );
		this.openURLInput = this.openURLInput.bind( this );
		this.closeURLInput = this.closeURLInput.bind( this );
	}

	onlyAllowsImages() {
		const { allowedTypes } = this.props;
		if ( ! allowedTypes ) {
			return false;
		}
		return every( allowedTypes, allowedType => {
			return allowedType === 'image' || startsWith( allowedType, 'image/' );
		} );
	}

	componentDidMount() {
		this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
	}

	componentDidUpdate( prevProps ) {
		if ( get( prevProps.value, [ 'src' ], '' ) !== get( this.props.value, [ 'src' ], '' ) ) {
			this.setState( { src: get( this.props.value, [ 'src' ], '' ) } );
		}
	}

	onChangeSrc( event ) {
		this.setState( { src: event.target.value } );
	}

	onSubmitSrc( event ) {
		event.preventDefault();
		if ( this.state.src && this.props.onSelectURL ) {
			this.props.onSelectURL( this.state.src );
			this.closeURLInput();
		}
	}

	onUpload( event ) {
		this.onFilesUpload( event.target.files );
	}

	onFilesUpload( files ) {
		const {
			addToGallery,
			allowedTypes,
			mediaUpload,
			multiple,
			onError,
			onSelect,
			value = [],
		} = this.props;
		let setMedia;
		if ( multiple ) {
			if ( addToGallery ) {
				const currentValue = value;
				setMedia = newMedia => {
					onSelect( currentValue.concat( newMedia ) );
				};
			} else {
				setMedia = onSelect;
			}
		} else {
			setMedia = ( [ media ] ) => onSelect( media );
		}
		mediaUpload( {
			allowedTypes,
			filesList: files,
			onFileChange: setMedia,
			onError,
		} );
	}

	openURLInput() {
		this.setState( { isURLInputVisible: true } );
	}

	closeURLInput() {
		this.setState( { isURLInputVisible: false } );
	}

	renderPlaceholder( content ) {
		const { allowedTypes = [], labels = {}, onSelectURL, mediaUpload, children } = this.props;

		let instructions = labels.instructions;
		let title = labels.title;

		if ( ! mediaUpload && ! onSelectURL ) {
			instructions = __( 'To edit this block, you need permission to upload media.', 'jetpack' );
		}

		if ( instructions === undefined || title === undefined ) {
			const isOneType = 1 === allowedTypes.length;
			const isAudio = isOneType && 'audio' === allowedTypes[ 0 ];
			const isImage = isOneType && 'image' === allowedTypes[ 0 ];
			const isVideo = isOneType && 'video' === allowedTypes[ 0 ];

			if ( instructions === undefined && mediaUpload ) {
				instructions = __( 'Upload a media file or pick one from your media library.', 'jetpack' );

				if ( isAudio ) {
					instructions = __(
						'Upload an audio file, pick one from your media library, or add one with a URL.',
						'jetpack'
					);
				} else if ( isImage ) {
					instructions = __(
						'Upload an image file, pick one from your media library, or add one with a URL.',
						'jetpack'
					);
				} else if ( isVideo ) {
					instructions = __(
						'Upload a video file, pick one from your media library, or add one with a URL.',
						'jetpack'
					);
				}
			}

			if ( title === undefined ) {
				title = __( 'Media', 'jetpack' );

				if ( isAudio ) {
					title = __( 'Audio', 'jetpack' );
				} else if ( isImage ) {
					title = __( 'Image', 'jetpack' );
				} else if ( isVideo ) {
					title = __( 'Video', 'jetpack' );
				}
			}
		}

		return (
			<>
				{ content }
				{ children }
			</>
		);
	}

	renderDropZone() {
		const { disableDropZone, onHTMLDrop = noop } = this.props;

		if ( disableDropZone ) {
			return null;
		}

		return <DropZone onFilesDrop={ this.onFilesUpload } onHTMLDrop={ onHTMLDrop } />;
	}

	renderCancelLink() {
		const { onCancel } = this.props;
		return (
			onCancel && (
				<Button
					className="block-editor-media-placeholder__cancel-button"
					title={ __( 'Cancel', 'jetpack' ) }
					isLink
					onClick={ onCancel }
				>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			)
		);
	}

	renderUrlSelectionUI() {
		const { onSelectURL } = this.props;
		if ( ! onSelectURL ) {
			return null;
		}
		const { isURLInputVisible, src } = this.state;
		return (
			<div className="block-editor-media-placeholder__url-input-container">
				<Button
					className="block-editor-media-placeholder__button"
					onClick={ this.openURLInput }
					isPressed={ isURLInputVisible }
					isTertiary
				>
					{ __( 'Insert from URL', 'jetpack' ) }
				</Button>
				{ isURLInputVisible && (
					<InsertFromURLPopover
						src={ src }
						onChange={ this.onChangeSrc }
						onSubmit={ this.onSubmitSrc }
						onClose={ this.closeURLInput }
					/>
				) }
			</div>
		);
	}

	renderMediaUploadChecked() {
		const {
			accept,
			addToGallery,
			allowedTypes = [],
			isAppender,
			mediaUpload,
			multiple = false,
			onSelect,
			value = {},
		} = this.props;

		const mediaLibraryButton = (
			<MediaUpload
				addToGallery={ addToGallery }
				gallery={ multiple && this.onlyAllowsImages() }
				multiple={ multiple }
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				value={ isArray( value ) ? value.map( ( { id } ) => id ) : value.id }
				render={ ( { open } ) => {
					return (
						<Button
							isTertiary
							onClick={ event => {
								event.stopPropagation();
								open();
							} }
						>
							{ __( 'Media Library', 'jetpack' ) }
						</Button>
					);
				} }
			/>
		);

		if ( mediaUpload && isAppender ) {
			return (
				<>
					{ this.renderDropZone() }
					<FormFileUpload
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
						render={ ( { openFileDialog } ) => {
							const content = (
								<>
									<Button
										isPrimary
										className={ classnames(
											'block-editor-media-placeholder__button',
											'block-editor-media-placeholder__upload-button'
										) }
									>
										{ __( 'Upload', 'jetpack' ) }
									</Button>
									{ mediaLibraryButton }
									{ this.renderUrlSelectionUI() }
									{ this.renderCancelLink() }
								</>
							);
							return this.renderPlaceholder( content, openFileDialog );
						} }
					/>
				</>
			);
		}

		if ( mediaUpload ) {
			const content = (
				<>
					{ this.renderDropZone() }
					<FormFileUpload
						isPrimary
						className={ classnames(
							'block-editor-media-placeholder__button',
							'block-editor-media-placeholder__upload-button'
						) }
						onChange={ this.onUpload }
						accept={ accept }
						multiple={ multiple }
					>
						{ __( 'Upload', 'jetpack' ) }
					</FormFileUpload>
					{ mediaLibraryButton }
					{ this.renderUrlSelectionUI() }
					{ this.renderCancelLink() }
				</>
			);
			return this.renderPlaceholder( content );
		}

		return this.renderPlaceholder( mediaLibraryButton );
	}

	render() {
		const { disableMediaButtons } = this.props;

		if ( disableMediaButtons ) {
			return <MediaUploadCheck>{ this.renderDropZone() }</MediaUploadCheck>;
		}

		return (
			<MediaUploadCheck fallback={ this.renderPlaceholder( this.renderUrlSelectionUI() ) }>
				{ this.renderMediaUploadChecked() }
			</MediaUploadCheck>
		);
	}
}

const applyWithSelect = withSelect( select => {
	const { getSettings } = select( 'core/block-editor' );

	return {
		mediaUpload: getSettings().mediaUpload,
	};
} );

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/media-placeholder/README.md
 */
export default compose(
	applyWithSelect,
	withFilters( 'editor.MediaPlaceholder' )
)( MediaPlaceholder );
