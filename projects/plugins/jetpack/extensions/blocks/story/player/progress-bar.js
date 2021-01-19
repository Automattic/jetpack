/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Bullet } from './components';
import { range } from 'lodash';

export const ProgressBar = ( {
	slides,
	disabled,
	currentSlideIndex,
	currentSlideProgress,
	onSlideSeek,
	maxBullets,
} ) => {
	const bulletCount = Math.min( slides.length, maxBullets );
	const middleBullet = Math.floor( bulletCount / 2 );

	let currentBulletIndex;
	let firstReachableSlideIndex = 0;
	let lastReachableSlideIndex = slides.length - 1;

	if ( slides.length <= maxBullets || currentSlideIndex < middleBullet ) {
		currentBulletIndex = currentSlideIndex;
		lastReachableSlideIndex = bulletCount - 1;
	} else if ( currentSlideIndex > slides.length - middleBullet ) {
		currentBulletIndex = currentSlideIndex - slides.length + bulletCount;
		firstReachableSlideIndex = slides.length - bulletCount;
	} else {
		currentBulletIndex = middleBullet;
		firstReachableSlideIndex = currentSlideIndex - middleBullet;
		lastReachableSlideIndex = currentSlideIndex + middleBullet;
	}
	return (
		<div className="wp-story-pagination wp-story-pagination-bullets" role="tablist">
			{ firstReachableSlideIndex > 0 && (
				<Bullet key="bullet-0" index={ firstReachableSlideIndex - 1 } progress={ 100 } isEllipsis />
			) }
			{ range( 1, bulletCount + 1 ).map( ( slide, bulletIndex ) => {
				const slideIndex = bulletIndex + firstReachableSlideIndex;
				let progress;
				if ( slideIndex < currentSlideIndex ) {
					progress = 100;
				} else if ( slideIndex > currentSlideIndex ) {
					progress = 0;
				} else {
					progress = currentSlideProgress;
				}
				return (
					<Bullet
						key={ `bullet-${ bulletIndex }` }
						index={ slideIndex }
						progress={ progress }
						disabled={ disabled }
						isSelected={ currentBulletIndex === bulletIndex }
						onClick={ () => onSlideSeek( slideIndex ) }
					/>
				);
			} ) }
			{ lastReachableSlideIndex < slides.length - 1 && (
				<Bullet
					key={ `bullet-${ bulletCount + 1 }` }
					index={ lastReachableSlideIndex + 1 }
					progress={ 0 }
					isEllipsis
				/>
			) }
		</div>
	);
};

export default ProgressBar;
