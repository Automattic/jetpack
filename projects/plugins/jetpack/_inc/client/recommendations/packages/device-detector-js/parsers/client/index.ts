import BrowserParser, { BrowserResult } from './browser';
import FeedReaderParser, { FeedReaderResult } from './feed-readers';
import LibraryParser, { LibraryResult } from './libraries';
import MediaPlayerParser, { MediaPlayerResult } from './media-players';
import MobileAppParser, { MobileAppResult } from './mobile-apps';
import PersonalInformationManagerParser, {
	PersonalInformationManagerResult,
} from './personal-information-managers';

export type ClientResult =
	| BrowserResult
	| FeedReaderResult
	| LibraryResult
	| MediaPlayerResult
	| MobileAppResult
	| PersonalInformationManagerResult
	| null;

interface Options {
	versionTruncation: 0 | 1 | 2 | 3 | null;
}

const clientParsers = [
	FeedReaderParser,
	MobileAppParser,
	MediaPlayerParser,
	PersonalInformationManagerParser,
	BrowserParser,
	LibraryParser,
];

export default class ClientParser {
	private readonly options: Options = {
		versionTruncation: 1,
	};

	constructor( options?: Partial< Options > ) {
		this.options = { ...this.options, ...options };
	}

	public parse = ( userAgent: string ): ClientResult => {
		for ( const Parser of clientParsers ) {
			const parser = new Parser( this.options );
			const client = parser.parse( userAgent );

			if ( client.type !== '' ) {
				return client;
			}
		}

		return null;
	};
}
