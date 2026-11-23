/**
 * Internal dependencies
 */
import { getParselySignupUrl, offersParselyPrompts } from '../parsely-prompts';

const mockScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getScriptData: () => mockScriptData(),
} ) );

describe( 'parsely prompts script data', () => {
	it.each( [
		[
			'reads what the server published',
			{
				premium_analytics: {
					offers_parsely_prompts: true,
					parsely_signup_url: 'https://dash.parsely.com/self-serve?utm_source=jetpack',
				},
			},
			true,
			'https://dash.parsely.com/self-serve?utm_source=jetpack',
		],
		[
			'offers nothing on a server that predates the prompts',
			{ premium_analytics: {} },
			false,
			undefined,
		],
		[
			'treats an empty URL as none',
			{ premium_analytics: { offers_parsely_prompts: false, parsely_signup_url: '' } },
			false,
			undefined,
		],
	] )( '%s', ( _case, scriptData, offers, url ) => {
		mockScriptData.mockReturnValue( scriptData );

		expect( offersParselyPrompts() ).toBe( offers );
		expect( getParselySignupUrl() ).toBe( url );
	} );
} );
