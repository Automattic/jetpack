/**
 * WordPress dependencies
 */
import { Platform, useContext, useCallback, useState, useEffect } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore, useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../../utils';
import type { MediaItemUpdatable } from '../../types';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';
import MediaEditorSidebarDetails from './details';
import MediaEditorSidebarEdit from './edit';
import { getUnlock } from '../../utils/unlock';
import './style.scss';

export const MEDIA_EDITOR_SIDEBAR = 'core/edit-media';
export const MEDIA_EDITOR_SIDEBAR_DETAILS_TAB = 'core/edit-media/details';
export const MEDIA_EDITOR_SIDEBAR_EDIT_TAB = 'core/edit-media/edit';
const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
} );

const unlock = getUnlock();
const unlockedComponentsAPIs = unlock ? unlock( componentsPrivateApis ) : null;
const unlockedEditorAPIs = unlock ? unlock( editorPrivateApis ) : null;
const Tabs = unlockedComponentsAPIs?.Tabs;
const ComplementaryArea = unlockedEditorAPIs?.ComplementaryArea;
const interfaceStore = unlockedEditorAPIs?.interfaceStore;

function SidebarHeader( { mediaType }: { mediaType: string } ) {
	if ( ! Tabs ) {
		return null;
	}
	return (
		<Tabs.TabList>
			<Tabs.Tab tabId={ MEDIA_EDITOR_SIDEBAR_DETAILS_TAB }>
				{ __( 'Details', 'media-editor' ) }
			</Tabs.Tab>
			{ mediaType === 'image' && (
				<Tabs.Tab tabId={ MEDIA_EDITOR_SIDEBAR_EDIT_TAB }>
					{ __( 'Edit', 'media-editor' ) }
				</Tabs.Tab>
			) }
		</Tabs.TabList>
	);
}

function SidebarContent( {
	currentArea,
	isSidebarOpen,
	mediaType,
}: {
	currentArea: string;
	isSidebarOpen: boolean;
	mediaType: string;
} ) {
	if ( ! Tabs || ! ComplementaryArea || ! interfaceStore ) {
		return null;
	}

	const tabsContextValue = useContext( Tabs.Context );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	useEffect( () => {
		if ( isSidebarOpen ) {
			enableComplementaryArea( MEDIA_EDITOR_SIDEBAR, currentArea );
		}
	}, [ enableComplementaryArea, isSidebarOpen, currentArea, mediaType ] );

	return (
		<ComplementaryArea
			className="next-admin-media-editor-sidebar"
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SidebarHeader mediaType={ mediaType } />
				</Tabs.Context.Provider>
			}
			headerClassName="next-admin-media-editor-sidebar__tabs-header"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Media Editor', 'media-editor' ) }
			closeLabel={ __( 'Close Media Editor', 'media-editor' ) }
			scope="core/edit-media"
			identifier={ currentArea }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<div className="next-admin-media-editor-sidebar__tabs-panel">
					<Tabs.TabPanel tabId={ MEDIA_EDITOR_SIDEBAR_DETAILS_TAB } focusable={ false }>
						<MediaEditorSidebarDetails />
					</Tabs.TabPanel>
					{ mediaType === 'image' && (
						<Tabs.TabPanel tabId={ MEDIA_EDITOR_SIDEBAR_EDIT_TAB } focusable={ false }>
							<MediaEditorSidebarEdit />
						</Tabs.TabPanel>
					) }
				</div>
			</Tabs.Context.Provider>
		</ComplementaryArea>
	);
}

export default function Sidebar() {
	const postId = useEntityId( 'postType', 'attachment' );
	const post = useSelect(
		select => select( coreStore ).getEditedEntityRecord( 'postType', 'attachment', postId ),
		[ postId ]
	) as MediaItemUpdatable;
	const { setIsImageEditorOpen, isImageEditorOpen } = useMediaEditorState();
	const [ currentArea, setCurrentArea ] = useState( MEDIA_EDITOR_SIDEBAR_DETAILS_TAB );
	useEffect( () => {
		if ( isImageEditorOpen && currentArea !== MEDIA_EDITOR_SIDEBAR_EDIT_TAB ) {
			setCurrentArea( MEDIA_EDITOR_SIDEBAR_EDIT_TAB );
		}
		if ( ! isImageEditorOpen && currentArea !== MEDIA_EDITOR_SIDEBAR_DETAILS_TAB ) {
			setCurrentArea( MEDIA_EDITOR_SIDEBAR_DETAILS_TAB );
		}
	}, [ isImageEditorOpen, currentArea ] );

	if ( ! post ) {
		return null;
	}

	const mediaType = getMediaTypeFromMimeType( post?.mime_type || '' );

	// Fallback when private APIs are not available
	if ( ! Tabs || ! ComplementaryArea || ! interfaceStore ) {
		return (
			<div className="next-admin-media-editor-sidebar">
				<div className="next-admin-media-editor-sidebar__tabs-header">
					<h2>{ __( 'Media Editor', 'media-editor' ) }</h2>
				</div>
				<div className="next-admin-media-editor-sidebar__tabs-panel">
					{ currentArea === MEDIA_EDITOR_SIDEBAR_DETAILS_TAB && <MediaEditorSidebarDetails /> }
					{ currentArea === MEDIA_EDITOR_SIDEBAR_EDIT_TAB && mediaType?.type === 'image' && (
						<MediaEditorSidebarEdit />
					) }
				</div>
			</div>
		);
	}

	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { isSidebarOpen } = useSelect( select => {
		const { getActiveComplementaryArea } = select( interfaceStore ) as {
			getActiveComplementaryArea: ( scope: string, identifier?: string ) => string | null;
		};
		return {
			isSidebarOpen: !! getActiveComplementaryArea( MEDIA_EDITOR_SIDEBAR ),
		};
	}, [] );

	const onTabSelect = useCallback(
		( newSelectedTabId: string ) => {
			if ( !! newSelectedTabId ) {
				enableComplementaryArea( MEDIA_EDITOR_SIDEBAR, newSelectedTabId );
				setCurrentArea( newSelectedTabId );
				setIsImageEditorOpen( newSelectedTabId === MEDIA_EDITOR_SIDEBAR_EDIT_TAB );
			}
		},
		[ enableComplementaryArea, setIsImageEditorOpen ]
	);

	return (
		<Tabs
			selectedTabId={ currentArea }
			onSelect={ onTabSelect }
			selectOnMove={ false }
			defaultTabId={ MEDIA_EDITOR_SIDEBAR_DETAILS_TAB }
		>
			<SidebarContent
				currentArea={ currentArea }
				isSidebarOpen={ isSidebarOpen }
				mediaType={ mediaType?.type }
			/>
		</Tabs>
	);
}
