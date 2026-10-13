import { renderHook } from '@testing-library/react';
import { useNewBackupRow } from '../use-new-backup-row';

type Props = { finishedRuns: number; topBackupId: string | null; isReady: boolean };

const render = ( initialProps: Props ) =>
	renderHook( ( props: Props ) => useNewBackupRow( props ), { initialProps } );

describe( 'useNewBackupRow', () => {
	test( 'marks the top backup when a run ends and a different one lands', () => {
		const { result, rerender } = render( { finishedRuns: 0, topBackupId: 'a', isReady: true } );
		rerender( { finishedRuns: 1, topBackupId: 'a', isReady: true } );
		expect( result.current.newRowId ).toBeNull();
		rerender( { finishedRuns: 1, topBackupId: 'b', isReady: true } );
		expect( result.current.newRowId ).toBe( 'b' );
	} );

	test( 'does not mark a row when the run ended off the newest page', () => {
		const { result, rerender } = render( { finishedRuns: 0, topBackupId: null, isReady: false } );
		rerender( { finishedRuns: 1, topBackupId: null, isReady: false } );
		rerender( { finishedRuns: 1, topBackupId: 'a', isReady: true } );
		expect( result.current.newRowId ).toBeNull();
	} );
} );
