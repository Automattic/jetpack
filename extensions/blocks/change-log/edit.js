
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */

export default function ChaneglogEdit ( {
	className,
} ) {
	return (
		<div class={ className }>
			{ __( 'Changelog block', 'jetpack' ) }
		</div>
	);
}
