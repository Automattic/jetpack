import '@testing-library/jest-dom';
import { render, renderHook } from '@testing-library/react';
import { useProtectTooltipCopy } from '../use-protect-tooltip-copy';

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { detail: { hasPaidPlanForProduct: true, manageUrl: '#' } } ),
} ) );

jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );

jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {}, themes: {} } ),
} ) );

const data = ( threatCount: number | null, criticalThreatCount: number | null ) =>
	( {
		scanData: {
			threats: Array.from( { length: 3 }, ( _, id ) => ( { id, severity: 5 } ) ),
		},
		threatCount,
		criticalThreatCount,
		wafConfig: {},
	} ) as unknown as ProtectData;

describe( 'Protect card threats tooltip', () => {
	it.each( [
		[ 1, 1, /The last scan identified 1 threat \(1\scritical\)/ ],
		[ null, null, /The last scan identified 3 threats \(3\scritical\)/ ],
	] )(
		'with threatCount %p and criticalThreatCount %p',
		( threatCount, criticalThreatCount, text ) => {
			const { result } = renderHook( () =>
				useProtectTooltipCopy( data( threatCount, criticalThreatCount ) )
			);
			const { container } = render( <>{ result.current.scanThreatsTooltip.text }</> );

			expect( container ).toHaveTextContent( text );
		}
	);
} );
