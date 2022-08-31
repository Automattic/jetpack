import mobileApps from '../../fixtures/regexes/client/mobile_apps.json';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';
import { formatVersion } from '../../utils/version';

export interface MobileAppResult {
	type: string;
	name: string;
	version: string;
}

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
}

export default class MobileAppParser {
	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

	public parse = ( userAgent: string ): MobileAppResult => {
		const result: MobileAppResult = {
			type: '',
			name: '',
			version: '',
		};

		for ( const mobileApp of mobileApps ) {
			const match = userAgentParser( mobileApp.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = 'mobile app';
			result.name = variableReplacement( mobileApp.name, match );
			result.version = formatVersion(
				variableReplacement( mobileApp.version, match ),
				this.options.versionTruncation
			);
			break;
		}

		return result;
	};
}
