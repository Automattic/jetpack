import personalInformationManagers from '../../fixtures/regexes/client/pim.json';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';
import { formatVersion } from '../../utils/version';

export interface PersonalInformationManagerResult {
	type: string;
	name: string;
	version: string;
}

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
}

export default class PersonalInformationManagerParser {
	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

	public parse = ( userAgent: string ): PersonalInformationManagerResult => {
		const result: PersonalInformationManagerResult = {
			type: '',
			name: '',
			version: '',
		};

		for ( const personalInformationManager of personalInformationManagers ) {
			const match = userAgentParser( personalInformationManager.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = 'personal information manager';
			result.name = variableReplacement( personalInformationManager.name, match );
			result.version = formatVersion(
				variableReplacement( personalInformationManager.version, match ),
				this.options.versionTruncation
			);
			break;
		}

		return result;
	};
}
