import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, lineSolid } from '@wordpress/icons';
import { StarIcon, HeartIcon } from '../../input-rating/icons';

/**
 * Shared toolbar for rating field and rating input blocks.
 *
 * @param {object}                                   props                   - Component props.
 * @param {'stars'|'hearts'}                         props.variation         - Current icon style.
 * @param {number}                                   props.max               - Current maximum rating value.
 * @param {(newVariation: 'stars'|'hearts') => void} props.onUpdateVariation - Callback to change variation.
 * @param {(newMax: number) => void}                 props.onUpdateMax       - Callback to change the maximum value.
 * @return {import('@wordpress/element').WPElement} JSX markup for the toolbar.
 */
export default function RatingToolbar( { variation, max, onUpdateVariation, onUpdateMax } ) {
	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					icon={ variation === 'stars' ? HeartIcon : StarIcon }
					label={
						variation === 'stars'
							? __( 'Transform to hearts', 'jetpack-forms' )
							: __( 'Transform to stars', 'jetpack-forms' )
					}
					onClick={ () => onUpdateVariation( variation === 'stars' ? 'hearts' : 'stars' ) }
				/>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					icon={ lineSolid }
					label={ __( 'Remove star', 'jetpack-forms' ) }
					onClick={ () => onUpdateMax( Math.max( 2, max - 1 ) ) }
					disabled={ max <= 2 }
				/>
				<ToolbarButton
					icon={ plus }
					label={ __( 'Add star', 'jetpack-forms' ) }
					onClick={ () => onUpdateMax( Math.min( 10, max + 1 ) ) }
					disabled={ max >= 10 }
				/>
			</ToolbarGroup>
		</>
	);
}
