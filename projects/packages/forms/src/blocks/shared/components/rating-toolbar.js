import { ToolbarGroup, ToolbarButton, SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, reset } from '@wordpress/icons';

// Custom heart icon
const heartIcon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
	</SVG>
);

// Custom star icon to match heart icon size
const starIcon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
	</SVG>
);

/**
 * Shared toolbar for rating field and rating input blocks.
 *
 * @param {object}                         props                   - Component props.
 * @param {string}                         props.className         - Current block className.
 * @param {number}                         props.max               - Current maximum rating value.
 * @param {(newClassName: string) => void} props.onUpdateClassName - Callback to change className.
 * @param {(newMax: number) => void}       props.onUpdateMax       - Callback to change the maximum value.
 * @return {import('@wordpress/element').WPElement} JSX markup for the toolbar.
 */
export default function RatingToolbar( { className, max, onUpdateClassName, onUpdateMax } ) {
	// Determine if current style is stars (default) or hearts
	const isCurrentlyStars = ! className || className.includes( 'is-style-stars' );
	const isHeartsStyle = className?.includes( 'is-style-hearts' );

	// Pre-define translation strings to avoid dynamic translation calls
	const transformToHeartsLabel = __( 'Transform to hearts', 'jetpack-forms' );
	const transformToStarsLabel = __( 'Transform to stars', 'jetpack-forms' );
	const removeHeartLabel = __( 'Remove heart', 'jetpack-forms' );
	const removeStarLabel = __( 'Remove star', 'jetpack-forms' );
	const addHeartLabel = __( 'Add heart', 'jetpack-forms' );
	const addStarLabel = __( 'Add star', 'jetpack-forms' );

	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					icon={ isCurrentlyStars ? heartIcon : starIcon }
					label={ isCurrentlyStars ? transformToHeartsLabel : transformToStarsLabel }
					onClick={ () =>
						onUpdateClassName( isCurrentlyStars ? 'is-style-hearts' : 'is-style-stars' )
					}
				/>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					icon={ reset }
					label={ isHeartsStyle ? removeHeartLabel : removeStarLabel }
					onClick={ () => onUpdateMax( Math.max( 2, max - 1 ) ) }
					disabled={ max <= 2 }
				/>
				<ToolbarButton
					icon={ plus }
					label={ isHeartsStyle ? addHeartLabel : addStarLabel }
					onClick={ () => onUpdateMax( Math.min( 10, max + 1 ) ) }
					disabled={ max >= 10 }
				/>
			</ToolbarGroup>
		</>
	);
}
