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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useFileBrowserContext } from './file-browser-context';
import FilePreview from './file-preview';
import { useBackupPathInfoQuery } from './use-backup-path-info-query';
import { convertBytes } from './util';
import type { FileBrowserItem } from '../../../data/types';

// Download is wired up in phase B; Restore in phase C. Phase A renders
// the buttons disabled with a tooltip so the info card's layout stays
// Calypso-identical and the phased diffs land as single-line edits.
const DOWNLOAD_ENABLED = false;
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

function FileInfoCard( { item, rewindId }: FileInfoCardProps ) {
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

	const downloadButton = (
		<Tooltip text={ COMING_SOON_TEXT }>
			<Button
				className="file-card__action"
				variant="secondary"
				size="compact"
				disabled={ ! DOWNLOAD_ENABLED }
				accessibleWhenDisabled
			>
				{ __( 'Download file', 'jetpack-backup-pkg' ) }
			</Button>
		</Tooltip>
	);

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
								{ downloadButton }
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
