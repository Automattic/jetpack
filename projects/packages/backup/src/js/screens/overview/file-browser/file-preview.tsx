/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
	Icon,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import { fetchBackupFileContent } from '../../../data/fetchers';
import { useBackupFileQuery } from './use-backup-file-query';
import { encodeToBase64 } from './util';
import type { FileBrowserItem } from '../../../data/types';

interface FilePreviewProps {
	item: FileBrowserItem;
	rewindId: string;
	onTrackEvent?: ( eventName: string, properties?: Record< string, unknown > ) => void;
}

/**
 *
 * @param root0
 * @param root0.item
 * @param root0.rewindId
 * @param root0.onTrackEvent
 */
function FilePreview( { item, rewindId, onTrackEvent }: FilePreviewProps ) {
	const [ fileContent, setFileContent ] = useState( '' );
	const [ contentError, setContentError ] = useState( false );
	const [ showSensitivePreview, setShowSensitivePreview ] = useState( false );

	const validTypes = [ 'text', 'code', 'audio', 'image', 'video' ];
	const isValidType = validTypes.includes( item.type );

	// wp-config.php is the only path Calypso flags as sensitive — same
	// manifest-prefix test here so the "Show preview" gate matches.
	const isSensitive = item.manifestPath === 'f5:/wp-config.php';

	const isTextContent = item.type === 'text' || item.type === 'code';
	const shouldPreviewFile =
		isValidType && ( ! isSensitive || ( isSensitive && showSensitivePreview ) );

	const {
		isSuccess,
		isError,
		isLoading: isQueryLoading,
		data,
	} = useBackupFileQuery( rewindId, item.manifestPath, shouldPreviewFile );

	const handleShowPreviewClick = useCallback( () => {
		setShowSensitivePreview( true );
		onTrackEvent?.( 'jetpack_backup_browser_preview_file_sensitive_click' );
	}, [ onTrackEvent ] );

	// For text/code previews we can't fetch the signed stream URL
	// directly — WPCOM's stream endpoint doesn't set CORS headers, so a
	// browser-side `fetch()` from wp-admin fails. Call our
	// `/site/backup/file-content` bridge instead, which resolves the URL
	// and fetches the body server-side.
	useEffect( () => {
		if ( ! shouldPreviewFile || ! isTextContent || ! item.manifestPath ) {
			return;
		}
		setContentError( false );
		fetchBackupFileContent( {
			rewindId,
			encodedManifestPath: encodeToBase64( item.manifestPath ),
		} ).then(
			response => setFileContent( response.content ?? '' ),
			() => setContentError( true )
		);
	}, [ shouldPreviewFile, isTextContent, item.manifestPath, rewindId ] );

	if ( isSensitive && ! showSensitivePreview ) {
		return (
			<VStack className="file-card__preview-sensitive" alignment="center">
				<Icon icon={ unseen } />
				<Text as="p">
					{ __(
						'This preview is hidden because it contains sensitive information.',
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button size="compact" variant="secondary" onClick={ handleShowPreviewClick }>
					{ __( 'Show preview', 'jetpack-backup-pkg' ) }
				</Button>
			</VStack>
		);
	}

	if ( ! shouldPreviewFile ) {
		return null;
	}

	const renderFileContent = () => {
		let content;

		switch ( item.type ) {
			case 'text':
			case 'code':
				content = (
					<Text as="pre" style={ { backgroundColor: '#f0f0f0' } }>
						{ fileContent }
					</Text>
				);
				break;
			case 'image':
				content = <img src={ data?.url } alt="file-preview" />;
				break;
			case 'audio':
				content = (
					<audio controls style={ { width: '100%' } }>
						<source src={ data?.url } type="audio/mpeg" />
					</audio>
				);
				break;
			case 'video':
				content = (
					<video controls style={ { width: '100%' } }>
						<source src={ data?.url } type="video/mp4" />
					</video>
				);
				break;
		}

		onTrackEvent?.( 'jetpack_backup_browser_preview_file', { file_type: item.type } );
		return content;
	};

	const isLoading = isTextContent ? ! fileContent && ! contentError && ! isError : isQueryLoading;
	const isReady = isTextContent ? fileContent : isSuccess;
	const hasError = isTextContent ? contentError || isError : isError;

	return (
		<div className="file-card__preview">
			{ isLoading && <div className="file-browser-node__loading placeholder" /> }
			{ isReady ? renderFileContent() : null }
			{ hasError && ! isLoading && (
				<Text variant="muted">
					{ __( 'Preview unavailable for this file.', 'jetpack-backup-pkg' ) }
				</Text>
			) }
		</div>
	);
}

export default FilePreview;
