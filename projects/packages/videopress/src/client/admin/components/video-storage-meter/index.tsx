/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import filesize from 'filesize';
/**
 * Internal dependencies
 */
import ProgressBar from '../progress-bar';
import styles from './style.module.scss';
import { VideoStorageMeterProps } from './types';
import type React from 'react';

/**
 * Video Storage Meter component
 *
 * @param {VideoStorageMeterProps} props - Component props.
 * @returns {React.ReactNode} - VideoStorageMeter react component.
 */
const VideoStorageMeter: React.FC< VideoStorageMeterProps > = ( { className, total, used } ) => {
	if ( ! total || used == null ) {
		return null;
	}

	const progress = used / total;
	const progressLabel = `${ ( progress * 100 ).toFixed() }%`;
	const totalLabel = filesize( total, { base: 2 } );

	return (
		<div className={ classnames( className ) }>
			<Text className={ classnames( styles[ 'percentage-description' ] ) }>
				{ sprintf(
					/* translators: %1$s is the storage percentage, from 0% to 100%, %2$s is the total storage. */
					__( '%1$s of %2$s of cloud video storage', 'jetpack-videopress-pkg' ),
					progressLabel,
					totalLabel
				) }
			</Text>
			<ProgressBar progress={ progress }></ProgressBar>
		</div>
	);
};

export default VideoStorageMeter;
