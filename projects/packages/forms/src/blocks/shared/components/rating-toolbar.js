import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, reset } from '@wordpress/icons';
import { StarIcon, HeartIcon } from '../../input-rating/icons';

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
					icon={ isCurrentlyStars ? HeartIcon : StarIcon }
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

// Shared toolbar component with comprehensive controls for rating configuration
