import { render, renderHook } from '@testing-library/react';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { useGetPaidPlanNeedsPluginsContent } from '../get-paid-plan-needs-plugins-content';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( () => 'https://example.com' ),
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { siteSuffix: 'example.com' } ),
} ) );

const MESSAGE_SINGULAR =
	'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you activate the following %2$d plugin:';
const MESSAGE_PLURAL =
	'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you activate the following %2$d plugins:';

describe( 'useGetPaidPlanNeedsPluginsContent', () => {
	beforeEach( () => {
		setLocaleData(
			{
				'Activate %d plugin in one click': [ 'T: %d plugin button', 'T: %d plugins button' ],
				[ MESSAGE_SINGULAR ]: [
					'T: %2$d plugin for <link>%1$s</link>',
					'T: %2$d plugins for <link>%1$s</link>',
				],
			},
			'jetpack-my-jetpack'
		);
	} );

	afterEach( () => {
		resetLocaleData();
	} );

	const renderContent = ( needsActivated: string[] ) =>
		renderHook( () =>
			useGetPaidPlanNeedsPluginsContent( {
				alert: { needs_activated_only: needsActivated } as Parameters<
					typeof useGetPaidPlanNeedsPluginsContent
				>[ 0 ][ 'alert' ],
				planName: 'Jetpack Security',
				planPurchaseId: '123',
			} )
		).result.current;

	it.each( [
		[ [ 'backup' ], 'T: 1 plugin button', 'T: 1 plugin for Jetpack Security' ],
		[ [ 'backup', 'boost' ], 'T: 2 plugins button', 'T: 2 plugins for Jetpack Security' ],
	] )(
		'translates full sentences by plural form for %p',
		( plugins, expectedButton, expectedMessage ) => {
			const { buttonLabel, noticeMessage } = renderContent( plugins );

			expect( buttonLabel ).toBe( expectedButton );
			const { container } = render( <>{ noticeMessage }</> );
			expect( container ).toHaveTextContent( expectedMessage );
		}
	);

	it( 'keeps the untranslated plural sentence intact', () => {
		resetLocaleData();
		const { buttonLabel, noticeMessage } = renderContent( [ 'backup', 'boost' ] );

		expect( buttonLabel ).toBe( 'Activate 2 plugins in one click' );
		const { container } = render( <>{ noticeMessage }</> );
		expect( container ).toHaveTextContent(
			MESSAGE_PLURAL.replace( /<\/?link>/g, '' )
				.replace( '%1$s', 'Jetpack Security' )
				.replace( '%2$d', '2' )
		);
	} );
} );
