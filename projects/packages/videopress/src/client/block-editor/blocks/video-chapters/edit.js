// Disabling temporarily
/* eslint-disable no-unused-vars */

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
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
	const { chapters, currentChapter, play, seek } = useChapters( attributes );

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
								selected: Number( currentChapter.id ) === index + 1,
							} ) }
						>
							<Button
								className="video-chapters__button"
								variant="tertiary"
								onClick={ () => {
									seek( startTime );
									play();
								} }
							>
								<div className="video-chapters__text">{ text }</div>
								<div className="video-chapters__time">{ time }</div>
							</Button>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
