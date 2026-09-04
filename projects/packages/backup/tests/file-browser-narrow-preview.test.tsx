// A narrow panel shows the preview in a dialog: stacked under the tree, the
// card sat below every row of the open folder and its focus move scrolled past them.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

/** Selection is irrelevant to these assertions; the rows render regardless. */
const noop = () => {};

const ROOT = {
	'readme.txt': { type: 'file', period: '1786644531', manifest_path: 'f5:/readme.txt' },
};

/**
 * Stands in for the panel's `ResizeObserver`, which jsdom does not implement.
 *
 * Reports `inlineSize` to every observer the render creates, and re-reports it
 * on `resizeTo` so a test can cross the threshold mid-render.
 *
 * @param inlineSize - Panel width the observers should report.
 * @param deliver    - Whether `observe()` delivers a first observation. A hidden
 *                   tab paints nothing, so its real observers deliver none at all.
 * @return Handle exposing `resizeTo` and `restore`.
 */
function mockPanelWidth( inlineSize: number, deliver = true ) {
	const original = globalThis.ResizeObserver;
	const originalRect = Element.prototype.getBoundingClientRect;
	const box = { inlineSize };
	Element.prototype.getBoundingClientRect = function () {
		return this.classList?.contains( 'jpb-file-browser' )
			? ( { width: box.inlineSize } as DOMRect )
			: originalRect.call( this );
	};
	const callbacks = new Set< ResizeObserverCallback >();
	const entriesFor = ( target: Element ) =>
		[
			{ target, contentBoxSize: [ { inlineSize: box.inlineSize, blockSize: 0 } ] },
		] as unknown as ResizeObserverEntry[];

	globalThis.ResizeObserver = class {
		#callback: ResizeObserverCallback;

		constructor( callback: ResizeObserverCallback ) {
			this.#callback = callback;
		}

		observe( target: Element ) {
			callbacks.add( this.#callback );
			if ( deliver ) {
				this.#callback( entriesFor( target ), this as unknown as ResizeObserver );
			}
		}

		unobserve() {}

		disconnect() {
			callbacks.delete( this.#callback );
		}
	} as unknown as typeof globalThis.ResizeObserver;

	return {
		resizeTo: ( next: number ) =>
			act( () => {
				box.inlineSize = next;
				callbacks.forEach( callback =>
					callback( entriesFor( document.body ), {} as ResizeObserver )
				);
			} ),
		restore: () => {
			globalThis.ResizeObserver = original;
			Element.prototype.getBoundingClientRect = originalRect;
		},
	};
}

/**
 * Render the browser over the root listing and open `readme.txt`.
 *
 * @return Nothing; assertions read from `screen`.
 */
async function openTheFile(): Promise< void > {
	render(
		<QueryClientProvider>
			<FileBrowser
				rewindId="1786644531.123"
				selection={ EMPTY_FILE_SELECTION }
				onSelectionChange={ noop }
			/>
		</QueryClientProvider>
	);
	await userEvent.click( await screen.findByRole( 'button', { name: 'File: readme.txt' } ) );
}

let panel: ReturnType< typeof mockPanelWidth >;
let contentColumn: HTMLElement | null = null;

/**
 * Stands in for wp-admin's content column, which the dialog measures the
 * sidebar from. Removed again in `afterEach` — left behind, it is found by the
 * next test's lookup and answers for a sidebar that test never set up.
 *
 * @param rect        - The rect `#wpcontent` should report.
 * @param clientWidth - Viewport width `documentElement` should report.
 */
function stubContentColumn( rect: Partial< DOMRect >, clientWidth: number ): void {
	contentColumn = document.createElement( 'div' );
	contentColumn.id = 'wpcontent';
	contentColumn.getBoundingClientRect = () => rect as DOMRect;
	document.body.appendChild( contentColumn );
	jest.spyOn( document.documentElement, 'clientWidth', 'get' ).mockReturnValue( clientWidth );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path: string } ) => {
		if ( options.path.includes( '/rewind/backup/file-content' ) ) {
			return Promise.resolve( { content: 'Hello.' } );
		}
		if ( options.path.includes( '/rewind/backup/path-info' ) ) {
			return Promise.resolve( { size: 42 } );
		}
		return Promise.resolve( { contents: ROOT } );
	} );
} );

afterEach( () => {
	panel?.restore();
	contentColumn?.remove();
	contentColumn = null;
	jest.restoreAllMocks();
} );

it( 'shows the preview in a dialog when the panel is too narrow for a second column', async () => {
	panel = mockPanelWidth( 480 );

	await openTheFile();

	await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
	// Both chromes name a preview region, so the heading level is what tells
	// them apart — and witnesses that one of them rendered at all.
	expect( screen.getByRole( 'heading', { level: 2, name: 'readme.txt' } ) ).toBeInTheDocument();
	expect(
		screen.queryByRole( 'heading', { level: 3, name: 'readme.txt' } )
	).not.toBeInTheDocument();
} );

it( 'keeps the preview in the tree’s sibling column when the panel is wide enough', async () => {
	panel = mockPanelWidth( 900 );

	await openTheFile();

	await expect(
		screen.findByRole( 'heading', { level: 3, name: 'readme.txt' } )
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
} );

it( 'returns focus to the row that opened the dialog when it closes', async () => {
	panel = mockPanelWidth( 480 );

	await openTheFile();
	await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
	await userEvent.click( screen.getByRole( 'button', { name: 'Close preview' } ) );

	await waitFor( () =>
		expect( screen.getByRole( 'button', { name: 'File: readme.txt' } ) ).toHaveFocus()
	);
} );

it( 'swaps chrome without losing the open file when the panel crosses the threshold', async () => {
	panel = mockPanelWidth( 480 );

	await openTheFile();
	await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();

	panel.resizeTo( 900 );

	await expect(
		screen.findByRole( 'heading', { level: 3, name: 'readme.txt' } )
	).resolves.toBeInTheDocument();
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
} );

it( 'picks its chrome on the first paint, before any observation arrives', async () => {
	panel = mockPanelWidth( 480, false );

	await openTheFile();

	await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
	expect(
		screen.queryByRole( 'heading', { level: 3, name: 'readme.txt' } )
	).not.toBeInTheDocument();
} );

// jsdom does no layout, so the offset the dialog publishes for its stylesheet
// is the only part of "clears the admin menu" a test here can witness.
it( 'offsets the dialog by the admin menu, which it is positioned against but unaware of', async () => {
	panel = mockPanelWidth( 480 );
	stubContentColumn( { left: 160, width: 940 }, 1100 );

	await openTheFile();

	const popup = await screen.findByRole( 'dialog' );
	expect( popup.style.getPropertyValue( '--jpb-admin-menu-width' ) ).toBe( '160px' );
} );

// In RTL the menu moves to the other edge, so `#wpcontent` starts at zero and
// its inline-start offset stops describing the menu at all. Its width does not.
it( 'measures the menu by the room it takes, not the edge it takes it from', async () => {
	panel = mockPanelWidth( 480 );
	stubContentColumn( { left: 0, width: 940 }, 1100 );

	await openTheFile();

	const popup = await screen.findByRole( 'dialog' );
	expect( popup.style.getPropertyValue( '--jpb-admin-menu-width' ) ).toBe( '160px' );
} );

// A scrollport nothing can focus cannot be scrolled by keyboard, and long code
// lines are the whole reason the dialog exists.
it( 'gives the dialog preview a named region focus can enter, as the card has', async () => {
	panel = mockPanelWidth( 480 );

	await openTheFile();
	await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();

	const preview = screen.getByRole( 'region', { name: 'Preview of readme.txt' } );
	expect( preview ).toHaveAttribute( 'tabindex', '0' );
	expect( preview ).toContainElement( screen.getByText( 'Hello.' ) );
} );
