/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import {
	Button,
	CheckboxControl,
	Icon,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useFileBrowserContext } from './file-browser-context';
import FileInfoCard from './file-info-card';
import FileTypeIcon from './file-type-icon';
import { useTruncatedFileName } from './hooks';
import { useBackupContentsQuery } from './use-backup-contents-query';
import type { FileBrowserConfig } from './index';
import type { FileBrowserItem, FileBrowserCheckState } from '../../../data/types';

interface FileBrowserNodeProps {
	item: FileBrowserItem;
	path: string;
	rewindId: string;
	isAlternate: boolean;
	setActiveNodePath: ( path: string ) => void;
	activeNodePath: string;
	parentItem?: FileBrowserItem;
	fileBrowserConfig?: FileBrowserConfig;
	hasCredentials?: boolean;
	onTrackEvent?: ( eventName: string, properties?: Record< string, unknown > ) => void;
	onRequestGranularRestore?: ( rewindId: string ) => void;
}

/**
 *
 * @param root0
 * @param root0.item
 * @param root0.path
 * @param root0.rewindId
 * @param root0.isAlternate
 * @param root0.setActiveNodePath
 * @param root0.activeNodePath
 * @param root0.parentItem
 * @param root0.fileBrowserConfig
 * @param root0.hasCredentials
 * @param root0.onTrackEvent
 * @param root0.onRequestGranularRestore
 */
function FileBrowserNode( {
	item,
	path,
	rewindId,
	isAlternate,
	setActiveNodePath,
	activeNodePath,
	parentItem,
	fileBrowserConfig,
	hasCredentials,
	onTrackEvent,
	onRequestGranularRestore,
}: FileBrowserNodeProps ) {
	const spinnerStyles = {
		left: { width: '14px', height: '14px', margin: 0, padding: 0 },
		right: { width: '14px', height: '14px', margin: 0 },
	};

	const { fileBrowserState } = useFileBrowserContext();
	const isRoot = path === '/';
	const isCurrentNodeClicked = activeNodePath === path;
	const showFileCard = fileBrowserConfig?.showFileCard ?? true;
	const showSeparateExpandButton = fileBrowserConfig?.showSeparateExpandButton ?? false;
	const applyFiltering = !! fileBrowserConfig;
	const [ fetchContentsOnMount, setFetchContentsOnMount ] = useState< boolean >( isRoot );
	const [ isOpen, setIsOpen ] = useState< boolean >( isRoot );
	const [ addedAnyChildren, setAddedAnyChildren ] = useState< boolean >( false );
	const { getNode, addChildNodes, setNodeCheckState } = fileBrowserState;
	const browserNodeItem = getNode( path, Number( rewindId ) );
	const expandIcon = isRTL() ? chevronLeft : chevronRight;
	const expandDirectoriesOnClick = fileBrowserConfig?.expandDirectoriesOnClick ?? true;

	const {
		isSuccess,
		isLoading,
		data: backupFiles,
	} = useBackupContentsQuery( rewindId, path, fetchContentsOnMount );

	const shouldAddChildNode = useCallback(
		( childItem: FileBrowserItem ) => {
			// WordPress core isn't restorable — no checkbox, no child node.
			if ( childItem.type === 'wordpress' ) {
				return false;
			}
			if ( childItem.type !== 'archive' ) {
				return true;
			}
			if ( childItem.extensionType === 'changed' ) {
				return false;
			}
			if ( ! item.extensionVersion ) {
				return false;
			}
			return true;
		},
		[ item.extensionVersion ]
	);

	const shouldRestrictChildren = useCallback(
		( childItem: FileBrowserItem ) => {
			if (
				fileBrowserConfig?.restrictedTypes &&
				fileBrowserConfig?.restrictedTypes.includes( childItem.type )
			) {
				return true;
			}
			return false;
		},
		[ fileBrowserConfig?.restrictedTypes ]
	);

	const addChildrenWhenLoaded = useCallback(
		( parentPath: string, files: FileBrowserItem[] ) => {
			if ( files ) {
				addChildNodes( parentPath, files.filter( shouldAddChildNode ), Number( rewindId ) );
			}
		},
		[ addChildNodes, rewindId, shouldAddChildNode ]
	);

	const updateNodeCheckState = useCallback(
		( nodePath: string, checkState: FileBrowserCheckState ) => {
			setNodeCheckState( nodePath, checkState, Number( rewindId ) );
		},
		[ rewindId, setNodeCheckState ]
	);

	useEffect( () => {
		if ( isSuccess ) {
			if ( item.hasChildren && ! addedAnyChildren && backupFiles ) {
				addChildrenWhenLoaded( path, backupFiles );
				setAddedAnyChildren( true );
			}
		}
	}, [ addChildrenWhenLoaded, addedAnyChildren, backupFiles, isSuccess, item.hasChildren, path ] );

	useEffect( () => {
		if ( ! isCurrentNodeClicked && ! isRoot ) {
			setIsOpen( false );
		}
	}, [ isCurrentNodeClicked, isRoot ] );

	const onCheckboxChange = useCallback( () => {
		updateNodeCheckState(
			path,
			browserNodeItem && browserNodeItem.checkState === 'unchecked' ? 'checked' : 'unchecked'
		);
	}, [ path, browserNodeItem, updateNodeCheckState ] );

	const handleClick = useCallback( () => {
		if ( ! isOpen ) {
			setFetchContentsOnMount( true );
			if ( item.type !== 'dir' && onTrackEvent ) {
				onTrackEvent( 'jetpack_backup_browser_view_file', { file_type: item.type } );
			}
		}

		if ( ! showFileCard ) {
			onCheckboxChange();
		}

		if ( ! item.hasChildren ) {
			if ( ! isOpen ) {
				setActiveNodePath( path );
			} else {
				setActiveNodePath( '' );
			}
		}

		if ( expandDirectoriesOnClick ) {
			setIsOpen( ! isOpen );
		}
	}, [
		expandDirectoriesOnClick,
		isOpen,
		item,
		path,
		setActiveNodePath,
		onCheckboxChange,
		showFileCard,
		onTrackEvent,
	] );

	const handleExpandButtonClick = useCallback( () => {
		if ( ! isOpen ) {
			setFetchContentsOnMount( true );
		}
		setIsOpen( ! isOpen );
	}, [ isOpen ] );

	const filterItems = useCallback(
		( candidate: FileBrowserItem ) => {
			if ( ! applyFiltering ) {
				return true;
			}
			if ( fileBrowserConfig?.alwaysInclude?.includes( candidate.name ) ) {
				return true;
			}
			if ( fileBrowserConfig?.excludeTypes?.includes( candidate.type ) ) {
				return false;
			}
			if ( isRoot && fileBrowserConfig?.restrictedPaths?.includes( candidate.name ) ) {
				return true;
			}
			if (
				fileBrowserConfig?.restrictedPaths &&
				fileBrowserConfig.restrictedPaths.some( restrictedPath => path.includes( restrictedPath ) )
			) {
				return true;
			}
			return false;
		},
		[
			applyFiltering,
			fileBrowserConfig?.alwaysInclude,
			fileBrowserConfig?.excludeTypes,
			fileBrowserConfig?.restrictedPaths,
			isRoot,
			path,
		]
	);

	const renderChildren = () => {
		if ( isLoading ) {
			return (
				<>
					<div className="file-browser-node__loading placeholder" />
					<div className="file-browser-node__loading placeholder" />
					<div className="file-browser-node__loading placeholder" />
				</>
			);
		}

		if ( isSuccess && addedAnyChildren && backupFiles ) {
			let childIsAlternate = isAlternate;

			const renderedChildren = backupFiles.filter( filterItems ).map( childItem => {
				if (
					( childItem.type === 'archive' && ! item.extensionVersion ) ||
					childItem.extensionType === 'changed'
				) {
					return null;
				}

				childIsAlternate = ! childIsAlternate;

				return (
					<div
						key={ childItem.name }
						style={ isRoot ? { marginInlineStart: 0 } : { marginInlineStart: 26 } }
					>
						<FileBrowserNode
							item={ childItem }
							path={ `${ path }${ childItem.name }/` }
							rewindId={ rewindId }
							isAlternate={ childIsAlternate }
							activeNodePath={ activeNodePath }
							setActiveNodePath={ setActiveNodePath }
							fileBrowserConfig={ fileBrowserConfig }
							hasCredentials={ hasCredentials }
							onTrackEvent={ onTrackEvent }
							onRequestGranularRestore={ onRequestGranularRestore }
							{ ...( childItem.type === 'archive' ? { parentItem: item } : {} ) }
						/>
					</div>
				);
			} );

			if ( renderedChildren.length === 0 ) {
				return (
					<Text
						variant="muted"
						style={ {
							marginInlineStart: showSeparateExpandButton ? 36 : 63,
							fontStyle: 'italic',
						} }
					>
						{ __( 'Empty', 'jetpack-backup-pkg' ) }
					</Text>
				);
			}

			return renderedChildren;
		}

		return null;
	};

	const renderCheckbox = () => {
		if ( item.type === 'wordpress' ) {
			return null;
		}

		return (
			<CheckboxControl
				__nextHasNoMarginBottom
				checked={ browserNodeItem?.checkState === 'checked' }
				indeterminate={ browserNodeItem?.checkState === 'mixed' }
				onChange={ onCheckboxChange }
				/* translators: %s is a file or directory name */
				aria-label={ sprintf( __( 'Select %s', 'jetpack-backup-pkg' ), item.name ) }
			/>
		);
	};

	const buttonExpandIcon = () => {
		if ( ! item.hasChildren || shouldRestrictChildren( item ) ) {
			return null;
		}
		if ( isLoading && isOpen ) {
			return <Spinner style={ spinnerStyles.left } />;
		}
		return <Icon icon={ isOpen ? chevronDown : expandIcon } />;
	};

	const expandButton = () => {
		if ( isLoading && isOpen ) {
			return (
				<div
					className="file-browser-node__separate-expand-button"
					style={ { padding: '6px', color: 'inherit' } }
				>
					<Spinner style={ spinnerStyles.right } />
				</div>
			);
		}

		return (
			<Button
				onClick={ handleExpandButtonClick }
				icon={ isOpen ? chevronDown : expandIcon }
				className="file-browser-node__separate-expand-button"
				variant="tertiary"
				/* translators: %s is a directory name */
				aria-label={ sprintf( __( 'Expand contents of %s', 'jetpack-backup-pkg' ), item.name ) }
				aria-expanded={ isOpen }
				size="compact"
				style={ { color: 'inherit' } }
			/>
		);
	};

	const nodeItemClassName = clsx( 'file-browser-node__item', {
		'is-alternate': isAlternate,
	} );
	const [ label, isLabelTruncated ] = useTruncatedFileName( item.name, 30, item.type );

	const nodeClassName = clsx( 'file-browser-node', item.type, {
		'is-root': isRoot,
	} );

	const renderSeparateExpandButton =
		showSeparateExpandButton && item.hasChildren && ! shouldRestrictChildren( item );

	return (
		<VStack className={ nodeClassName } spacing={ 0.5 }>
			{ ! isRoot && (
				<HStack className={ nodeItemClassName } justify="flex-start" spacing={ 0 }>
					{ renderCheckbox() }
					<Button
						icon={ renderSeparateExpandButton ? null : buttonExpandIcon }
						className="file-browser-node__title"
						onClick={ handleClick }
						showTooltip={ isLabelTruncated }
						label={ item.name }
						variant="tertiary"
						tabIndex={ showSeparateExpandButton && ! showFileCard ? -1 : 0 }
						size="compact"
						style={ { color: 'inherit' } }
					>
						<FileTypeIcon type={ item.type } /> { label }
					</Button>
					{ renderSeparateExpandButton && expandButton() }
				</HStack>
			) }
			{ isCurrentNodeClicked && showFileCard && (
				<FileInfoCard
					rewindId={ rewindId }
					item={ item }
					parentItem={ parentItem }
					path={ path }
					hasCredentials={ hasCredentials }
					onTrackEvent={ onTrackEvent }
					onRequestGranularRestore={ onRequestGranularRestore }
				/>
			) }
			{ isOpen && (
				<>
					{ item.hasChildren && ! shouldRestrictChildren( item ) && (
						<VStack className="file-browser-node__contents" spacing={ 1 }>
							{ renderChildren() }
						</VStack>
					) }
				</>
			) }
		</VStack>
	);
}

export default FileBrowserNode;
