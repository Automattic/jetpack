import '@testing-library/jest-dom';
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { ModulesList } from '../index';
import type { MyJetpackModule } from '../../../types';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
// ModuleToggle's own behavior has its own tests; here it only marks where a toggle rendered.
jest.mock( '../../module-toggle', () => {
	const react = jest.requireActual( 'react' );
	return {
		ModuleToggle: ( { module: $module } ) =>
			react.createElement( 'input', {
				type: 'checkbox',
				'aria-label': `Toggle ${ $module.name } module`,
			} ),
	};
} );

const buildModule = ( overrides: Partial< MyJetpackModule > ): MyJetpackModule => ( {
	available: true,
	module: 'monitor',
	name: 'Downtime Monitor',
	activated: true,
	override: false,
	description: '',
	long_description: '',
	search_terms: '',
	...overrides,
} );

describe( 'ModulesList', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { site: { is_multisite: false } } );
	} );

	it( 'shows a note instead of a toggle on a module a host forced on', () => {
		render(
			<ModulesList
				modules={ [
					buildModule( { module: 'activity-log', name: 'Activity Log', override: 'active' } ),
					buildModule( {} ),
				] }
			/>
		);

		expect(
			screen.getByText( 'Turned on by your host or site administrator' )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: 'Toggle Activity Log module' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'checkbox', { name: 'Toggle Downtime Monitor module' } )
		).toBeInTheDocument();
	} );
} );
