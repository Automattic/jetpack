import { formatNumber } from '@automattic/number-formatters';
import { lazy, Suspense } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const samplePageViews = 1234567;
const sampleUniqueVisitors = 98432;

const UniqueVisitors = lazy( () =>
	import( '@automattic/number-formatters' ).then( ( { formatNumberCompact } ) => ( {
		default: ( { value }: { value: number } ) => <strong>{ formatNumberCompact( value ) }</strong>,
	} ) )
);

const Stage = () => {
	return (
		<div className="jetpack-premium-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-premium-analytics' ) }</h1>

			<p>
				{ __( 'Unique visitors (dynamic):', 'jetpack-premium-analytics' ) }{ ' ' }
				<Suspense fallback={ <strong>…</strong> }>
					<UniqueVisitors value={ sampleUniqueVisitors } />
				</Suspense>
			</p>

			<p>
				{ __( 'Total page views (static):', 'jetpack-premium-analytics' ) }{ ' ' }
				<strong>{ formatNumber( samplePageViews ) }</strong>
			</p>
		</div>
	);
};

export { Stage as stage };
