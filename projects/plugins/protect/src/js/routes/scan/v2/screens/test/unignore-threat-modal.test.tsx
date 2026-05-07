import { fireEvent, render, screen } from '@testing-library/react';
import * as mutationsHook from '../../data/use-threat-mutations';
import * as trackHook from '../../data/use-track-event';
import { UnignoreThreatModal } from '../unignore-threat-modal';
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
	id: 'ignored-99',
	title: 'Previously ignored',
	description: 'Time to bring it back',
	severity: 5,
	status: 'ignored',
};

describe( 'UnignoreThreatModal', () => {
	let mutate: jest.Mock;

	beforeEach( () => {
		mutate = jest.fn();
		jest.spyOn( trackHook, 'useTrackEvent' ).mockReturnValue( jest.fn() );
		jest.spyOn( mutationsHook, 'useUnignoreThreatMutation' ).mockReturnValue( {
			mutate,
			isPending: false,
		} as unknown as ReturnType< typeof mutationsHook.useUnignoreThreatMutation > );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		mockCreateSuccessNotice.mockReset();
		mockCreateErrorNotice.mockReset();
	} );

	it( 'renders the threat title, severity badge, and confirm button', () => {
		render( <UnignoreThreatModal items={ [ threat ] } closeModal={ jest.fn() } /> );
		expect( screen.getByText( 'Previously ignored' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'severity-badge' ) ).toHaveTextContent( '5' );
		expect( screen.getByRole( 'button', { name: /unignore threat/i } ) ).toBeInTheDocument();
	} );

	it( 'invokes the unignore mutation with the threat id when confirmed', () => {
		render( <UnignoreThreatModal items={ [ threat ] } closeModal={ jest.fn() } /> );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /unignore threat/i } ) );
		expect( mutate ).toHaveBeenCalledTimes( 1 );
		expect( mutate ).toHaveBeenCalledWith( 'ignored-99', expect.any( Object ) );
	} );

	it( 'closes the modal and shows the success snackbar via onSuccess callback', () => {
		const closeModal = jest.fn();
		mutate.mockImplementation( ( _id, opts ) => opts?.onSuccess?.() );

		render( <UnignoreThreatModal items={ [ threat ] } closeModal={ closeModal } /> );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /unignore threat/i } ) );

		expect( closeModal ).toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith(
			expect.stringMatching( /threat unignored/i ),
			{ type: 'snackbar' }
		);
	} );
} );
