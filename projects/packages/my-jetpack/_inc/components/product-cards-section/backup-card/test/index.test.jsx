import { render, screen } from '@testing-library/react';

let mockStatus = 'active';
let mockLatestBackup = { is_backing_up: false, last_backup_time: '2026-09-08T14:05:00+00:00' };

jest.mock( '../../../connected-product-card', () => {
	const { createElement } = jest.requireActual( 'react' );
	return {
		__esModule: true,
		default: ( { Description, children } ) =>
			createElement( 'div', null, Description && createElement( Description ), children ),
	};
} );

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( {
		detail: {
			status: mockStatus,
			doesModuleNeedAttention: mockStatus === 'needs_attention_error' && { data: {} },
		},
	} ),
} ) );

jest.mock( '../../../../data/use-simple-query', () => ( {
	__esModule: true,
	default: () => ( { data: mockLatestBackup, isLoading: false, isError: false } ),
} ) );

jest.mock(
	'../../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason',
	() => ( {
		__esModule: true,
		default: () => ( {} ),
	} )
);

jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {
		siteSuffix: 'example.com',
		siteUrl: 'https://example.com',
	} ),
} ) );

/**
 * Load the card against one of the two shapes a bundler can give a CJS-only default import:
 * `__esModule` present (webpack, jest) or absent (esbuild, which follows Node's ESM interop).
 *
 * @param {boolean} withEsModuleFlag - Whether the fake gridicons exports carry `__esModule`.
 * @return {Function} The BackupCard component compiled against that shape.
 */
const loadBackupCard = withEsModuleFlag => {
	const React = require( 'react' );
	let BackupCard;
	jest.isolateModules( () => {
		// The card must share the renderer's React, or its hooks run against a second copy.
		jest.doMock( 'react', () => React );
		jest.doMock( 'gridicons', () => {
			const actual = jest.requireActual( 'gridicons' );
			return withEsModuleFlag ? actual : { default: actual.default };
		} );
		BackupCard = require( '../index' ).default;
	} );
	return BackupCard;
};

describe( 'BackupCard error icon', () => {
	afterEach( () => {
		mockStatus = 'active';
	} );

	it.each( [
		[ 'exports __esModule (webpack, jest)', true ],
		[ 'omits __esModule (esbuild node interop)', false ],
	] )( 'renders the notice gridicon when gridicons %s', ( _label, withEsModuleFlag ) => {
		mockStatus = 'needs_attention_error';
		const BackupCard = loadBackupCard( withEsModuleFlag );

		const { container } = render( <BackupCard admin={ true } /> );

		/* eslint-disable testing-library/no-container, testing-library/no-node-access -- gridicons renders a bare <svg> the test cannot give an attribute. */
		const icon = container.querySelector( 'svg.gridicon' );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect( icon ).toHaveClass( 'gridicons-notice' );
		expect( icon ).toHaveAttribute( 'height', '16' );
	} );
} );

describe( 'BackupCard with backups running', () => {
	it.each( [
		[ { is_backing_up: false, last_backup_time: null }, [ 'Waiting on first backup' ] ],
		[ { is_backing_up: true, last_backup_time: null }, [ 'Backing up now…' ] ],
		[
			{ is_backing_up: true, last_backup_time: '2026-09-08T14:05:00+00:00' },
			[ 'Backing up now…', 'Last backup: September 8, 2026 2:05 pm' ],
		],
		[
			{ is_backing_up: false, last_backup_time: '2026-09-08T14:05:00+00:00' },
			[ 'Last backup: September 8, 2026 2:05 pm' ],
		],
	] )( 'describes %o', ( latestBackup, texts ) => {
		mockLatestBackup = latestBackup;
		const BackupCard = require( '../index' ).default;

		render( <BackupCard admin={ true } /> );

		texts.forEach( text => expect( screen.getByText( text ) ).toBeInTheDocument() );
	} );
} );

describe( 'BackupCard with the backup module off', () => {
	afterEach( () => {
		mockStatus = 'active';
	} );

	it( 'tells a plan holder their backups are still running', () => {
		mockStatus = 'module_disabled';
		const BackupCard = require( '../index' ).default;

		render( <BackupCard admin={ true } /> );

		expect( screen.getByText( /Your backups are still running/ ) ).toBeInTheDocument();
	} );
} );
