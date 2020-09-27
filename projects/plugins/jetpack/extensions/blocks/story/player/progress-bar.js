/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Bullet } from './components';
import { useSelect } from '@wordpress/data';

export const ProgressBar = ( { playerId, slides, fullscreen, onSlideSeek } ) => {
	const { currentSlideIndex, currentSlideProgressPercentage } = useSelect(
		select => ( {
			currentSlideIndex: select( 'jetpack/story/player' ).getCurrentSlideIndex( playerId ),
			currentSlideProgressPercentage: select(
				'jetpack/story/player'
			).getCurrentSlideProgressPercentage( playerId ),
		} ),
		[]
	);

	return (
		<div className="wp-story-pagination wp-story-pagination-bullets" role="tablist">
			{ slides.map( ( slide, index ) => {
				let progress;
				if ( index < currentSlideIndex ) {
					progress = 100;
				} else if ( index > currentSlideIndex ) {
					progress = 0;
				} else {
					progress = currentSlideProgressPercentage;
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
