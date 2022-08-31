import browserEngines from '../../fixtures/regexes/client/browser_engine.json';
import browsers from '../../fixtures/regexes/client/browsers.json';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';
import { formatVersion, parseBrowserEngineVersion } from '../../utils/version';
import availableBrowsers from './fixtures/available-browsers.json';
import mobileOnlyBrowsers from './fixtures/mobile-only-browsers.json';

export interface BrowserResult {
	type: string;
	name: string;
	version: string;
	engine: string;
	engineVersion: string;
}

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
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

	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

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
			const version = formatVersion( vrpVersion, this.options.versionTruncation );
			const shortVersion = ( version && parseFloat( formatVersion( vrpVersion, 1 ) ) ) || '';

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

		result.engineVersion = formatVersion(
			parseBrowserEngineVersion( userAgent, result.engine ),
			this.options.versionTruncation
		);

		return result;
	};
}
