/**
 * External dependencies
 */
import { useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { VideoDetailsCardProps } from './types';
import type React from 'react';

/**
 * Video Details Card component
 *
 * @param {VideoDetailsCardProps} props - Component props.
 * @returns {React.ReactNode} - VideoDetailsCard react component.
 */
const VideoDetailsCard: React.FC< VideoDetailsCardProps > = ( {
	className,
	thumbnail,
	filename,
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles.small ]: isSm,
			} ) }
		>
			<img
				className={ styles.thumbnail }
				src={ thumbnail }
				alt={ __( 'Video thumbnail', 'jetpack-videopress-pkg' ) }
			/>

			<div className={ styles.details }>
				<div className={ styles[ 'detail-row' ] }>
					<Text variant="body-small">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
					<input value={ filename } />
				</div>

				<div>
					<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
					<Text variant="body">{ filename }</Text>
				</div>
			</div>
		</div>
	);
};

export default VideoDetailsCard;
