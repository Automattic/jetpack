/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	getStatsData,
	getPluginItems,
	isFetchingPluginsData,
	isFetchingStatsData,
} from 'state/at-a-glance';
import BarChart from './bar-chart';
import analytics from 'lib/analytics';

import './style.scss';

const MIN_POSTS_FOR_VISIBLE_BAR = 20;

const BackupUpgrade = ( { comments, isFetchingData, plugins, posts } ) => {
	const [ showPopup, setShowPopup ] = useState( true );

	const onClosePopup = useCallback( () => {
		const clickEventProps = {
			comments,
			plugins,
			posts,
			target: 'backup_bar_chart_close',
			type: 'dismiss',
		};

		analytics.tracks.recordJetpackClick( clickEventProps );

		setShowPopup( false );
	}, [ comments, plugins, posts ] );

	return (
		! isFetchingData &&
		showPopup &&
		posts > MIN_POSTS_FOR_VISIBLE_BAR && (
			<BarChart
				posts={ posts }
				comments={ comments }
				plugins={ plugins }
				onClosePopup={ onClosePopup }
			/>
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
