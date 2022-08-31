import mediaPlayers from '../../fixtures/regexes/client/mediaplayers.json';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';
import { formatVersion } from '../../utils/version';

export interface MediaPlayerResult {
	type: string;
	name: string;
	version: string;
}

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
}

export default class MediaPlayerParser {
	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

	public parse = ( userAgent: string ): MediaPlayerResult => {
		const result: MediaPlayerResult = {
			type: '',
			name: '',
			version: '',
		};

		for ( const mediaPlayer of mediaPlayers ) {
			const match = userAgentParser( mediaPlayer.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = 'media player';
			result.name = variableReplacement( mediaPlayer.name, match );
			result.version = formatVersion(
				variableReplacement( mediaPlayer.version, match ),
				this.options.versionTruncation
			);
			break;
		}

		return result;
	};
}
