import { SparklineUnresponsive } from '@automattic/charts';
import '@automattic/charts/style.css';
import apiFetch from '@wordpress/api-fetch';
import { createPortal, createRoot, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './style.scss';

const DAYS = 7;

/**
 * Fetch daily views and visitors for the last DAYS days.
 *
 * @param {number} blogId - The WordPress.com blog ID.
 * @return {Promise<{views: number[], visitors: number[]}>} Daily values, oldest first.
 */
async function fetchVisits( blogId ) {
	const response = await apiFetch( {
		path: `/jetpack/v4/stats-app/sites/${ blogId }/stats/visits?unit=day&quantity=${ DAYS }&stat_fields=views,visitors`,
	} );

	const fields = response?.fields ?? [];
	const rows = Array.isArray( response?.data ) ? response.data : [];
	const column = name => {
		const index = fields.indexOf( name );
		return rows.map( row => Number( row[ index ] ) || 0 );
	};

	return { views: column( 'views' ), visitors: column( 'visitors' ) };
}

const sum = values => values.reduce( ( total, value ) => total + value, 0 );

/**
 * The admin bar sparkline and the panel shown on hover.
 *
 * @param {object}      props         - Component props.
 * @param {number}      props.blogId  - The WordPress.com blog ID.
 * @param {HTMLElement} props.chartEl - Where the sparkline renders, inside the admin bar link.
 * @return {object} The panel, with the sparkline portaled into the admin bar link.
 */
function AdminBarStats( { blogId, chartEl } ) {
	const [ state, setState ] = useState( { status: 'loading', views: [], visitors: [] } );

	useEffect( () => {
		fetchVisits( blogId )
			.then( data => setState( { status: 'success', ...data } ) )
			.catch( () => setState( { status: 'error', views: [], visitors: [] } ) );
	}, [ blogId ] );

	const formatNumber = new Intl.NumberFormat( document.documentElement.lang || undefined ).format;
	const metricValue = values =>
		state.status === 'success' ? formatNumber( sum( values ) ) : '–';

	return (
		<>
			{ createPortal(
				<SparklineUnresponsive
					data={ state.views }
					width={ 88 }
					height={ 20 }
					color="currentColor"
					strokeWidth={ 1.5 }
					animation={ false }
				/>,
				chartEl
			) }
			<div className="jp-stats-admin-bar-panel" aria-live="polite">
				<div className="jp-stats-admin-bar-panel__title">
					{ __( 'Last 7 days', 'jetpack-stats-admin' ) }
				</div>
				{ state.status === 'error' ? (
					<p className="jp-stats-admin-bar-panel__error">
						{ __( 'Stats are unavailable right now.', 'jetpack-stats-admin' ) }
					</p>
				) : (
					<dl className="jp-stats-admin-bar-panel__metrics">
						<div className="jp-stats-admin-bar-panel__metric">
							<dt>{ __( 'Views', 'jetpack-stats-admin' ) }</dt>
							<dd>{ metricValue( state.views ) }</dd>
						</div>
						<div className="jp-stats-admin-bar-panel__metric">
							<dt>{ __( 'Visitors', 'jetpack-stats-admin' ) }</dt>
							<dd>{ metricValue( state.visitors ) }</dd>
						</div>
					</dl>
				) }
			</div>
		</>
	);
}

const panelEl = document.getElementById( 'jetpack-stats-admin-bar-panel' );
const chartEl = document.getElementById( 'jetpack-stats-admin-bar-chart' );
const blogId = window.jetpackStatsAdminBar?.blogId;

if ( panelEl && chartEl && blogId ) {
	createRoot( panelEl ).render( <AdminBarStats blogId={ blogId } chartEl={ chartEl } /> );
}
