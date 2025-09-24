/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	Platform,
	useContext,
	useCallback,
	useState,
	useEffect,
	createElement,
	createContext,
} from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
// TODO: Replace with available alternative
// import { unlock } from '@wordpress/admin-toolkit';
import { drawerLeft, drawerRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import MediaEditorSidebarDetails from './details';
import MediaEditorSidebarEdit from './edit';
import type { MediaItemUpdatable } from '../../types';
import './style.scss';

export const MEDIA_EDITOR_SIDEBAR = 'core/edit-media';
export const MEDIA_EDITOR_SIDEBAR_DETAILS_TAB = 'core/edit-media/details';
export const MEDIA_EDITOR_SIDEBAR_EDIT_TAB = 'core/edit-media/edit';
const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
} );

// TODO: Replace with available alternative
// const { Tabs } = unlock( componentsPrivateApis );
// const { ComplementaryArea, interfaceStore } = unlock( editorPrivateApis );
const TabsComponent = ( { children, selectedTabId, onSelect, selectOnMove, defaultTabId }: any ) =>
	createElement( 'div', {}, children );
const TabsContext = createContext( {} );
const Tabs = {
	TabList: ( { children }: any ) => createElement( 'div', {}, children ),
	Tab: ( { children, tabId }: any ) => createElement( 'button', {}, children ),
	Context: TabsContext,
	TabPanel: ( { children, tabId, focusable }: any ) => createElement( 'div', {}, children ),
};
Object.assign( TabsComponent, Tabs );
const ComplementaryArea = ( { children, header, ...props }: any ) =>
	createElement( 'div', {}, header, children );
const interfaceStore = {
	getActiveComplementaryArea: () => null,
} as any;

/**
 *
 * @param root0
 * @param root0.mediaType
 */
function SidebarHeader( { mediaType }: { mediaType: string } ) {
	return (
		<Tabs.TabList>
			<Tabs.Tab tabId={ MEDIA_EDITOR_SIDEBAR_DETAILS_TAB }>
				{ __( 'Details', 'jetpack-media-editor' ) }
			</Tabs.Tab>
			{ mediaType === 'image' && (
				<Tabs.Tab tabId={ MEDIA_EDITOR_SIDEBAR_EDIT_TAB }>
					{ __( 'Edit', 'jetpack-media-editor' ) }
				</Tabs.Tab>
			) }
		</Tabs.TabList>
	);
}

/**
 *
 * @param root0
 * @param root0.currentArea
 * @param root0.isSidebarOpen
 * @param root0.mediaType
 */
function SidebarContent( {
	currentArea,
	isSidebarOpen,
	mediaType,
}: {
	currentArea: string;
	isSidebarOpen: boolean;
	mediaType: string;
} ) {
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
			title={ __( 'Media Editor', 'jetpack-media-editor' ) }
			closeLabel={ __( 'Close Media Editor', 'jetpack-media-editor' ) }
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

/**
 *
 */
export default function Sidebar() {
	const postId = useEntityId( 'postType', 'attachment' );
	const post = useSelect(
		select =>
			( select( coreStore ) as any ).getEditedEntityRecord( 'postType', 'attachment', postId ),
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
	const { enableComplementaryArea } = useDispatch( interfaceStore ) as any;
	const { isSidebarOpen } = useSelect( select => {
		const { getActiveComplementaryArea } = ( select( interfaceStore ) as any ) || {
			getActiveComplementaryArea: () => null,
		};
		return {
			isSidebarOpen: !! getActiveComplementaryArea( MEDIA_EDITOR_SIDEBAR ),
		};
	}, [] ) as any;

	const onTabSelect = useCallback(
		( newSelectedTabId: string ) => {
			if ( newSelectedTabId ) {
				enableComplementaryArea( MEDIA_EDITOR_SIDEBAR, newSelectedTabId );
				setCurrentArea( newSelectedTabId );
				setIsImageEditorOpen( newSelectedTabId === MEDIA_EDITOR_SIDEBAR_EDIT_TAB );
			}
		},
		[ enableComplementaryArea, setIsImageEditorOpen ]
	);

	if ( ! post ) {
		return null;
	}

	const mediaType = getMediaTypeFromMimeType( post?.mime_type || '' );

	return (
		<TabsComponent
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
		</TabsComponent>
	);
}
