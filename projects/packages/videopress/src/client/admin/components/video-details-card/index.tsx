/**
 * External dependencies
 */
import { useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
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
	src,
	uploadDate,
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const formattedUploadDate = gmdateI18n( 'F j, Y', uploadDate );

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
					<ClipboardButtonInput value={ src } />
				</div>

				<div>
					<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
					<Text variant="body">{ filename }</Text>
				</div>

				<div>
					<Text variant="body-small">{ __( 'Upload date', 'jetpack-videopress-pkg' ) }</Text>
					<Text variant="body">{ formattedUploadDate }</Text>
				</div>
			</div>
		</div>
	);
};

export default VideoDetailsCard;
