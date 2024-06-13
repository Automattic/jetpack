/**
 * External dependencies
 */
import { Button, useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, captureVideo } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { fileInputExtensions } from '../../../utils/video-extensions';
import { usePlan } from '../../hooks/use-plan';
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
	const { hasVideoPressPurchase } = usePlan();

	const handleClickEvent = () => {
		inputRef.current.click();
	};

	return (
		<div
			className={ clsx( styles.wrapper, className, {
				[ styles.small ]: isSm,
			} ) }
		>
			<input
				ref={ inputRef }
				type="file"
				accept={ fileInputExtensions }
				className={ clsx( styles[ 'file-input' ] ) }
				onChange={ handleFileInputChangeEvent }
				multiple={ hasVideoPressPurchase }
			/>
			<Icon icon={ captureVideo } size={ 32 } className={ clsx( styles.icon ) } />
			<Text variant="title-small">
				{ __( 'Drag and drop your video here', 'jetpack-videopress-pkg' ) }
			</Text>
			<Button
				size="small"
				variant="secondary"
				className={ clsx( styles.button ) }
				onClick={ handleClickEvent }
			>
				{ __( 'Select file to upload', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
};

export default VideoUploadArea;
