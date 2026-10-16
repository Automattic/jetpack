/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

export { mockWordPressRoute } from '../tests/js/route-test-utils';

/** Shared renderHook wrapper using the application's query client. */
export function queryClientWrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

/**
 * Capture the files the CSV helpers save; jsdom can neither create object URLs nor navigate.
 *
 * @return The saved files, a click that waits for one, a reader for the first file's lines, and a restore for `afterEach`.
 */
export function captureCsvDownloads() {
	const files: { filename: string; blob: Blob }[] = [];
	const originalCreateObjectURL = window.URL.createObjectURL;
	const originalRevokeObjectURL = window.URL.revokeObjectURL;
	let pendingBlob: Blob | undefined;
	// jsdom defines neither, so `jest.spyOn` has nothing to wrap.
	const createObjectURL = jest.fn( ( blob: Blob ) => {
		pendingBlob = blob;
		return 'blob:mock';
	} );
	const revokeObjectURL = jest.fn();
	window.URL.createObjectURL = createObjectURL;
	window.URL.revokeObjectURL = revokeObjectURL;
	const clickSpy = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( function (
		this: HTMLAnchorElement
	) {
		if ( pendingBlob ) {
			files.push( { filename: this.download, blob: pendingBlob } );
			pendingBlob = undefined;
		}
	} );

	return {
		files,
		clickAndSave: async ( button: HTMLElement ) => {
			// user.click returns before the button clears its busy state, leaving that update outside act().
			fireEvent.click( button );
			await waitFor( () => {
				expect( files ).toHaveLength( 1 );
				expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' );
			} );
		},
		lines: async () => ( await files[ 0 ].blob.text() ).replace( '\ufeff', '' ).split( '\n' ),
		restore: () => {
			clickSpy.mockRestore();
			window.URL.createObjectURL = originalCreateObjectURL;
			window.URL.revokeObjectURL = originalRevokeObjectURL;
		},
	};
}
