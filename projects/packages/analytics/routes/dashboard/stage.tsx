import { __ } from '@wordpress/i18n';

export const stage = () => {
	return (
		<div className="jetpack-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-analytics' ) }</h1>
			<p>{ __( 'Welcome to the Analytics dashboard.', 'jetpack-analytics' ) }</p>
		</div>
	);
};
