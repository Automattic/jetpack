/**
 * External dependencies
 */
import { Button, useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, cloudUpload } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { fileInputExtensions } from '../../../utils/video-extensions';
import useSelectVideoFiles from '../../hooks/use-select-video-files';
import styles from './style.module.scss';
import { VideoUploadAreaProps } from './types';
/**
 * Types
 */
import type { ReactNode } from 'react';

/**
 * Video Upload Area component
 *
 * @param {VideoUploadAreaProps} props - Component props.
 * @returns {ReactNode} - VideoUploadArea react component.
 */
const VideoUploadArea = ( { className, onSelectFiles }: VideoUploadAreaProps ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { inputRef, handleFileInputChangeEvent } = useSelectVideoFiles( { onSelectFiles } );

	const handleClickEvent = () => {
		inputRef.current.click();
	};

	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles.small ]: isSm,
			} ) }
		>
			<input
				ref={ inputRef }
				type="file"
				accept={ fileInputExtensions }
				className={ classnames( styles[ 'file-input' ] ) }
				onChange={ handleFileInputChangeEvent }
			/>
			<Icon icon={ cloudUpload } size={ 48 } className={ classnames( styles.icon ) } />
			<Text variant="title-small">
				{ __( 'Drag and drop your video here', 'jetpack-videopress-pkg' ) }
			</Text>
			<Button
				size="small"
				variant="secondary"
				className={ classnames( styles.button ) }
				onClick={ handleClickEvent }
			>
				{ __( 'Select file to upload', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
};

export default VideoUploadArea;
