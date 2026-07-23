import { renderHook } from '@testing-library/react';
import { dispatch } from '@wordpress/data';
import {
	isSidebarOpenRequested,
	openJetpackSidebar,
	useSidebarOpenFromUrl,
} from '../open-sidebar-from-url';

jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
} ) );

const dispatchMock = dispatch as jest.Mock;

describe( 'open-sidebar-from-url', () => {
	afterEach( () => {
		dispatchMock.mockReset();
		window.history.pushState( {}, '', '/wp-admin/post-new.php' );
	} );

	describe( 'isSidebarOpenRequested', () => {
		test( 'true when the URL carries openSidebar=jetpack-ai-assistant', () => {
			window.history.pushState( {}, '', '/wp-admin/post-new.php?openSidebar=jetpack-ai-assistant' );

			expect( isSidebarOpenRequested() ).toBe( true );
		} );

		test( 'false without the query arg', () => {
			window.history.pushState( {}, '', '/wp-admin/post-new.php' );

			expect( isSidebarOpenRequested() ).toBe( false );
		} );

		test( 'false when openSidebar names a different target', () => {
			// The arg name is shared with other sidebar-openers (global-styles);
			// only our own value may trigger the AI sidebar.
			window.history.pushState( {}, '', '/wp-admin/post-new.php?openSidebar=global-styles' );

			expect( isSidebarOpenRequested() ).toBe( false );
		} );
	} );

	describe( 'openJetpackSidebar', () => {
		test( 'opens the shared Jetpack sidebar through core/edit-post', () => {
			const openGeneralSidebar = jest.fn();
			dispatchMock.mockReturnValue( { openGeneralSidebar } );

			openJetpackSidebar();

			expect( dispatchMock ).toHaveBeenCalledWith( 'core/edit-post' );
			expect( openGeneralSidebar ).toHaveBeenCalledWith( 'jetpack-sidebar/jetpack' );
		} );

		test( 'is a no-op when the edit-post store is not registered', () => {
			// Outside the post editor dispatch() has no store to return.
			dispatchMock.mockReturnValue( undefined );

			expect( () => openJetpackSidebar() ).not.toThrow();
		} );
	} );

	describe( 'useSidebarOpenFromUrl', () => {
		test( 'opens the sidebar on mount and reports the request', () => {
			window.history.pushState( {}, '', '/wp-admin/post-new.php?openSidebar=jetpack-ai-assistant' );
			const openGeneralSidebar = jest.fn();
			dispatchMock.mockReturnValue( { openGeneralSidebar } );

			const { result, rerender } = renderHook( () => useSidebarOpenFromUrl() );

			expect( result.current ).toBe( true );
			expect( openGeneralSidebar ).toHaveBeenCalledWith( 'jetpack-sidebar/jetpack' );

			// Re-renders must not re-open a sidebar the user may have closed.
			rerender();
			expect( openGeneralSidebar ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'stays quiet without the query arg', () => {
			const { result } = renderHook( () => useSidebarOpenFromUrl() );

			expect( result.current ).toBe( false );
			expect( dispatchMock ).not.toHaveBeenCalled();
		} );
	} );

	test( 'importing the module does not touch the stores', async () => {
		// The open must be driven by the sidebar component's mount (which
		// implies the editor is up), never by module evaluation.
		await jest.isolateModulesAsync( async () => {
			await import( '../open-sidebar-from-url' );
		} );

		expect( dispatchMock ).not.toHaveBeenCalled();
	} );
} );
