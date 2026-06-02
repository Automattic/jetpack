/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { registerBlockType, getBlockType } from '@wordpress/blocks';
import { Button, TextControl, TextareaControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { CAPTION_CUE_BLOCK_NAME, normalizeCueTimestamp } from '../../lib/video-tracks/cues';
/**
 * Types
 */
import type { ReactElement } from 'react';

type CaptionCueBlockAttributes = {
	startTime: string;
	endTime: string;
	text: string;
};

type CaptionCueEditProps = {
	attributes: CaptionCueBlockAttributes;
	clientId: string;
	setAttributes: ( attributes: Partial< CaptionCueBlockAttributes > ) => void;
};

const CaptionCueEdit = ( {
	attributes,
	clientId,
	setAttributes,
}: CaptionCueEditProps ): ReactElement => {
	const { removeBlock } = useDispatch( blockEditorStore );

	return (
		<div className="videopress-caption-cue">
			<div className="videopress-caption-cue__text">
				<TextareaControl
					label={ __( 'Caption', 'jetpack-videopress-pkg' ) }
					value={ attributes.text }
					onChange={ text => setAttributes( { text } ) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
			<div className="videopress-caption-cue__times">
				<TextControl
					label={ __( 'Start', 'jetpack-videopress-pkg' ) }
					value={ attributes.startTime }
					onChange={ startTime => setAttributes( { startTime } ) }
					onBlur={ () =>
						setAttributes( {
							startTime: normalizeCueTimestamp( attributes.startTime ) || attributes.startTime,
						} )
					}
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<TextControl
					label={ __( 'End', 'jetpack-videopress-pkg' ) }
					value={ attributes.endTime }
					onChange={ endTime => setAttributes( { endTime } ) }
					onBlur={ () =>
						setAttributes( {
							endTime: normalizeCueTimestamp( attributes.endTime ) || attributes.endTime,
						} )
					}
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<Button
					icon={ trash }
					label={ __( 'Delete cue', 'jetpack-videopress-pkg' ) }
					onClick={ () => removeBlock( clientId ) }
					variant="tertiary"
					isDestructive
				/>
			</div>
		</div>
	);
};

/**
 * Register the caption cue block used by the embedded caption editor.
 *
 * @return Registered block settings.
 */
export function registerCaptionCueBlock() {
	if ( getBlockType( CAPTION_CUE_BLOCK_NAME ) ) {
		return getBlockType( CAPTION_CUE_BLOCK_NAME );
	}

	return registerBlockType( CAPTION_CUE_BLOCK_NAME, {
		apiVersion: 3,
		title: __( 'Caption cue', 'jetpack-videopress-pkg' ),
		description: __( 'A single VideoPress caption cue.', 'jetpack-videopress-pkg' ),
		category: 'text',
		attributes: {
			startTime: {
				type: 'string',
				default: '00:00:00.000',
			},
			endTime: {
				type: 'string',
				default: '00:00:02.000',
			},
			text: {
				type: 'string',
				default: '',
			},
		},
		supports: {
			html: false,
			inserter: false,
			reusable: false,
		},
		edit: CaptionCueEdit,
		save: () => null,
	} );
}
