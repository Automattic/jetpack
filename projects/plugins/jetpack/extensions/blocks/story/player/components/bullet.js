/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */

export default function Bullet( { isEllipsis, disabled, index, isSelected, progress, onClick } ) {
	const bulletDisabled = disabled || isEllipsis;
	let label = null;
	if ( ! isEllipsis ) {
		label = isSelected
			? sprintf( __( 'Slide %d, currently selected.', 'jetpack' ), index + 1 )
			: sprintf( __( 'Slide %d', 'jetpack' ), index + 1 );
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
