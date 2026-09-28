import { render } from '@testing-library/react';

jest.mock( '../../../connected-product-card', () => {
	const { createElement } = jest.requireActual( 'react' );
	return {
		__esModule: true,
		default: ( { children } ) => createElement( 'div', null, children ),
	};
} );

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { detail: { status: 'active', doesModuleNeedAttention: false } } ),
} ) );

jest.mock( '../../../../data/use-simple-query', () => ( {
	__esModule: true,
	default: () => ( {
		data: {
			last_rewindable_event: {
				gridicon: 'history',
				summary: 'Post published',
				published: '2026-09-08T00:00:00+00:00',
			},
			undo_backup_id: 42,
		},
		isLoading: false,
	} ),
} ) );

jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: () => {} } ),
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
	let BackupCard;
	jest.isolateModules( () => {
		jest.doMock( 'gridicons', () => {
			const actual = jest.requireActual( 'gridicons' );
			return withEsModuleFlag ? actual : { default: actual.default };
		} );
		BackupCard = require( '../index' ).default;
	} );
	return BackupCard;
};

describe( 'BackupCard activity icon', () => {
	it.each( [
		[ 'exports __esModule (webpack, jest)', true ],
		[ 'omits __esModule (esbuild node interop)', false ],
	] )( 'renders the last activity gridicon when gridicons %s', ( _label, withEsModuleFlag ) => {
		const BackupCard = loadBackupCard( withEsModuleFlag );

		const { container } = render( <BackupCard admin={ true } /> );

		/* eslint-disable testing-library/no-container, testing-library/no-node-access -- gridicons renders a bare <svg> the test cannot give an attribute. */
		const icon = container.querySelector( 'svg.gridicon' );
		/* eslint-enable testing-library/no-container, testing-library/no-node-access */
		expect( icon ).toHaveClass( 'gridicons-history' );
		expect( icon ).toHaveAttribute( 'height', '24' );
		expect( icon ).toHaveAttribute( 'width', '24' );
	} );
} );
