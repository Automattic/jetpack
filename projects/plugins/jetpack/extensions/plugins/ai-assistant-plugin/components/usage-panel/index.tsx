/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './style.scss';
import UsageBar from '../usage-bar';

export default function UsagePanel() {
	return (
		<div className="jetpack-ai-usage-panel-control">
			<p>
				{
					// translators: %1$d: current request counter; %2$d: request allowance;
					sprintf( __( '%1$d / %2$d free requests.', 'jetpack' ), 10, 20 )
				}
			</p>

			<UsageBar usage={ 0.5 } />

			<p className="muted">
				{
					// translators: %1$d: number of days until the next usage count reset
					sprintf( __( 'Requests will reset in %1$d days.', 'jetpack' ), 10 )
				}
			</p>
		</div>
	);
}
