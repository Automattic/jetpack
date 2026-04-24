/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { useState } from '@wordpress/element';
import FileBrowserHeader from './file-browser-header';
import FileBrowserNode from './file-browser-node';
import styles from './style.module.scss';
import type { FileBrowserItem } from '../../../data/types';

export interface FileBrowserConfig {
	restrictedPaths?: string[];
	restrictedTypes?: string[];
	excludeTypes?: string[];
	expandDirectoriesOnClick?: boolean;
	alwaysInclude?: string[];
	showFileCard?: boolean;
	showSeparateExpandButton?: boolean;
	showHeader?: boolean;
}

interface FileBrowserProps {
	rewindId: string;
	fileBrowserConfig?: FileBrowserConfig;
	hasCredentials?: boolean;
	onTrackEvent?: ( eventName: string, properties?: Record< string, unknown > ) => void;
	onRequestGranularRestore?: ( rewindId: string ) => void;
}

/**
 *
 * @param root0
 * @param root0.rewindId
 * @param root0.fileBrowserConfig
 * @param root0.hasCredentials
 * @param root0.onTrackEvent
 * @param root0.onRequestGranularRestore
 */
function FileBrowser( {
	rewindId,
	fileBrowserConfig,
	hasCredentials,
	onTrackEvent,
	onRequestGranularRestore,
}: FileBrowserProps ) {
	const [ activeNodePath, setActiveNodePath ] = useState< string >( '' );

	const rootItem: FileBrowserItem = {
		name: '/',
		hasChildren: true,
		type: 'dir',
	};

	return (
		<div className={ styles.root }>
			{ ( fileBrowserConfig?.showHeader ?? true ) && <FileBrowserHeader rewindId={ rewindId } /> }
			<FileBrowserNode
				rewindId={ rewindId }
				item={ rootItem }
				path="/"
				isAlternate
				setActiveNodePath={ setActiveNodePath }
				activeNodePath={ activeNodePath }
				fileBrowserConfig={ fileBrowserConfig }
				hasCredentials={ hasCredentials }
				onTrackEvent={ onTrackEvent }
				onRequestGranularRestore={ onRequestGranularRestore }
			/>
		</div>
	);
}

export default FileBrowser;
