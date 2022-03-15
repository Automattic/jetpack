/**
 * External dependencies
 */
import Card from 'components/card';
import React, { useState, useCallback, useMemo } from 'react';
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
import RecordMeterBar from 'components/record-meter-bar';

import { Popup } from './popup';

import './style.scss';

const MIN_POSTS_FOR_VISIBLE_BAR = 20;

const BackupUpgrade = ( { comments, isFetchingData, plugins, posts } ) => {
	const [ showPopup, setShowPopup ] = useState( true );

	const onClosePopup = useCallback( () => setShowPopup( false ), [] );

	const items = useMemo( () => {
		return [
			{ count: posts, label: __( 'Posts', 'jetpack' ), backgroundColor: '#00BA37' },
			{ count: plugins, label: __( 'Plugins', 'jetpack' ), backgroundColor: '#3895BA' },
			{ count: comments, label: __( 'Comments', 'jetpack' ), backgroundColor: '#E68B28' },
		];
	}, [ comments, plugins, posts ] );

	return (
		! isFetchingData &&
		showPopup &&
		posts > MIN_POSTS_FOR_VISIBLE_BAR && (
			<Card className="jp-dash-upgrade-backup">
				<Popup posts={ posts } comments={ comments } onClose={ onClosePopup } />
				<RecordMeterBar items={ items } />
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
