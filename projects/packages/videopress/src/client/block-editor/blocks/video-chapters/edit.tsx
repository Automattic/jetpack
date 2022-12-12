/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import classNames from 'classnames';
import VideoBlockSelectControl from './components/video-block-select-control';
import useChapters from './hooks/use-chapters';
import './editor.scss';
/**
 * Types
 */
import { PersistentBlockLinkIdProp, VideoChaptersBlockPropertiesProps } from './types';
import type React from 'react';

/**
 * VideoPress Chapters block Edit react components
 *
 * @param {VideoChaptersBlockPropertiesProps} props - Component props.
 * @returns {React.ReactElement}                      React component.
 */
export default function VideoPressChaptersEdit( {
	attributes,
	setAttributes,
}: VideoChaptersBlockPropertiesProps ) {
	const { persistentBlockLinkId } = attributes;
	const chapters = useChapters();

	const { updateBlockAttributes } = dispatch( blockEditorStore );

	const handleAttributeChange = useCallback(
		attributeName => {
			return newValue => {
				setAttributes( { [ attributeName ]: newValue } );
			};
		},
		[ setAttributes ]
	);

	const handleLinkingToVideoBlock = useCallback(
		( videoBlockClientId: PersistentBlockLinkIdProp ) => {
			// Define the new link id
			const newPersistentBlockLinkId = `link-${ videoBlockClientId }`;

			// Update the video block attribute
			updateBlockAttributes( videoBlockClientId, {
				persistentBlockLinkId: newPersistentBlockLinkId,
			} );

			// Update the video-chapters block attribute
			setAttributes( { persistentBlockLinkId: newPersistentBlockLinkId } );
		},
		[ handleAttributeChange ]
	);

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-video-chapters',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
					<VideoBlockSelectControl
						linkId={ persistentBlockLinkId }
						onChange={ handleLinkingToVideoBlock }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<ul className="video-chapters_list">
					{ chapters.map( ( { chapter, time }, index ) => (
						<li
							key={ index }
							className={ classNames( 'video-chapters__item', {
								selected: 0 === index,
							} ) }
						>
							<span>{ chapter }</span>
							<span>{ time }</span>
						</li>
					) ) }
				</ul>
			</div>
		</>
	);
}
