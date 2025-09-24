/**
 * External dependencies
 */
import { MediaEditor } from '@automattic/jetpack-media-editor';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
/**
 * WordPress dependencies
 */
import { Notice, PanelBody, Button, Modal } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar.js';
import type { BlockInstance } from '@wordpress/blocks';
import './style.scss';

type MediaSource = 'block' | 'featured' | null;

type SelectionState = {
	attachmentId: number | null;
	selectedBlockName: string | null;
	hasSelectedBlock: boolean;
	selectedBlockIsSupported: boolean;
	source: MediaSource;
	isViewable: boolean;
	supportsFeaturedMedia: boolean;
};

type PostType = {
	viewable?: boolean;
	supports?: Record< string, unknown > | string[];
};

type MediaBlockAttributes = {
	id?: unknown;
	mediaId?: unknown;
	ids?: unknown;
};

const SUPPORTED_MEDIA_BLOCKS = new Set< string >( [
	'core/image',
	'core/cover',
	'core/media-text',
	'core/gallery',
	'core/video',
	'core/audio',
	'core/file',
	'jetpack/tiled-gallery',
] );

const DIRECT_ID_BLOCKS = new Set< string >( [
	'core/image',
	'core/cover',
	'core/video',
	'core/audio',
	'core/file',
] );

const isSupportedMediaBlock = ( blockName?: string | null ): boolean => {
	return !! ( blockName && SUPPORTED_MEDIA_BLOCKS.has( blockName ) );
};

const toAttachmentId = ( value: unknown ): number | null => {
	if ( typeof value === 'number' && Number.isFinite( value ) && value > 0 ) {
		return value;
	}

	if ( typeof value === 'string' ) {
		const parsed = parseInt( value, 10 );
		if ( Number.isFinite( parsed ) && parsed > 0 ) {
			return parsed;
		}
	}

	return null;
};

const getAttachmentIdFromBlock = ( block?: BlockInstance | null ): number | null => {
	if ( ! block || ! isSupportedMediaBlock( block.name ) ) {
		return null;
	}

	const attributes = ( block.attributes ?? {} ) as MediaBlockAttributes;

	if ( DIRECT_ID_BLOCKS.has( block.name ) ) {
		return toAttachmentId( attributes.id ?? null );
	}

	if ( block.name === 'core/media-text' ) {
		return toAttachmentId( attributes.mediaId ?? null );
	}

	if ( block.name === 'core/gallery' || block.name === 'jetpack/tiled-gallery' ) {
		const ids = attributes.ids;
		if ( Array.isArray( ids ) && ids.length > 0 ) {
			return toAttachmentId( ids[ 0 ] );
		}
		return null;
	}

	return null;
};

const postTypeSupports = ( postType: PostType | undefined, support: string ): boolean => {
	if ( ! postType ) {
		return false;
	}

	const supports = postType.supports;

	if ( Array.isArray( supports ) ) {
		return supports.includes( support );
	}

	if ( supports && typeof supports === 'object' ) {
		return Boolean( ( supports as Record< string, unknown > )[ support ] );
	}

	return false;
};

const useMediaSelectionState = (): SelectionState => {
	return useSelect( select => {
		const editor = select( editorStore );
		const core = select( coreStore );

		const postTypeName = editor.getCurrentPostType();
		const postTypeObject = ( postTypeName ? core.getPostType( postTypeName ) : undefined ) as
			| PostType
			| undefined;
		const selectedBlock = editor.getSelectedBlock();
		const blockAttachmentId = getAttachmentIdFromBlock( selectedBlock );
		const featuredMediaValue = editor.getEditedPostAttribute( 'featured_media' );
		const featuredMediaId = toAttachmentId( featuredMediaValue );

		let source: MediaSource = null;
		if ( blockAttachmentId ) {
			source = 'block';
		} else if ( featuredMediaId ) {
			source = 'featured';
		}

		const attachmentId = blockAttachmentId ?? featuredMediaId ?? null;

		return {
			attachmentId,
			selectedBlockName: selectedBlock?.name ?? null,
			hasSelectedBlock: Boolean( selectedBlock ),
			selectedBlockIsSupported: isSupportedMediaBlock( selectedBlock?.name ),
			source,
			isViewable: Boolean( postTypeObject?.viewable ),
			supportsFeaturedMedia: postTypeSupports( postTypeObject, 'thumbnail' ),
		};
	}, [] );
};

const getSourceLabel = ( source: MediaSource ): string => {
	switch ( source ) {
		case 'featured':
			return __( 'Featured image', 'jetpack' );
		case 'block':
			return __( 'Selected block', 'jetpack' );
		default:
			return '';
	}
};

const getEmptyStateMessage = ( state: SelectionState ): string => {
	if ( state.hasSelectedBlock && ! state.selectedBlockIsSupported ) {
		return __(
			'Select an image, video, audio, or gallery block to edit it with Jetpack Media Editor.',
			'jetpack'
		);
	}

	if ( state.hasSelectedBlock && state.selectedBlockIsSupported && ! state.attachmentId ) {
		return __(
			'Select media from the Media Library to enable Jetpack Media Editor for this block.',
			'jetpack'
		);
	}

	if ( state.supportsFeaturedMedia ) {
		return __( 'Select a media block or assign a featured image to start editing.', 'jetpack' );
	}

	return __(
		'Add a supported media block to the post to start editing with Jetpack Media Editor.',
		'jetpack'
	);
};

export default function MediaEditorPluginSidebar() {
	const state = useMediaSelectionState();
	const { attachmentId, isViewable, source } = state;
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const openModal = useCallback( () => {
		setIsModalOpen( true );
	}, [] );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	if ( ! isViewable ) {
		return null;
	}

	const hasAttachment = Boolean( attachmentId );

	const panelClassName = [
		'jetpack-media-editor-plugin__panel',
		! hasAttachment ? 'jetpack-media-editor-plugin__panel--empty' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<JetpackPluginSidebar>
			<PanelBody
				className={ panelClassName }
				title={ __( 'Jetpack Media Editor', 'jetpack' ) }
				initialOpen
				icon={ <JetpackEditorPanelLogo /> }
			>
				{ ! hasAttachment && (
					<Notice
						className="jetpack-media-editor-plugin__notice"
						status="info"
						isDismissible={ false }
					>
						{ getEmptyStateMessage( state ) }
					</Notice>
				) }

				{ hasAttachment && (
					<div className="jetpack-media-editor-plugin__content">
						{ source && (
							<p className="jetpack-media-editor-plugin__source">
								{ sprintf(
									/* translators: %s is the context describing which media is being edited. */
									__( 'Editing: %s', 'jetpack' ),
									getSourceLabel( source )
								) }
							</p>
						) }

						<div className="jetpack-media-editor-plugin__editor">
							<MediaEditor postId={ String( attachmentId ) } isPreview />
						</div>

						<div className="jetpack-media-editor-plugin__actions">
							<Button variant="secondary" onClick={ openModal }>
								{ __( 'Open media editor', 'jetpack' ) }
							</Button>
						</div>
					</div>
				) }
			</PanelBody>

			{ isModalOpen && hasAttachment && (
				<Modal
					className="jetpack-media-editor-plugin__modal"
					onRequestClose={ closeModal }
					title={ __( 'Jetpack Media Editor', 'jetpack' ) }
					isFullScreen
					shouldCloseOnClickOutside={ false }
					scrollable={ true }
				>
					<div className="jetpack-media-editor-plugin__modal-editor">
						<MediaEditor key={ attachmentId } postId={ String( attachmentId ) } />
					</div>
				</Modal>
			) }
		</JetpackPluginSidebar>
	);
}
