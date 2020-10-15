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
		<div className="wp-story-pagination wp-story-pagination-bullets" role="tablist">
			{ slides.map( ( slide, index ) => {
				let progress;
				if ( index < currentSlideIndex ) {
					progress = 100;
				} else if ( index > currentSlideIndex ) {
					progress = 0;
				} else {
					progress = currentSlideProgress;
				}
				return (
					<Bullet
						key={ index }
						index={ index }
						progress={ progress }
						disabled={ ! fullscreen }
						isSelected={ currentSlideIndex === index }
						onClick={ () => onSlideSeek( index ) }
					/>
				);
			} ) }
		</div>
	);
};

export default ProgressBar;
