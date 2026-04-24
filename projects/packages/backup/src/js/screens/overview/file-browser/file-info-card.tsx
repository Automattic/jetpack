/* eslint-disable jsdoc/require-jsdoc */

import {
	Button,
	Card,
	CardBody,
	Tooltip,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchBackupExtensionUrl, fetchBackupFileUrl } from '../../../data/fetchers';
import { useFileBrowserContext } from './file-browser-context';
import FilePreview from './file-preview';
import { useBackupPathInfoQuery } from './use-backup-path-info-query';
import { PREPARE_DOWNLOAD_STATUS, usePrepareDownload } from './use-prepare-download';
import { convertBytes, encodeToBase64 } from './util';
import type { FileBrowserItem } from '../../../data/types';

// Restore is wired up in phase C. For now the button stays disabled
// with the Coming soon tooltip; phase C flips RESTORE_ENABLED and
// removes the tooltip.
const RESTORE_ENABLED = false;
const COMING_SOON_TEXT = __(
	'Coming soon in Jetpack Backup. For now, you can manage this action on WordPress.com.',
	'jetpack-backup-pkg'
);

interface FileInfoCardProps {
	item: FileBrowserItem;
	rewindId: string;
	parentItem?: FileBrowserItem;
	path: string;
	hasCredentials?: boolean;
	onTrackEvent?: ( eventName: string, properties?: Record< string, unknown > ) => void;
	onRequestGranularRestore?: ( rewindId: string ) => void;
}

function FileInfoCard( { item, rewindId, parentItem, onTrackEvent }: FileInfoCardProps ) {
	const { locale, notices } = useFileBrowserContext();

	const {
		isSuccess,
		isLoading,
		isError,
		data: fileInfo,
	} = useBackupPathInfoQuery(
		item.period ?? '',
		item.manifestPath ?? '',
		item.extensionType ?? ''
	);

	const modifiedTime = fileInfo?.mtime
		? new Intl.DateTimeFormat( locale, {
				dateStyle: 'medium',
				timeStyle: 'short',
		  } ).format( new Date( fileInfo.mtime * 1000 ) )
		: null;
	const size = fileInfo?.size !== undefined ? convertBytes( fileInfo.size ) : null;

	const [ isProcessingDownload, setIsProcessingDownload ] = useState< boolean >( false );

	const handleDownloadError = useCallback( () => {
		setIsProcessingDownload( false );
		notices?.showError(
			__( 'There was an error processing your download. Please try again.', 'jetpack-backup-pkg' )
		);
	}, [ notices ] );

	const handlePrepareDownloadError = useCallback( () => {
		notices?.showError(
			__( 'There was an error preparing your download. Please try again.', 'jetpack-backup-pkg' )
		);
	}, [ notices ] );

	const { prepareDownload, prepareDownloadStatus, downloadUrl } = usePrepareDownload(
		handlePrepareDownloadError
	);

	const triggerFileDownload = useCallback( ( fileUrl: string ) => {
		const link = document.createElement( 'a' );
		link.href = fileUrl;
		link.click();
	}, [] );

	const trackWordPressDownload = useCallback( () => {
		onTrackEvent?.( 'jetpack_backup_browser_download', { file_type: item.type } );
	}, [ onTrackEvent, item.type ] );

	// Regular file download: resolve the one-time signed URL from the
	// file-url endpoint, force `disposition=attachment` so the browser
	// downloads the file instead of navigating to it, then click a
	// synthetic <a>. Mirrors Calypso's downloadFile for non-archive types.
	const downloadFile = useCallback( () => {
		setIsProcessingDownload( true );

		if ( item.type !== 'archive' && item.period && item.manifestPath ) {
			const encoded = encodeToBase64( item.manifestPath );
			fetchBackupFileUrl( { rewindId: item.period, encodedManifestPath: encoded } )
				.then( response => {
					if ( ! response.url ) {
						handleDownloadError();
						return;
					}
					const url = new URL( response.url );
					url.searchParams.append( 'disposition', 'attachment' );
					triggerFileDownload( url.toString() );
					setIsProcessingDownload( false );
					onTrackEvent?.( 'jetpack_backup_browser_download', { file_type: item.type } );
				} )
				.catch( handleDownloadError );
			return;
		}

		// Archive path (plugin/theme). fileInfo.dataType disambiguates
		// plugin (2) vs theme (anything else, matches Calypso's default
		// branch).
		if ( ! fileInfo || ! parentItem || ! parentItem.extensionVersion ) {
			handleDownloadError();
			return;
		}
		const archiveType = fileInfo.dataType === 2 ? 'plugin' : 'theme';
		fetchBackupExtensionUrl( {
			period: Math.round( Number( rewindId ) ).toString(),
			archiveType,
			extensionSlug: parentItem.name,
			extensionVersion: parentItem.extensionVersion,
		} )
			.then( response => {
				if ( ! response.url ) {
					handleDownloadError();
					return;
				}
				triggerFileDownload( response.url );
				setIsProcessingDownload( false );
				onTrackEvent?.( 'jetpack_backup_browser_download', { file_type: archiveType } );
			} )
			.catch( handleDownloadError );
	}, [
		fileInfo,
		handleDownloadError,
		item,
		parentItem,
		rewindId,
		triggerFileDownload,
		onTrackEvent,
	] );

	// Table download goes through the filtered-prepare + poll-status path.
	// Once a URL lands the useEffect below triggers the browser download.
	const prepareDownloadClick = useCallback( () => {
		if ( ! item.period || ! fileInfo?.manifestFilter || fileInfo?.dataType === undefined ) {
			handlePrepareDownloadError();
			return;
		}
		prepareDownload( item.period, fileInfo.manifestFilter, fileInfo.dataType );
	}, [ item.period, fileInfo, prepareDownload, handlePrepareDownloadError ] );

	useEffect( () => {
		if ( prepareDownloadStatus === PREPARE_DOWNLOAD_STATUS.PREPARING ) {
			setIsProcessingDownload( true );
		} else {
			setIsProcessingDownload( false );
		}

		if ( prepareDownloadStatus === PREPARE_DOWNLOAD_STATUS.READY ) {
			if ( ! downloadUrl ) {
				handleDownloadError();
				return;
			}
			triggerFileDownload( downloadUrl );
			onTrackEvent?.( 'jetpack_backup_browser_download', { file_type: item.type } );
		}
	}, [
		downloadUrl,
		handleDownloadError,
		item.type,
		prepareDownloadStatus,
		triggerFileDownload,
		onTrackEvent,
	] );

	useEffect( () => {
		if ( isError ) {
			notices?.showError(
				__(
					'There was an error retrieving your file information. Please try again.',
					'jetpack-backup-pkg'
				)
			);
		}
	}, [ notices, isError ] );

	const showActions =
		item.type !== 'archive' || ( item.type === 'archive' && item.extensionType === 'unchanged' );

	if ( item.hasChildren ) {
		return null;
	}

	if ( isLoading ) {
		return <div className="file-browser-node__loading placeholder" />;
	}

	if ( ! isSuccess ) {
		return null;
	}

	// Three button shapes matching Calypso: direct-link for WordPress core
	// (the path-info endpoint pre-signs a URL), filtered-prepare for
	// tables (polls until ready), signed-URL fetch for everything else.
	const downloadFileButton = (
		<Button
			className="file-card__action"
			onClick={ downloadFile }
			disabled={ isProcessingDownload }
			isBusy={ isProcessingDownload }
			variant="secondary"
			size="compact"
		>
			{ isProcessingDownload
				? __( 'Preparing', 'jetpack-backup-pkg' )
				: __( 'Download file', 'jetpack-backup-pkg' ) }
		</Button>
	);

	const downloadWordPressButton = (
		<Button
			className="file-card__action"
			href={ fileInfo.downloadUrl }
			onClick={ trackWordPressDownload }
			variant="secondary"
			size="compact"
		>
			{ __( 'Download file', 'jetpack-backup-pkg' ) }
		</Button>
	);

	const prepareDownloadButton = (
		<Button
			className="file-card__action"
			onClick={ prepareDownloadClick }
			disabled={ isProcessingDownload }
			isBusy={ isProcessingDownload }
			variant="secondary"
			size="compact"
		>
			{ isProcessingDownload
				? __( 'Preparing', 'jetpack-backup-pkg' )
				: __( 'Download file', 'jetpack-backup-pkg' ) }
		</Button>
	);

	const renderDownloadButton = () => {
		if ( item.type === 'wordpress' ) {
			return downloadWordPressButton;
		}
		if ( item.type === 'table' ) {
			return prepareDownloadButton;
		}
		return downloadFileButton;
	};

	const restoreButton = (
		<Tooltip text={ COMING_SOON_TEXT }>
			<Button
				variant="primary"
				size="compact"
				disabled={ ! RESTORE_ENABLED }
				accessibleWhenDisabled
			>
				{ __( 'Restore', 'jetpack-backup-pkg' ) }
			</Button>
		</Tooltip>
	);

	const FileDetail = ( { label, value }: { label: string; value: string | number } ) => {
		return (
			<HStack className="file-card__detail" justify="flex-start" spacing={ 1 }>
				<Text weight={ 700 }>{ label }</Text>
				<Text>{ value }</Text>
			</HStack>
		);
	};

	const hasMeta = item.type === 'table' || size || modifiedTime || fileInfo?.hash;

	return (
		<Card isRounded={ false } isBorderless className="file-card">
			<CardBody className="file-card__body">
				<VStack>
					<HStack wrap style={ { alignItems: 'flex-start' } }>
						{ hasMeta && (
							<VStack spacing={ 1 }>
								{ item.type === 'table' && (
									<FileDetail
										label={ __( 'Rows:', 'jetpack-backup-pkg' ) }
										value={ item.rowCount ?? 0 }
									/>
								) }
								{ size && (
									<FileDetail
										label={ __( 'Size:', 'jetpack-backup-pkg' ) }
										value={ `${ size.unitAmount } ${ size.unit }` }
									/>
								) }
								{ modifiedTime && (
									<FileDetail
										label={ __( 'Modified:', 'jetpack-backup-pkg' ) }
										value={ modifiedTime }
									/>
								) }
								{ fileInfo?.hash && (
									<FileDetail
										label={ __( 'Hash:', 'jetpack-backup-pkg' ) }
										value={ fileInfo.hash }
									/>
								) }
							</VStack>
						) }
						{ showActions && (
							<HStack
								spacing={ 1 }
								justify="flex-end"
								style={ { width: 'auto', flexShrink: 0 } }
								alignment="top"
							>
								{ renderDownloadButton() }
								{ item.type !== 'wordpress' && restoreButton }
							</HStack>
						) }
					</HStack>
					{ fileInfo?.size !== undefined && fileInfo.size > 0 && (
						<FilePreview item={ item } rewindId={ rewindId } onTrackEvent={ onTrackEvent } />
					) }
				</VStack>
			</CardBody>
		</Card>
	);
}

export default FileInfoCard;
