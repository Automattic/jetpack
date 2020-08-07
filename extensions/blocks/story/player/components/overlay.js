/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement, useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DecoratedButton } from './button';

export default function Overlay( {
	ended,
	disabled,
	onClick,
	hasPrevious,
	hasNext,
	onNextSlide,
	onPreviousSlide,
	tapToPlayPause,
	icon,
	slideCount,
} ) {
	const onOverlayPressed = () => {
		! disabled && tapToPlayPause && onClick();
	};

	const onPlayPressed = useCallback(
		event => {
			if ( tapToPlayPause || disabled ) {
				// let the event bubble
				return;
			}
			event.stopPropagation();
			onClick();
		},
		[ tapToPlayPause, onClick ]
	);

	const onPreviousSlideHandler = useCallback(
		event => {
			event.stopPropagation();
			onPreviousSlide();
		},
		[ onPreviousSlide ]
	);

	const onNextSlideHandler = useCallback(
		event => {
			event.stopPropagation();
			onNextSlide();
		},
		[ onNextSlide ]
	);

	return (
		<div
			role={ disabled ? 'presentation' : 'button' }
			className={ classNames( {
				'wp-story-overlay': true,
				'wp-story-clickable': tapToPlayPause,
			} ) }
			onClick={ onOverlayPressed }
		>
			{ icon && (
				<div className="wp-story-embed-icon">
					{ icon }
					<span>{ slideCount }</span>
				</div>
			) }
			<div className="wp-story-prev-slide" onClick={ onPreviousSlideHandler }>
				{ hasPrevious && (
					<DecoratedButton
						size={ 44 }
						iconSize={ 24 }
						label="Previous Slide"
						icon="navigate_before"
						className="outlined-w"
					/>
				) }
			</div>
			<div className="wp-story-next-slide" onClick={ onNextSlideHandler }>
				{ hasNext && (
					<DecoratedButton
						size={ 44 }
						iconSize={ 24 }
						label="Next Slide"
						icon="navigate_next"
						className="outlined-w"
					/>
				) }
			</div>
			{ ended && (
				<DecoratedButton
					size={ 80 }
					iconSize={ 56 }
					label="Replay Story"
					icon="replay"
					onClick={ onPlayPressed }
				/>
			) }
		</div>
	);
}
