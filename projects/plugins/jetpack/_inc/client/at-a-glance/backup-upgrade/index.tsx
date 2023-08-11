import analytics from 'lib/analytics';
import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import {
	getStatsData,
	getPluginItems,
	isFetchingPluginsData,
	isFetchingStatsData,
} from 'state/at-a-glance';
import { BarChart } from './bar-chart';
import { BackupUpgradeProps } from './types';

import './style.scss';

const MIN_POSTS_FOR_VISIBLE_BAR = 20;

/**
 * It renders a bar chart if the user has more than a certain number of posts
 *
 * @param {BackupUpgradeProps} props - Props
 * @returns {React.ReactElement} - JSX Element
 */
const BackupUpgrade: React.FC< BackupUpgradeProps > = ( {
	comments,
	isFetchingData,
	plugins,
	posts,
} ) => {
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

	return ! isFetchingData && showPopup && posts > MIN_POSTS_FOR_VISIBLE_BAR ? (
		<BarChart
			posts={ posts }
			comments={ comments }
			plugins={ plugins }
			onClosePopup={ onClosePopup }
		/>
	) : null;
};

export default connect( state => {
	// eslint-disable-next-line  @typescript-eslint/no-explicit-any
	const stats = ( getStatsData( state ) as any )?.general?.stats;

	return {
		comments: stats?.comments,
		plugins: Object.keys( getPluginItems( state ) ).length,
		posts: stats?.posts,
		isFetchingData: isFetchingPluginsData( state ) || isFetchingStatsData( state ),
	};
} )( BackupUpgrade );
