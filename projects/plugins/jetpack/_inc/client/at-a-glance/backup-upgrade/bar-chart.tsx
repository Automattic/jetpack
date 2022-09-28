import { RecordMeterBar } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import analytics from 'lib/analytics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Popup } from './popup';
import { BarChartProps } from './types';

/**
 * This function returns a React component that displays a bar chart with the number of posts, plugins,
 * and comments
 *
 * @param {BarChartProps} props - Props
 * @returns {React.ReactElement} - JSX Element
 */
export const BarChart: React.FC< BarChartProps > = ( {
	comments,
	plugins,
	posts,
	onClosePopup,
} ) => {
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
			<Popup posts={ posts } comments={ comments } onClosePopup={ onClosePopup } />
			<RecordMeterBar items={ items } />
		</Card>
	);
};
