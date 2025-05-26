import { __ } from '@wordpress/i18n';

/**
 * The Help content component.
 *
 * @return The rendered component.
 */
export function HelpContent() {
	return (
		<div>
			<h2>{ __( 'Need assistance?', 'jetpack-my-jetpack' ) }</h2>
		</div>
	);
}
