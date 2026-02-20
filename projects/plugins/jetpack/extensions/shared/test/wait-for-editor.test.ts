import { waitForEditor } from '../wait-for-editor';

const mockSelect = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	select: ( store: string ) => mockSelect( store ),
	subscribe: ( callback: () => void ) => mockSubscribe( callback ),
} ) );

describe( 'waitForEditor', (): void => {
	beforeEach( (): void => {
		jest.clearAllMocks();
	} );

	it( 'should reject the promise if core editor or block-editor store is not available', async () => {
		jest.useFakeTimers();

		mockSubscribe.mockReturnValue( mockUnsubscribe );
		mockSelect.mockImplementation( () => null ); // Simulate store not available.

		const waitForEditorPromise = waitForEditor();
		jest.advanceTimersByTime( 7000 );

		expect( mockUnsubscribe ).toHaveBeenCalled();
		await expect( waitForEditorPromise ).rejects.toThrow(
			'Timeout: Waiting for the editor to be ready has timed out.'
		);

		jest.useRealTimers();
	} );

	it( 'should resolve the promise immediately if the post is a clean new post', async () => {
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => true, getCurrentPostId: () => null };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [] };
			}

			return null;
		} );

		expect( mockUnsubscribe ).not.toHaveBeenCalled();
		await expect( waitForEditor() ).resolves.toBeUndefined();
	} );

	it( 'should resolve the promise if core editor returns the post ID', async () => {
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => false, getCurrentPostId: () => 1 };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [] };
			}

			return null;
		} );

		expect( mockUnsubscribe ).not.toHaveBeenCalled();
		await expect( waitForEditor() ).resolves.toBeUndefined();
	} );

	it( 'should resolve the promise if core block-editor has blocks', async () => {
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => false, getCurrentPostId: () => null };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [ { name: 'core/paragraph' } ] };
			}

			return null;
		} );

		expect( mockUnsubscribe ).not.toHaveBeenCalled();
		await expect( waitForEditor() ).resolves.toBeUndefined();
	} );

	it( 'should resolve the promise when the editor becomes ready', async () => {
		jest.useFakeTimers();

		// Initial state: editor is not ready.
		let callbackFunction: () => void;
		mockSubscribe.mockImplementation( ( callback: () => void ) => {
			callbackFunction = callback;
			return mockUnsubscribe;
		} );
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => false, getCurrentPostId: () => null };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [] };
			}

			return null;
		} );

		const waitForEditorPromise = waitForEditor();

		expect( mockUnsubscribe ).not.toHaveBeenCalled();

		// Simulate the editor become ready after some time.
		jest.advanceTimersByTime( 2000 );
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => true, getCurrentPostId: () => null };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [] };
			}

			return null;
		} );

		// Call the subscribed callback to simulate state change.
		callbackFunction!();

		expect( mockUnsubscribe ).toHaveBeenCalled();
		await expect( waitForEditorPromise ).resolves.toBeUndefined();

		jest.useRealTimers();
	} );

	it( 'should reject the promise if the editor is not ready within the timeout period', async () => {
		jest.useFakeTimers();

		mockSubscribe.mockReturnValue( mockUnsubscribe );
		mockSelect.mockImplementation( ( store: string ) => {
			if ( store === 'core/editor' ) {
				return { isCleanNewPost: () => false, getCurrentPostId: () => null };
			}

			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => [] };
			}

			return null;
		} );

		const waitForEditorPromise = waitForEditor();
		jest.advanceTimersByTime( 7000 );

		expect( mockUnsubscribe ).toHaveBeenCalled();
		await expect( waitForEditorPromise ).rejects.toThrow(
			'Timeout: Waiting for the editor to be ready has timed out.'
		);

		jest.useRealTimers();
	} );
} );
