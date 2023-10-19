/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

export default function UsagePanel() {
	return (
		<div className="jetpack-ai-usage-panel-control">
			<p>{ __( 'This is the usage panel. Check your usage here!', 'jetpack' ) }</p>
		</div>
	);
}
