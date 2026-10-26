import { fixThreats, ignoreThreats } from '../threat-actions';
import { getThreatRowActions } from '../threat-row-actions';

jest.mock( '../threat-actions', () => ( {
	fixThreats: jest.fn(),
	ignoreThreats: jest.fn(),
	unignoreThreat: jest.fn(),
} ) );

const BULK = [ 'auto-fix', 'ignore' ];
const threats = [
	{ id: 1, title: 'Malicious code found in file: a.php' },
	{ id: 2, title: 'Malicious code found in file: b.php' },
];

describe( 'getThreatRowActions', () => {
	// Scan history and the threat report pass no onBulk, so they must not grow checkboxes.
	it( 'offers bulk Auto-fix and Ignore only to a list that handles them', () => {
		const supportsBulk = ( onBulk?: () => void ) =>
			getThreatRowActions( jest.fn(), true, onBulk )
				.filter( action => action.supportsBulk )
				.map( action => action.id );

		expect( supportsBulk() ).toEqual( [] );
		expect( supportsBulk( jest.fn() ) ).toEqual( BULK );
	} );

	it.each( [
		[ 'auto-fix', fixThreats ],
		[ 'ignore', ignoreThreats ],
	] )( '%s hands the list the threats it acts on', ( id, run ) => {
		const onBulk = jest.fn();
		const action = getThreatRowActions( jest.fn(), true, onBulk ).find( item => item.id === id );

		( action as { callback: ( items: typeof threats, context: object ) => void } ).callback(
			threats,
			{}
		);

		expect( onBulk ).toHaveBeenCalledWith( threats );
		expect( run ).toHaveBeenCalledWith( threats, expect.any( Function ) );
	} );
} );
