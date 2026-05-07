import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as fixStatusHook from '../../data/use-fix-threats-status';
import * as mutationsHook from '../../data/use-threat-mutations';
import * as trackHook from '../../data/use-track-event';
import { FixThreatModal } from '../fix-threat-modal';
import type { Threat } from '../../data/types';

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();

jest.mock( '@automattic/jetpack-scan', () => ( {
	ThreatSeverityBadge: ( { severity }: { severity: number } ) => (
		<span data-testid="severity-badge">{ severity }</span>
	),
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ),
} ) );
jest.mock( '@wordpress/notices', () => ( { store: 'notices-store' } ) );

const threat: Threat = {
	id: 42,
	title: 'Bad file',
	description: 'Bad file description',
	severity: 9,
	status: 'current',
	fixable: { fixer: 'replace' },
};

describe( 'FixThreatModal', () => {
	let mutateAsync: jest.Mock;

	beforeEach( () => {
		mutateAsync = jest.fn().mockResolvedValue( { ok: true, threats: {} } );
		jest.spyOn( trackHook, 'useTrackEvent' ).mockReturnValue( jest.fn() );
		jest.spyOn( mutationsHook, 'useFixThreatsMutation' ).mockReturnValue( {
			mutateAsync,
			isPending: false,
		} as unknown as ReturnType< typeof mutationsHook.useFixThreatsMutation > );
		jest.spyOn( fixStatusHook, 'useFixThreatsStatusQuery' ).mockReturnValue( {
			data: undefined,
			isError: false,
		} as unknown as ReturnType< typeof fixStatusHook.useFixThreatsStatusQuery > );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		mockCreateSuccessNotice.mockReset();
		mockCreateErrorNotice.mockReset();
	} );

	it( 'renders the threat title and severity badge', () => {
		render( <FixThreatModal items={ [ threat ] } closeModal={ jest.fn() } /> );
		expect( screen.getByText( 'Bad file' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'severity-badge' ) ).toHaveTextContent( '9' );
		expect( screen.getByRole( 'button', { name: /fix threat/i } ) ).toBeInTheDocument();
	} );

	it( 'invokes the fix mutation when the confirm button is clicked', async () => {
		render( <FixThreatModal items={ [ threat ] } closeModal={ jest.fn() } /> );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /fix threat/i } ) );
		await waitFor( () => expect( mutateAsync ).toHaveBeenCalledWith( [ 42 ] ) );
	} );

	it( 'closes the modal and shows the success snackbar on terminal fixed status', async () => {
		// Status query returns the terminal "fixed" state for this threat id
		// from the start. Once the click sets pollingId via setState, the
		// effect re-runs with isFixComplete()===true and triggers the close.
		jest.spyOn( fixStatusHook, 'useFixThreatsStatusQuery' ).mockReturnValue( {
			data: { ok: true, threats: { '42': { status: 'fixed' } } },
			isError: false,
		} as unknown as ReturnType< typeof fixStatusHook.useFixThreatsStatusQuery > );

		const closeModal = jest.fn();
		render( <FixThreatModal items={ [ threat ] } closeModal={ closeModal } /> );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /fix threat/i } ) );

		await waitFor( () => expect( closeModal ).toHaveBeenCalled() );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
			expect.stringMatching( /threat fixed/i ),
			{ type: 'snackbar' }
		);
	} );
} );
