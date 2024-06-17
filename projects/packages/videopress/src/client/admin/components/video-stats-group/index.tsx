/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { VideoStatsGroupProps } from './types';
import type React from 'react';

const Stats = ( { label, value = 0 }: { label: string; value: number } ) => {
	return (
		<div className={ clsx( styles.column ) }>
			<Text>{ label }</Text>
			<Text variant="title-medium" className={ clsx( styles.count ) }>
				{ value }
			</Text>
		</div>
	);
};

/**
 * Video Stats Group component
 *
 * @param {VideoStatsGroupProps} props - Component props.
 * @returns {React.ReactNode} - VideoStatsGroup react component.
 */
const VideoStatsGroup = ( {
	className,
	videos = 0,
	plays = 0,
	playsToday = 0,
}: VideoStatsGroupProps ) => {
	return (
		<div className={ clsx( className, styles.wrapper ) }>
			<Stats label={ __( 'Videos', 'jetpack-videopress-pkg' ) } value={ videos } />
			<Stats label={ __( 'Plays', 'jetpack-videopress-pkg' ) } value={ plays } />
			<Stats label={ __( 'Plays today', 'jetpack-videopress-pkg' ) } value={ playsToday } />
		</div>
	);
};

export default VideoStatsGroup;
