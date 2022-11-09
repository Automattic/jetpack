// Disabling temporarily
/* eslint-disable no-unused-vars */

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import classNames from 'classnames';
import VideoPressChaptersInspectorControls from './components/inspector-controls';
import useChapters from './hooks/use-chapters';
import './editor.scss';

/**
 * VideoPress Chapters block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected     - Whether the block is selected.
 * @param {string} props.clientId        - Block client ID.
 * @returns {object}                     - React component.
 */
export default function VideoPressChaptersEdit( {
	attributes,
	setAttributes,
	isSelected,
	clientId,
} ) {
	const chapters = useChapters();

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-video-chapters',
	} );

	return (
		<div { ...blockProps }>
			<VideoPressChaptersInspectorControls
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>

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
	);
}
