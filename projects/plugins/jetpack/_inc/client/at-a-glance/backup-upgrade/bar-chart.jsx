/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RecordMeterBar from 'components/record-meter-bar';
import Card from 'components/card';
import { Popup } from './popup';

const BarChart = ( { comments, plugins, posts, onClosePopup } ) => {
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
