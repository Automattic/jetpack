/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import { useCallback } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import GridiconFullscreen from 'gridicons/dist/fullscreen';
import { DecoratedButton } from './button';
import { NavigateBeforeIcon, NavigateNextIcon } from './icons';

export default function Overlay( {
	ended,
	hasPrevious,
	onNextSlide,
	onPreviousSlide,
	icon,
	slideCount,
	showSlideCount,
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
			{ showSlideCount && (
				<div className="wp-story-embed-icon">
					{ icon }
					<span>{ slideCount }</span>
				</div>
			) }
			{ ! showSlideCount && (
				<div className="wp-story-embed-icon-expand">
					<GridiconFullscreen role="img" />
				</div>
			) }
			{ hasPrevious && (
				<div className="wp-story-prev-slide" onClick={ onPreviousSlideHandler }>
					<DecoratedButton
						size={ 44 }
						label={ __( 'Previous Slide', 'jetpack' ) }
						className="outlined-w"
					>
						{ isRTL() ? <NavigateNextIcon size={ 24 } /> : <NavigateBeforeIcon size={ 24 } /> }
					</DecoratedButton>
				</div>
			) }
			<div className="wp-story-next-slide" onClick={ onNextSlideHandler }>
				<DecoratedButton size={ 44 } label={ __( 'Next Slide', 'jetpack' ) } className="outlined-w">
					{ isRTL() ? <NavigateBeforeIcon size={ 24 } /> : <NavigateNextIcon size={ 24 } /> }
				</DecoratedButton>
			</div>
		</div>
	);
}
