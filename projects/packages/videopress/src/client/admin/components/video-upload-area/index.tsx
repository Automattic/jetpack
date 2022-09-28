/**
 * External dependencies
 */
import { Button, useBreakpointMatch, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, cloudUpload } from '@wordpress/icons';
import classnames from 'classnames';
import { DragEvent, useCallback, useState, useRef, ChangeEvent } from 'react';
/**
 * Internal dependencies
 */
import { ReactNode } from 'react';
import { VIDEO_EXTENSIONS } from '../../../state/constants';
import styles from './style.module.scss';
import { VideoUploadAreaProps } from './types';

const inputExtensions = VIDEO_EXTENSIONS.map( extension => `.${ extension }` ).join( ',' );

/**
 * Video Upload Area component
 *
 * @param {VideoUploadAreaProps} props - Component props.
 * @returns {ReactNode} - VideoUploadArea react component.
 */
const VideoUploadArea = ( { className, onSelectFiles }: VideoUploadAreaProps ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const inputRef = useRef( null );

	const handleFileInputChangeEvent = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			onSelectFiles( Array.from( e.currentTarget.files ) );
		},
		[ onSelectFiles ]
	);

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

			const files = Array.from( event.dataTransfer.files ).filter( file => {
				return VIDEO_EXTENSIONS.some( extension => file.name.endsWith( extension ) );
			} );

			onSelectFiles( files );
		},
		[ onSelectFiles ]
	);

	return (
		<div
			className={ classnames( styles.wrapper, className, {
				[ styles.small ]: isSm,
				[ styles.hover ]: isDraggingOver,
			} ) }
			onDrop={ handleDropEvent }
			onDragOver={ handleDragOverEvent }
			onDragLeave={ handleDragLeaveEvent }
		>
			<input
				ref={ inputRef }
				type="file"
				accept={ inputExtensions }
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
		</div>
	);
};

export default VideoUploadArea;
