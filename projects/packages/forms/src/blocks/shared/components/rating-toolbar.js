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
	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					icon={ className?.includes( 'is-style-stars' ) ? HeartIcon : StarIcon }
					label={
						className?.includes( 'is-style-stars' )
							? __( 'Transform to hearts', 'jetpack-forms' )
							: __( 'Transform to stars', 'jetpack-forms' )
					}
					onClick={ () =>
						onUpdateClassName(
							className?.includes( 'is-style-stars' ) ? 'is-style-hearts' : 'is-style-stars'
						)
					}
				/>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					icon={ reset }
					label={
						className?.includes( 'is-style-hearts' )
							? __( 'Remove heart', 'jetpack-forms' )
							: __( 'Remove star', 'jetpack-forms' )
					}
					onClick={ () => onUpdateMax( Math.max( 2, max - 1 ) ) }
					disabled={ max <= 2 }
				/>
				<ToolbarButton
					icon={ plus }
					label={
						className?.includes( 'is-style-hearts' )
							? __( 'Add heart', 'jetpack-forms' )
							: __( 'Add star', 'jetpack-forms' )
					}
					onClick={ () => onUpdateMax( Math.min( 10, max + 1 ) ) }
					disabled={ max >= 10 }
				/>
			</ToolbarGroup>
		</>
	);
}

// Shared toolbar component with comprehensive controls for rating configuration
