import libraries from '../../fixtures/regexes/client/libraries.json';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';
import { formatVersion } from '../../utils/version';

export interface LibraryResult {
	type: string;
	name: string;
	version: string;
	url: string;
}

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
}

export default class LibraryParser {
	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

	public parse = ( userAgent: string ): LibraryResult => {
		const result: LibraryResult = {
			type: '',
			name: '',
			version: '',
			url: '',
		};

		for ( const library of libraries ) {
			const match = userAgentParser( library.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = 'library';
			result.name = variableReplacement( library.name, match );
			result.version = formatVersion(
				variableReplacement( library.version, match ),
				this.options.versionTruncation
			);
			result.url = library.url || '';
			break;
		}

		return result;
	};
}
