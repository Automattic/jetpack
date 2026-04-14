import { formatNumber } from '@automattic/number-formatters';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const samplePageViews = 1234567;
const sampleUniqueVisitors = 98432;

const Stage = () => {
	const [ lazyFormatted, setLazyFormatted ] = useState< string >();

	useEffect( () => {
		import( '@automattic/number-formatters' ).then( ( { formatNumberCompact } ) => {
			setLazyFormatted( formatNumberCompact( sampleUniqueVisitors ) );
		} );
	}, [] );

	return (
		<div className="jetpack-premium-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-premium-analytics' ) }</h1>

			<p>
				{ __( 'Unique visitors (dynamic):', 'jetpack-premium-analytics' ) }{ ' ' }
				<strong>{ lazyFormatted ?? '…' }</strong>
			</p>

			<p>
				{ __( 'Total page views (static):', 'jetpack-premium-analytics' ) }{ ' ' }
				<strong>{ formatNumber( samplePageViews ) }</strong>
			</p>
		</div>
	);
};

export { Stage as stage };
