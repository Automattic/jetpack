/**
 * External dependencies
 */
import { store as blockEditorStore, useBlockProps } from '@wordpress/block-editor';
import { createBlock, registerBlockType, getBlockType } from '@wordpress/blocks';
import { Button, TextControl, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { arrowDown, arrowUp, copy, plus, trash } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import {
	CAPTION_CUE_BLOCK_NAME,
	formatSecondsAsTimestamp,
	normalizeCueTimestamp,
	parseTimestampToSeconds,
} from '../../lib/video-tracks/cues';
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

const DEFAULT_CUE_DURATION_SECONDS = 2;

const CaptionCueEdit = ( {
	attributes,
	clientId,
	setAttributes,
}: CaptionCueEditProps ): ReactElement => {
	const { insertBlock, moveBlocksDown, moveBlocksUp, removeBlock } =
		useDispatch( blockEditorStore );
	const { index, count, rootClientId } = useSelect(
		select => {
			const { getBlockIndex, getBlockCount, getBlockRootClientId } = select( blockEditorStore );
			return {
				index: getBlockIndex( clientId ),
				count: getBlockCount(),
				rootClientId: getBlockRootClientId( clientId ),
			};
		},
		[ clientId ]
	);

	const isFirst = index <= 0;
	const isLast = index === count - 1;

	// apiVersion 3 blocks must apply useBlockProps to their root, otherwise the
	// block has no `data-block` wrapper and WritingFlow ejects focus from every
	// field. tabIndex -1 keeps the container out of the tab order so Tab lands on
	// the fields, not the cue wrapper.
	const blockProps = useBlockProps( { className: 'videopress-caption-cue', tabIndex: -1 } );

	/**
	 * Build a cue that follows this one, reusing its duration when available.
	 *
	 * @param text - Optional cue text to seed the new cue with.
	 * @return The new caption cue block.
	 */
	const createAdjacentCue = ( text = '' ) => {
		const start = parseTimestampToSeconds( attributes.startTime );
		const end = parseTimestampToSeconds( attributes.endTime );

		if ( end !== null ) {
			const duration = start !== null && end > start ? end - start : DEFAULT_CUE_DURATION_SECONDS;
			return createBlock( CAPTION_CUE_BLOCK_NAME, {
				startTime: formatSecondsAsTimestamp( end ),
				endTime: formatSecondsAsTimestamp( end + duration ),
				text,
			} );
		}

		return createBlock( CAPTION_CUE_BLOCK_NAME, { text } );
	};

	return (
		<div { ...blockProps }>
			<div className="videopress-caption-cue__toolbar">
				<span className="videopress-caption-cue__handle">
					{ sprintf(
						/* translators: %d: subtitle cue number. */
						__( 'Subtitle %d', 'jetpack-videopress-pkg' ),
						index + 1
					) }
				</span>
				<div className="videopress-caption-cue__actions">
					<Button
						size="small"
						icon={ arrowUp }
						label={ __( 'Move up', 'jetpack-videopress-pkg' ) }
						showTooltip
						disabled={ isFirst }
						onClick={ () => moveBlocksUp( [ clientId ], rootClientId ) }
					/>
					<Button
						size="small"
						icon={ arrowDown }
						label={ __( 'Move down', 'jetpack-videopress-pkg' ) }
						showTooltip
						disabled={ isLast }
						onClick={ () => moveBlocksDown( [ clientId ], rootClientId ) }
					/>
					<Button
						size="small"
						icon={ copy }
						label={ __( 'Duplicate', 'jetpack-videopress-pkg' ) }
						showTooltip
						onClick={ () =>
							insertBlock( createAdjacentCue( attributes.text ), index + 1, rootClientId )
						}
					/>
					<Button
						size="small"
						icon={ trash }
						label={ __( 'Delete subtitle', 'jetpack-videopress-pkg' ) }
						showTooltip
						isDestructive
						onClick={ () => removeBlock( clientId ) }
					/>
				</div>
			</div>
			<div className="videopress-caption-cue__body">
				<div className="videopress-caption-cue__text">
					<TextareaControl
						label={ __( 'Subtitle', 'jetpack-videopress-pkg' ) }
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
				</div>
			</div>
			<Button
				className="videopress-caption-cue__insert"
				icon={ plus }
				label={ __( 'Add subtitle below', 'jetpack-videopress-pkg' ) }
				showTooltip
				onClick={ () => insertBlock( createAdjacentCue(), index + 1, rootClientId ) }
			/>
		</div>
	);
};

/**
 * Register the subtitle cue block used by the embedded subtitle editor.
 *
 * @return Registered block settings.
 */
export function registerCaptionCueBlock() {
	if ( getBlockType( CAPTION_CUE_BLOCK_NAME ) ) {
		return getBlockType( CAPTION_CUE_BLOCK_NAME );
	}

	return registerBlockType( CAPTION_CUE_BLOCK_NAME, {
		apiVersion: 3,
		title: __( 'Subtitle cue', 'jetpack-videopress-pkg' ),
		description: __( 'A single VideoPress subtitle cue.', 'jetpack-videopress-pkg' ),
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
