/**
 * External dependencies
 */
import { Chart, registerables } from 'chart.js';
import Card from 'components/card';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getStatsData,
	getPluginItems,
	isFetchingPluginsData,
	isFetchingStatsData,
} from 'state/at-a-glance';

import { Popup } from './popup';
import { Table } from './table';
import { CHART_OPTIONS } from './constants';

import './style.scss';

Chart.register( ...registerables );

const BackupUpgrade = ( { comments, isFetchingData, plugins, posts } ) => {
	const canvasRef = useRef( null );
	/**
	 * @type {React.MutableRefObject<Chart>}}
	 */
	const chartRef = useRef( null );

	const [ chart, setChart ] = useState();

	const [ showPopup, setShowPopup ] = useState( true );

	useEffect( () => {
		if ( ! canvasRef.current || isFetchingData ) {
			return;
		}
		// if there is an existing canvas instance, we need to destroy it.
		if ( chartRef.current ) {
			chartRef.current.destroy();
		}
		const newChart = new Chart( canvasRef.current, {
			type: 'bar',
			options: CHART_OPTIONS,
			data: {
				labels: [ '' ],
				datasets: [
					{ data: [ posts ], label: __( 'Posts', 'jetpack' ), backgroundColor: '#00BA37' },
					{ data: [ plugins ], label: __( 'Plugins', 'jetpack' ), backgroundColor: '#3895BA' },
					{ data: [ comments ], label: __( 'Comments', 'jetpack' ), backgroundColor: '#E68B28' },
				],
			},
		} );
		// Set the max value on x-axis in order to avoid extra values on the axis
		newChart.options.scales.x.max = comments + plugins + posts;
		newChart.update();

		setChart( newChart );

		chartRef.current = newChart;

		return () => {
			chartRef.current.destroy();
		};
	}, [ comments, isFetchingData, plugins, posts ] );

	const onClosePopup = useCallback( () => setShowPopup( false ), [] );

	return (
		! isFetchingData &&
		showPopup && (
			<Card className="jp-dash-upgrade-backup">
				<Popup posts={ posts } comments={ comments } onClose={ onClosePopup } />
				<div className="jp-dash-upgrade-backup__canvas-wrapper">
					<canvas ref={ canvasRef }>
						<p>
							{ __(
								'Text alternative for this canvas graphic is in the data table below.',
								'jetpack'
							) }
						</p>
						<Table chart={ chart } />
					</canvas>
				</div>
			</Card>
		)
	);
};

export default connect( state => {
	const stats = getStatsData( state )?.general?.stats;

	return {
		comments: stats?.comments,
		plugins: Object.keys( getPluginItems( state ) ).length,
		posts: stats?.posts,
		isFetchingData: isFetchingPluginsData( state ) || isFetchingStatsData( state ),
	};
} )( BackupUpgrade );
