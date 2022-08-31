import bots from '../../fixtures/regexes/bots.json';
import { userAgentParser } from '../../utils/user-agent';
import { BotResult } from './typing';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace BotParser {
	export type DeviceDetectorBotResult = BotResult | null;
}

class BotParser {
	public parse = ( userAgent: string ): BotParser.DeviceDetectorBotResult => {
		for ( const bot of bots ) {
			const match = userAgentParser( bot.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			return {
				name: bot.name,
				category: bot.category || '',
				url: bot.url || '',
				producer: {
					name: bot?.producer?.name || '',
					url: bot?.producer?.url || '',
				},
			};
		}

		return null;
	};
}

export default BotParser;
