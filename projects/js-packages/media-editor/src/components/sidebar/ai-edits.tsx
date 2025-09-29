/**
 * External dependencies
 */
import { Fragment, useMemo } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { Button, __experimentalHeading as Heading, Notice, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useMediaEditorState, AiVariant } from '../provider/with-media-editor-state-provider';

const VARIANT_IMG_SIZE = 96;

export default function AiEditsPanel() {
	const currentAttachmentId = useEntityId( 'postType', 'attachment' );
	const {
		aiVariants,
		acceptAiVariant,
		discardAiVariant,
		setActiveAiVariantId,
		setAiEditedImageUrl,
	} = useMediaEditorState();
	const { invalidateResolution } = useDispatch( coreStore ) as any;

	const pendingVariants = useMemo(
		() => aiVariants.filter( variant => variant.status === 'pending' ),
		[ aiVariants ]
	);

	if ( pendingVariants.length === 0 ) {
		return null;
	}

	const handlePreview = ( variant: AiVariant ) => {
		setActiveAiVariantId( variant.id );
		setAiEditedImageUrl( variant.url );
	};

	const handleAccept = ( variant: AiVariant ) => {
		acceptAiVariant( variant.id );
		if ( variant.attachmentId ) {
			invalidateResolution( 'getEntityRecord', [ 'postType', 'attachment', variant.attachmentId ] );

			// Navigation removed - WordPress admin handles this differently
			// In WordPress admin, we might refresh the page or use other navigation methods
		}
	};

	const handleDiscard = ( variant: AiVariant ) => {
		discardAiVariant( variant.id );
	};

	return (
		<div className="next-admin-media-editor-ai-edits">
			<Heading level={ 3 } size={ 11 } upperCase>
				{ __( 'AI Edits', 'media-editor' ) }
			</Heading>
			<Notice status="info" isDismissible={ false }>
				{ __( 'Select a generated image to preview, then accept or discard it.', 'media-editor' ) }
			</Notice>
			<Flex direction="column" gap={ 3 }>
				{ pendingVariants.map( variant => (
					<Fragment key={ variant.id }>
						<div className="next-admin-media-editor-ai-edits__item">
							<div className="next-admin-media-editor-ai-edits__item-preview">
								<img
									src={ variant.url }
									alt={ variant.altText || __( 'AI generated preview', 'media-editor' ) }
									width={ VARIANT_IMG_SIZE }
									height={ VARIANT_IMG_SIZE }
								/>
							</div>
							<div className="next-admin-media-editor-ai-edits__item-content">
								<strong>{ variant.summary || __( 'AI edit', 'media-editor' ) }</strong>
								<div className="next-admin-media-editor-ai-edits__item-actions">
									<Button variant="secondary" onClick={ () => handlePreview( variant ) }>
										{ __( 'Preview', 'media-editor' ) }
									</Button>
									<Button variant="primary" onClick={ () => handleAccept( variant ) }>
										{ __( 'Accept', 'media-editor' ) }
									</Button>
									<Button
										variant="tertiary"
										isDestructive
										onClick={ () => handleDiscard( variant ) }
									>
										{ __( 'Discard', 'media-editor' ) }
									</Button>
								</div>
							</div>
						</div>
					</Fragment>
				) ) }
			</Flex>
		</div>
	);
}
