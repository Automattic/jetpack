import { render } from '@testing-library/react';
import { chartScopeClass } from '../../../styles';
import { GlobalChartsProvider } from '../global-charts-provider';

// The stock defaultTheme's mapped fields are themselves self-referential pointers
// (e.g. `gridStyles.stroke: 'var(--a8c-charts-color-grid, #dbdbdb)'`), so
// themeOverrideVars' own self-reference guard already filters them out no matter which
// theme object the provider passes in. That makes "reads theme, not providerTheme"
// unfalsifiable against the real default theme. Mocking the default here to a plain,
// non-pointer value removes that overlap, so this test only passes when the provider
// reads the raw consumer `theme` prop rather than the merged `providerTheme`.
jest.mock( '../themes', () => {
	const actual = jest.requireActual( '../themes' );
	return {
		...actual,
		defaultTheme: {
			...actual.defaultTheme,
			gridStyles: { ...actual.defaultTheme.gridStyles, stroke: '#dbdbdb' },
		},
	};
} );

describe( 'GlobalChartsProvider wrapper style (discriminating guard test)', () => {
	it( 'does not emit an instance override for a role the consumer left unset, even though the merged theme carries a concrete default value', () => {
		const { container } = render(
			<GlobalChartsProvider theme={ { tickLength: 8 } }>
				<div>child</div>
			</GlobalChartsProvider>
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const wrapper = container.querySelector< HTMLElement >( `.${ chartScopeClass }` );

		expect( wrapper?.style.getPropertyValue( '--a8c-charts-color-grid' ) ).toBe( '' );
	} );
} );
