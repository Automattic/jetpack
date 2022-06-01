import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';

export default function Bullet( { isEllipsis, disabled, index, isSelected, progress, onClick } ) {
	const bulletDisabled = disabled || isEllipsis;
	let label = null;
	if ( ! isEllipsis ) {
		label = isSelected
			? sprintf(
					/* translators: %d: Slide number. */
					__( 'Slide %d, currently selected', 'jetpack' ),
					index + 1
			  )
			: sprintf(
					/* translators: %d: Slide number. */
					__( 'Go to slide %d', 'jetpack' ),
					index + 1
			  );
	}
	return (
		<Button
			role={ bulletDisabled ? 'presentation' : 'tab' }
			key={ index }
			className={ classNames( 'wp-story-pagination-bullet', {
				'wp-story-pagination-ellipsis': isEllipsis,
			} ) }
			aria-label={ label }
			aria-disabled={ bulletDisabled || isSelected }
			onClick={ ! bulletDisabled && ! isSelected ? onClick : undefined }
			disabled={ bulletDisabled }
		>
			<div className="wp-story-pagination-bullet-bar">
				<div
					className="wp-story-pagination-bullet-bar-progress"
					style={ { width: `${ progress }%` } }
				></div>
			</div>
		</Button>
	);
}
