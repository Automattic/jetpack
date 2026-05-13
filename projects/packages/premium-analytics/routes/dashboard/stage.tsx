import { __ } from '@wordpress/i18n';

export const stage = () => {
	return (
		<div className="jetpack-premium-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-premium-analytics' ) }</h1>
			<p>{ __( 'Welcome to the Analytics dashboard.', 'jetpack-premium-analytics' ) }</p>
		</div>
	);
};
