/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
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
import { drawerLeft, drawerRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider';
import { getMediaTypeFromMimeType } from '../../utils';
import MediaEditorSidebarDetails from './details';
import MediaEditorSidebarEdit from './edit';
import type { MediaItemUpdatable } from '../../types';
import type { ReactNode } from 'react';
import './style.scss';

export const MEDIA_EDITOR_SIDEBAR = 'core/edit-media';
export const MEDIA_EDITOR_SIDEBAR_DETAILS_TAB = 'core/edit-media/details';
export const MEDIA_EDITOR_SIDEBAR_EDIT_TAB = 'core/edit-media/edit';
const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
} );

const INTERFACE_STORE_KEY = 'core/interface';

type InterfaceDispatch = {
	enableComplementaryArea?: ( scope: string, area: string ) => void;
};

type InterfaceSelectors = {
	getActiveComplementaryArea?: ( scope: string ) => string | null;
};

const TabsComponent = ( { children }: { children: ReactNode } ) =>
	createElement( 'div', {}, children );
const TabsContext = createContext( {} );
const Tabs = {
	TabList: ( { children }: { children: ReactNode } ) => createElement( 'div', {}, children ),
	Tab: ( { children }: { children: ReactNode } ) => createElement( 'button', {}, children ),
	Context: TabsContext,
	TabPanel: ( { children }: { children: ReactNode } ) => createElement( 'div', {}, children ),
};
Object.assign( TabsComponent, Tabs );
const ComplementaryArea = ( { children, header }: { children: ReactNode; header: ReactNode } ) =>
	createElement( 'div', {}, header, children );

/**
 *
 */
function useInterfaceDispatch(): InterfaceDispatch {
	try {
		return useDispatch( INTERFACE_STORE_KEY as any ) as InterfaceDispatch;
	} catch ( error ) {
		// The interface store may not yet be available.
		return {};
	}
}

/**
 *
 */
function useIsSidebarOpen(): boolean {
	return useSelect( select => {
		try {
			const selectors = select( INTERFACE_STORE_KEY as any ) as InterfaceSelectors;
			const getActiveComplementaryArea = selectors?.getActiveComplementaryArea;

			return Boolean(
				getActiveComplementaryArea && getActiveComplementaryArea( MEDIA_EDITOR_SIDEBAR )
			);
		} catch ( error ) {
			return false;
		}
	}, [] );
}

/**
 *
 * @param root0
 * @param root0.mediaType
 */
function SidebarHeader( { mediaType }: { mediaType: string } ) {
	return (
		<Tabs.TabList>
			<Tabs.Tab>{ __( 'Details', 'jetpack-media-editor' ) }</Tabs.Tab>
			{ mediaType === 'image' && <Tabs.Tab>{ __( 'Edit', 'jetpack-media-editor' ) }</Tabs.Tab> }
		</Tabs.TabList>
	);
}

/**
 *
 * @param root0
 * @param root0.currentArea
 * @param root0.mediaType
 * @param root0.isSidebarOpen
 */
function SidebarContent( {
	currentArea,
	mediaType,
	isSidebarOpen,
}: {
	currentArea: string;
	mediaType: string;
	isSidebarOpen: boolean;
} ) {
	const tabsContextValue = useContext( Tabs.Context );
	const { enableComplementaryArea } = useInterfaceDispatch();

	useEffect( () => {
		if ( isSidebarOpen && enableComplementaryArea ) {
			enableComplementaryArea( MEDIA_EDITOR_SIDEBAR, currentArea );
		}
	}, [ enableComplementaryArea, isSidebarOpen, currentArea ] );

	return (
		<ComplementaryArea
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SidebarHeader mediaType={ mediaType } />
				</Tabs.Context.Provider>
			}
			/* translators: button label text should, if possible, be under 16 characters. */
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<div className="next-admin-media-editor-sidebar__tabs-panel">
					<Tabs.TabPanel>
						<MediaEditorSidebarDetails />
					</Tabs.TabPanel>
					{ mediaType === 'image' && (
						<Tabs.TabPanel>
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
		select => {
			const coreSelectors = select( coreStore ) as {
				getEditedEntityRecord: (
					kind: string,
					name: string,
					recordId: number | string
				) => MediaItemUpdatable | undefined;
			};

			return coreSelectors.getEditedEntityRecord( 'postType', 'attachment', postId );
		},
		[ postId ]
	) as MediaItemUpdatable | undefined;
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

	const { enableComplementaryArea } = useInterfaceDispatch();
	const isSidebarOpen = useIsSidebarOpen();

	const onTabSelect = useCallback(
		( newSelectedTabId: string ) => {
			if ( ! newSelectedTabId ) {
				return;
			}

			enableComplementaryArea?.( MEDIA_EDITOR_SIDEBAR, newSelectedTabId );
			setCurrentArea( newSelectedTabId );
			setIsImageEditorOpen( newSelectedTabId === MEDIA_EDITOR_SIDEBAR_EDIT_TAB );
		},
		[ enableComplementaryArea, setIsImageEditorOpen ]
	);

	if ( ! post ) {
		return null;
	}

	const mediaType = getMediaTypeFromMimeType( post?.mime_type || '' );

	return (
		<TabsComponent>
			<SidebarContent
				currentArea={ currentArea }
				mediaType={ mediaType?.type }
				isSidebarOpen={ isSidebarOpen }
			/>
		</TabsComponent>
	);
}
