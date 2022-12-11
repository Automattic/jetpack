/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
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
import { VideoChaptersBlockPropertiesProps } from './types';
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

	const handleAttributeChange = useCallback(
		attributeName => {
			return newValue => {
				setAttributes( { [ attributeName ]: newValue } );
			};
		},
		[ setAttributes ]
	);

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-video-chapters',
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
					<VideoBlockSelectControl
						value={ persistentBlockLinkId }
						onChange={ handleAttributeChange( 'videoPressBlockId' ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<ul className="video-chapters_list">
					{ chapters.map( ( { chapter, time }, index ) => (
						<li
							className={ classNames( 'video-chapters__item', {
								// At block we just provide an way of user see the three states, not interact with them.
								// - Not selected
								// - Selected
								// - Hover
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
