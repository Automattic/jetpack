/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

/**
 * External dependencies
 */
import GridiconFullscreen from 'gridicons/dist/fullscreen';

/**
 * WordPress dependencies
 */
import { createElement, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DecoratedButton } from './button';

export default function Overlay( {
	ended,
	hasPrevious,
	hasNext,
	onNextSlide,
	onPreviousSlide,
	icon,
	slideCount,
} ) {
	const onPreviousSlideHandler = useCallback(
		event => {
			if ( ended ) {
				return;
			}
			event.stopPropagation();
			onPreviousSlide();
		},
		[ onPreviousSlide, ended ]
	);

	const onNextSlideHandler = useCallback(
		event => {
			if ( ended ) {
				return;
			}
			event.stopPropagation();
			onNextSlide();
		},
		[ onNextSlide, ended ]
	);

	return (
		<div className="wp-story-overlay">
			{ icon && (
				<div className="wp-story-embed-icon">
					{ icon }
					<span>{ slideCount }</span>
				</div>
			) }
			{ ! icon && (
				<div className="wp-story-embed-icon-expand">
					<GridiconFullscreen />
				</div>
			) }
			{ hasPrevious && (
				<div className="wp-story-prev-slide" onClick={ onPreviousSlideHandler }>
					<DecoratedButton
						size={ 44 }
						iconSize={ 24 }
						label="Previous Slide"
						icon="navigate_before"
						className="outlined-w"
					/>
				</div>
			) }
			{ hasNext && (
				<div className="wp-story-next-slide" onClick={ onNextSlideHandler }>
					<DecoratedButton
						size={ 44 }
						iconSize={ 24 }
						label="Next Slide"
						icon="navigate_next"
						className="outlined-w"
					/>
				</div>
			) }
		</div>
	);
}
