/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

export default function Bullet( { index, progress, onClick } ) {
	return (
		<button
			key={ index }
			className="wp-story-pagination-bullet"
			aria-label={ sprintf( __( 'Go to slide %d', 'jetpack' ), index ) }
			onClick={ onClick }
		>
			<div className="wp-story-pagination-bullet-bar">
				<div
					className="wp-story-pagination-bullet-bar-progress"
					style={ { width: `${ progress }%` } }
				></div>
			</div>
		</button>
	);
}
