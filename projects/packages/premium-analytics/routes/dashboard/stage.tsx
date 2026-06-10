import { useSyncStatus } from '@jetpack-premium-analytics/site-sync';
import { __ } from '@wordpress/i18n';

// TEMP (do not commit): visual harness for useSyncStatus E2E testing.
export const stage = () => {
	const { data, error, isLoading, isComplete, isStalled, triggerSync } = useSyncStatus();

	return (
		<div className="jetpack-premium-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-premium-analytics' ) }</h1>
			<p>{ __( 'Welcome to the Analytics dashboard.', 'jetpack-premium-analytics' ) }</p>

			<div style={ { border: '1px solid #ccc', padding: 16, marginTop: 16 } }>
				<h2>site-sync / useSyncStatus (TEMP harness)</h2>
				<ul>
					<li>isLoading: { String( isLoading ) }</li>
					<li>isComplete: { String( isComplete ) }</li>
					<li>isStalled: { String( isStalled ) }</li>
					<li>error: { error ? error.message : 'null' }</li>
				</ul>
				<pre>{ JSON.stringify( data, null, 2 ) }</pre>
				<button onClick={ () => void triggerSync() }>Trigger full sync</button>
			</div>
		</div>
	);
};
