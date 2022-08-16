import { Button, useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, cloudUpload } from '@wordpress/icons';
import classnames from 'classnames';
import { DragEvent, useCallback, useState, useRef, useEffect } from 'react';
import styles from './style.module.scss';
import { VideoUploadAreaProps } from './types';
import type React from 'react';

/**
 * Video Upload Area component
 *
 * @param {VideoUploadAreaProps} props - Component props.
 * @returns {React.ReactNode} - VideoUploadArea react component.
 */
const VideoUploadArea: React.FC< VideoUploadAreaProps > = ( {
	isLoading = false,
	className,
	onSelectFile,
} ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const inputRef = useRef( null );

	const handleFileInputChangeEvent = useCallback( ( e: Event ) => {
		const target = e.target as HTMLInputElement;
		onSelectFile( target.files[ 0 ] );
	} );

	const handleClickEvent = useCallback( () => {
		inputRef.current.click();
	}, [] );

	const handleDragOverEvent = useCallback( ( event: DragEvent< HTMLInputElement > ) => {
		event.preventDefault();
		setIsDraggingOver( true );
	}, [] );

	const handleDragLeaveEvent = useCallback( () => {
		setIsDraggingOver( false );
	}, [] );

	const handleDropEvent = useCallback(
		( event: DragEvent< HTMLInputElement > ) => {
			event.preventDefault();
			setIsDraggingOver( false );

			const { files } = event.dataTransfer;
			if ( files.length > 1 ) {
				throw new Error( __( 'Only one file allowed', 'jetpack-videopress-pkg' ) );
			}

			onSelectFile( files[ 0 ] );
		},
		[ onSelectFile ]
	);

	useEffect( () => {
		if ( isLoading ) {
			setIsDraggingOver( false );
		}
	}, [ isLoading ] );

	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles.small ]: isSm,
				[ styles.hover ]: isDraggingOver,
			} ) }
			{ ...( ! isLoading && {
				onDrop: handleDropEvent,
				onDragOver: handleDragOverEvent,
				onDragLeave: handleDragLeaveEvent,
			} ) }
		>
			{ isLoading ? (
				<>
					<Spinner className={ classnames( styles.loader ) } />
					<Text variant="title-small">{ __( 'Uploading', 'jetpack-videopress-pkg' ) }</Text>
				</>
			) : (
				<>
					<input
						ref={ inputRef }
						type="file"
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
						disabled={ isDraggingOver }
					>
						{ __( 'Select file to upload', 'jetpack-videopress-pkg' ) }
					</Button>
				</>
			) }
		</div>
	);
};

export default VideoUploadArea;
