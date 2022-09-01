import availableBrowsers from '../fixtures/available-browsers.json';
import browserEngines from '../fixtures/browser_engine.json';
import browsers from '../fixtures/browsers.json';
import mobileOnlyBrowsers from '../fixtures/mobile-only-browsers.json';
import { userAgentParser } from '../utils/user-agent';
import { variableReplacement } from '../utils/variable-replacement';
import { formatVersion, parseBrowserEngineVersion } from '../utils/version';

export interface BrowserResult {
	type: string;
	name: string;
	version: string;
	engine: string;
	engineVersion: string;
}

export default class BrowserParser {
	public static getBrowserShortName = ( browserName: string ): string => {
		for ( const [ shortName, name ] of Object.entries( availableBrowsers ) ) {
			if ( name === browserName ) {
				return shortName;
			}
		}

		return '';
	};

	public static isMobileOnlyBrowser = ( browserName: string ) => {
		return mobileOnlyBrowsers.includes( BrowserParser.getBrowserShortName( browserName ) );
	};

	public parse = ( userAgent: string ): BrowserResult => {
		const result: BrowserResult = {
			type: '',
			name: '',
			version: '',
			engine: '',
			engineVersion: '',
		};

		for ( const browser of browsers ) {
			const match = userAgentParser( browser.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			const vrpVersion = variableReplacement( browser.version, match );
			const version = formatVersion( vrpVersion );
			const shortVersion = ( version && parseFloat( formatVersion( vrpVersion ) ) ) || '';

			if ( browser.engine ) {
				result.engine = browser.engine.default;

				if ( browser.engine && browser.engine.versions && shortVersion ) {
					const sortedEngineVersions = Object.entries( browser.engine.versions ).sort( ( a, b ) => {
						return parseFloat( a[ 0 ] ) > parseFloat( b[ 0 ] ) ? 1 : -1;
					} );

					for ( const [ versionThreshold, engineByVersion ] of sortedEngineVersions ) {
						if ( parseFloat( versionThreshold ) <= shortVersion ) {
							result.engine = engineByVersion || '';
						}
					}
				}
			}

			result.type = 'browser';
			result.name = variableReplacement( browser.name, match );
			result.version = version;
			break;
		}

		if ( ! result.engine ) {
			for ( const browserEngine of browserEngines ) {
				let match = null;
				try {
					match = RegExp( browserEngine.regex, 'i' ).exec( userAgent );
				} catch {
					// TODO: find out why it fails in some browsers
				}

				if ( ! match ) {
					continue;
				}

				result.engine = browserEngine.name;
				break;
			}
		}

		result.engineVersion = formatVersion( parseBrowserEngineVersion( userAgent, result.engine ) );

		return result;
	};
}
