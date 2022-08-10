import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, cloudUpload } from '@wordpress/icons';
import classnames from 'classnames';
import { DragEvent, useCallback, useState } from 'react';
import Button from '../button';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
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

	const handleClickEvent = useCallback( () => {
		const input = document.createElement( 'input' );
		input.type = 'file';

		input.addEventListener( 'change', ( e: Event ) => {
			const target = e.target as HTMLInputElement;
			onSelectFile( target.files[ 0 ] );
			input.remove();
		} );

		input.click();
	}, [ onSelectFile ] );

	const handleDragOverEvent = useCallback( ( event: DragEvent< HTMLDivElement > ) => {
		event.preventDefault();
		setIsDraggingOver( true );
	}, [] );

	const handleDragLeaveEvent = useCallback( () => {
		setIsDraggingOver( false );
	}, [] );

	const handleDropEvent = useCallback(
		( event: DragEvent< HTMLDivElement > ) => {
			event.preventDefault();

			const { files } = event.dataTransfer;
			if ( files.length > 1 ) {
				throw new Error( __( 'Only one file allowed', 'jetpack' ) );
			}

			onSelectFile( files[ 0 ] );
			setIsDraggingOver( false );
		},
		[ onSelectFile ]
	);

	return isLoading ? (
		<div className={ classnames( styles.wrapper, className, { [ styles.small ]: isSm } ) }>
			<div className={ classnames( styles.row, styles.loader ) }>
				<Spinner></Spinner>
			</div>
			<div className={ classnames( styles.row ) }>
				<Text variant="title-small">{ __( 'Uploading', 'jetpack' ) }</Text>
			</div>
		</div>
	) : (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles.small ]: isSm,
				[ styles.hover ]: isDraggingOver,
			} ) }
			onDrop={ handleDropEvent }
			onDragOver={ handleDragOverEvent }
			onDragLeave={ handleDragLeaveEvent }
		>
			<div className={ classnames( styles.row ) }>
				<Icon icon={ cloudUpload } size={ 48 } className={ classnames( styles.icon ) }></Icon>
			</div>
			<div className={ classnames( styles.row ) }>
				<Text variant="title-small">{ __( 'Drag and drop your video here', 'jetpack' ) }</Text>
			</div>
			<div className={ classnames( styles.row ) }>
				<Button
					variant="secondary"
					className={ classnames( styles.button ) }
					onClick={ handleClickEvent }
					disabled={ isDraggingOver }
				>
					{ __( 'Select file to upload', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
};

export default VideoUploadArea;
