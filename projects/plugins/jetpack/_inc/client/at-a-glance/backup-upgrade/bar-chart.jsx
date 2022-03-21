/**
 * External dependencies
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RecordMeterBar from 'components/record-meter-bar';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { Popup } from './popup';

const BarChart = ( { comments, plugins, posts, onClosePopup } ) => {
	const barChartViews = useRef( false );

	useEffect( () => {
		if ( barChartViews.current ) {
			return;
		}
		analytics.tracks.recordEvent( 'jetpack_wpa_aag_backup_bar_chart_view', {
			comments,
			plugins,
			posts,
		} );

		barChartViews.current = true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const items = useMemo( () => {
		return [
			{ count: posts, label: __( 'Posts', 'jetpack' ), backgroundColor: '#00BA37' },
			{ count: plugins, label: __( 'Plugins', 'jetpack' ), backgroundColor: '#3895BA' },
			{ count: comments, label: __( 'Comments', 'jetpack' ), backgroundColor: '#E68B28' },
		];
	}, [ comments, plugins, posts ] );

	return (
		<Card className="jp-dash-upgrade-backup">
			<Popup posts={ posts } comments={ comments } onClose={ onClosePopup } />
			<RecordMeterBar items={ items } />
		</Card>
	);
};

export default BarChart;
