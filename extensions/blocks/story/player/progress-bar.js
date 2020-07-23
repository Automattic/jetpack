/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Bullet } from './components';

export const ProgressBar = ( {
	slides,
	fullscreen,
	currentSlideIndex,
	currentSlideProgress,
	onSlideSeek,
} ) => {
	return (
		<div className="wp-story-pagination wp-story-pagination-bullets">
			{ slides.map( ( slide, index ) => {
				let progress;
				if ( index < currentSlideIndex ) {
					progress = 100;
				} else if ( index > currentSlideIndex ) {
					progress = 0;
				} else {
					progress = currentSlideProgress;
				}
				const onClick = () => {
					if ( ! fullscreen ) {
						return null;
					}
					onSlideSeek( index );
				};
				return <Bullet key={ index } index={ index } progress={ progress } onClick={ onClick } />;
			} ) }
		</div>
	);
};

export default ProgressBar;
