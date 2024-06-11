/**
 * External dependencies
 */
import { ProgressBar, Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import filesize from 'filesize';
/**
 * Internal dependencies
 */
import { usePlan } from '../../hooks/use-plan';
import { useVideoPressSettings } from '../../hooks/use-videopress-settings';
import useVideos from '../../hooks/use-videos';
import { SITE_TYPE_ATOMIC } from '../site-settings-section/constants';
import styles from './style.module.scss';
/**
 * Types
 */
import type { VideoStorageMeterProps } from './types';
import type React from 'react';

/**
 * Video Storage Meter component
 *
 * @param {VideoStorageMeterProps} props - Component props.
 * @returns {React.ReactNode} - VideoStorageMeter react component.
 */
const VideoStorageMeter: React.FC< VideoStorageMeterProps > = ( {
	className,
	progressBarClassName,
	total,
	used,
} ) => {
	if ( ! total || used == null ) {
		return null;
	}

	const progress = used / total;
	const progressLabel = `${ ( progress * 100 ).toFixed() }%`;
	const totalLabel = filesize( total, { base: 10 } );

	return (
		<div className={ clsx( className ) }>
			<Text className={ clsx( styles[ 'percentage-description' ] ) }>
				{ sprintf(
					/* translators: %1$s is the storage percentage, from 0% to 100%, %2$s is the total storage. */
					__( '%1$s of %2$s of cloud video storage', 'jetpack-videopress-pkg' ),
					progressLabel,
					totalLabel
				) }
			</Text>
			<ProgressBar
				className={ clsx( styles[ 'progress-bar' ], progressBarClassName ) }
				progress={ progress }
			></ProgressBar>
		</div>
	);
};

export const ConnectVideoStorageMeter = props => {
	const { storageUsed, uploadedVideoCount } = useVideos();
	const { features } = usePlan();
	const { settings } = useVideoPressSettings();
	const { siteType } = settings;

	const total = 1000 * 1000 * 1000 * 1000;

	// Do not show storage meter if the site is an Atomic site.
	if ( siteType === SITE_TYPE_ATOMIC ) {
		return null;
	}

	// Do not show storage meter for unlimited storage plans.
	if ( features?.isVideoPressUnlimitedSupported ) {
		return null;
	}

	// Do not show storage meter if when no videos have been uploaded.
	if ( ! uploadedVideoCount ) {
		return null;
	}

	if ( ! storageUsed ) {
		return <VideoStorageMeter { ...props } used={ 0 } total={ 1 } />;
	}

	return <VideoStorageMeter { ...props } used={ storageUsed } total={ total } />;
};

export default VideoStorageMeter;
