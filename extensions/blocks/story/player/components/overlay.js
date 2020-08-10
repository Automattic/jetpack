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
	icon,
	slideCount,
} ) {
	const onOverlayPressed = () => {
		! disabled && onClick();
	};

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
		<div
			role={ disabled ? 'presentation' : 'button' }
			className={ classNames( {
				'wp-story-overlay': true,
				'wp-story-clickable': ! disabled,
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
				<DecoratedButton size={ 80 } iconSize={ 56 } label="Replay Story" icon="replay" />
			) }
		</div>
	);
}
