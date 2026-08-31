/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { StrictMode, useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useStagedValue } from '../use-staged-value';

type Params = { preset?: string; interval?: string };

/**
 * Render the hook against a store that behaves like the real ones: a commit
 * round-trips back in as the committed value. A test holding the store still
 * would pass on a hook that commits a stale draft.
 *
 * Under `StrictMode`, the way `@wordpress/boot` mounts the dashboard: it renders
 * twice and throws the first pass away, which a realign written to a ref would
 * not survive.
 */
function renderStagedValue( initial: Params = { preset: 'last-30-days' } ) {
	const commits: Params[] = [];
	const patches: Partial< Params >[] = [];

	const view = renderHook(
		() => {
			const [ committed, setCommitted ] = useState( initial );

			const onCommit = useCallback( ( staged: Params, patch: Partial< Params > ) => {
				commits.push( staged );
				patches.push( patch );
				// Dropping the `undefined` keys is what makes this a faithful store:
				// the URL binding serializes them away, so a value staged as
				// `undefined` never round-trips back as a key.
				setCommitted(
					Object.fromEntries( Object.entries( staged ).filter( ( [ , v ] ) => v !== undefined ) )
				);
			}, [] );

			return { ...useStagedValue< Params >( committed, onCommit ), setCommitted };
		},
		{ wrapper: StrictMode }
	);

	return {
		...view,
		commits,
		patches,
		// Stands in for an undo or another surface writing the same store.
		writeFromOutside: ( next: Params ) => act( () => view.result.current.setCommitted( next ) ),
	};
}

describe( 'useStagedValue', () => {
	it( 'stages without touching the store', () => {
		const { result, commits } = renderStagedValue();

		act( () => result.current.stage( { interval: 'week' } ) );

		expect( commits ).toHaveLength( 0 );
		expect( result.current.staged ).toEqual( { preset: 'last-30-days', interval: 'week' } );
		expect( result.current.isDirty ).toBe( true );
	} );

	// `DateRangeFilter` applies a quick preset this way, so a commit reading the
	// state React has only queued would leave the store a click behind.
	it( 'commits an edit staged in the same tick', () => {
		const { result, commits } = renderStagedValue();

		act( () => {
			result.current.stage( { preset: 'last-7-days' } );
			result.current.commit();
		} );

		expect( commits ).toEqual( [ { preset: 'last-7-days' } ] );
	} );

	it( 'hands the store the patch alongside the draft', () => {
		const { result, patches } = renderStagedValue();

		act( () => {
			result.current.stage( { interval: 'week' } );
			result.current.commit();
		} );

		expect( patches ).toEqual( [ { interval: 'week' } ] );
	} );

	it( 'ignores a commit with nothing staged', () => {
		const { result, commits } = renderStagedValue();

		act( () => result.current.commit() );

		expect( commits ).toHaveLength( 0 );
	} );

	it( 'clears the draft once the commit lands', () => {
		const { result } = renderStagedValue();

		act( () => {
			result.current.stage( { interval: 'week' } );
			result.current.commit();
		} );

		expect( result.current.staged ).toEqual( { preset: 'last-30-days', interval: 'week' } );
		expect( result.current.isDirty ).toBe( false );
	} );

	it( 'drops the draft on revert', () => {
		const { result, commits } = renderStagedValue();

		act( () => result.current.stage( { interval: 'week' } ) );
		act( () => result.current.revert() );

		expect( result.current.staged ).toEqual( { preset: 'last-30-days' } );
		expect( result.current.isDirty ).toBe( false );

		act( () => result.current.commit() );

		expect( commits ).toHaveLength( 0 );
	} );

	// Without this the next commit puts the stale draft back over the change.
	it( 'realigns the draft on a value arriving from outside', () => {
		const { result, writeFromOutside } = renderStagedValue();

		act( () => result.current.stage( { interval: 'week' } ) );
		writeFromOutside( { preset: 'last-7-days' } );

		expect( result.current.staged ).toEqual( { preset: 'last-7-days' } );
		expect( result.current.isDirty ).toBe( false );
	} );

	// A host that rebuilds the value during render would otherwise wipe the
	// draft on every render.
	it( 'keeps the draft when an equal value is rebuilt', () => {
		const { result, writeFromOutside } = renderStagedValue();

		act( () => result.current.stage( { interval: 'week' } ) );
		writeFromOutside( { preset: 'last-30-days' } );

		expect( result.current.staged ).toEqual( { preset: 'last-30-days', interval: 'week' } );
		expect( result.current.isDirty ).toBe( true );
	} );

	// Apply has to go back to disabled, not just stop being reachable.
	it( 'stops reading as dirty once the draft is staged back to the applied value', () => {
		const { result } = renderStagedValue();

		act( () => result.current.stage( { preset: 'last-7-days' } ) );
		expect( result.current.isDirty ).toBe( true );

		act( () => result.current.stage( { preset: 'last-30-days' } ) );

		expect( result.current.isDirty ).toBe( false );
	} );

	// Re-picking "No comparison" with comparison already off stages a patch of
	// nothing. Left in the buffer it reads as dirty forever, and Apply never
	// goes back to disabled (WOOA7S-2039).
	it( 'ignores clearing a key the value does not carry', () => {
		const { result, commits } = renderStagedValue();

		act( () => {
			result.current.stage( { interval: undefined } );
			result.current.commit();
		} );

		expect( result.current.isDirty ).toBe( false );
		expect( commits ).toHaveLength( 0 );
	} );

	// The other half of the same rule: staging an explicit `undefined` is how a
	// caller drops a param it does hold, which the URL binding relies on.
	it( 'still clears a key the value carries', () => {
		const { result, patches } = renderStagedValue( { preset: 'last-30-days', interval: 'week' } );

		act( () => {
			result.current.stage( { interval: undefined } );
			result.current.commit();
		} );

		expect( patches ).toStrictEqual( [ { interval: undefined } ] );
	} );
} );
