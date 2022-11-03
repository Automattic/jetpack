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

const convertSecondsToTimeCode = seconds => {
	if ( ! seconds ) {
		return '00:00';
	}

	if ( seconds < 3600 ) {
		return new Date( seconds * 1000 ).toISOString().substr( 14, 5 );
	}

	return new Date( seconds * 1000 ).toISOString().substr( 11, 8 );
};

/**
 * VideoPress Chapters block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {object}                     - React component.
 */
export default function VideoPressChaptersEdit( { attributes, setAttributes } ) {
	const chapters = useChapters( attributes );

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
				{ chapters.map( ( { text, startTime }, index ) => {
					const time = convertSecondsToTimeCode( startTime );
					return (
						<li
							key={ index }
							className={ classNames( 'video-chapters__item', {
								// At block we just provide an way of user see the three states, not interact with them.
								// - Not selected
								// - Selected
								// - Hover
								selected: 0 === index,
							} ) }
						>
							<span>{ text }</span>
							<span>{ time }</span>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
