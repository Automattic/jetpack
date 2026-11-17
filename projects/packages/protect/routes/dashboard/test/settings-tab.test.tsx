import { render, screen } from '@testing-library/react';
import SettingsTab from '../components/settings-tab';

jest.mock( '../sections', () => ( {
	__esModule: true,
	default: [ 'firewall', 'monitor' ].map( key => ( {
		key,
		SettingsCard: () => <h2>{ key }</h2>,
	} ) ),
} ) );

const settings = ( overrides = {} ) =>
	( {
		isLoaded: true,
		error: '',
		dismissError: jest.fn(),
		load: jest.fn(),
		...overrides,
	} ) as never;

describe( 'Protect dashboard Settings tab', () => {
	const scrollIntoView = jest.fn();

	beforeEach( () => {
		scrollIntoView.mockReset();
		Element.prototype.scrollIntoView = scrollIntoView;
	} );

	it( 'lands on the requested card once, not again after a save', () => {
		const { rerender } = render(
			<SettingsTab settings={ settings() } openTab={ jest.fn() } section="monitor" />
		);

		expect( screen.getByRole( 'heading', { name: 'monitor' } ) ).toHaveFocus();
		expect( scrollIntoView ).toHaveBeenCalledTimes( 1 );
		expect( scrollIntoView.mock.contexts[ 0 ] ).toHaveAttribute(
			'id',
			'jp-protect-settings-monitor'
		);

		rerender(
			<SettingsTab
				settings={ settings( { isSaving: true } ) }
				openTab={ jest.fn() }
				section="monitor"
			/>
		);

		expect( scrollIntoView ).toHaveBeenCalledTimes( 1 );
	} );
} );
