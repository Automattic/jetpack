/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */

export default function Bullet( { disabled, index, isSelected, progress, onClick } ) {
	const label = isSelected
		? sprintf( __( 'Slide %d, currently selected.', 'jetpack' ), index + 1 )
		: sprintf( __( 'Slide %d', 'jetpack' ), index + 1 );
	return (
		<Button
			role={ disabled ? 'presentation' : 'tab' }
			key={ index }
			className="wp-story-pagination-bullet"
			aria-label={ label }
			aria-disabled={ disabled || isSelected }
			onClick={ ! disabled && ! isSelected ? onClick : undefined }
			disabled={ disabled }
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
