import consoles from '../../fixtures/regexes/device/consoles.json';
import { DeviceType, GenericDeviceResult } from '../../typings/device';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';

export default class ConsoleParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
			model: '',
		};

		for ( const [ brand, gameConsole ] of Object.entries( consoles ) ) {
			const match = userAgentParser( gameConsole.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = gameConsole.device as DeviceType;
			result.brand = brand;

			if ( 'model' in gameConsole && gameConsole.model ) {
				result.model = variableReplacement( gameConsole.model, match ).trim();
			} else if ( 'models' in gameConsole && gameConsole.models ) {
				for ( const model of gameConsole.models ) {
					const modelMatch = userAgentParser( model.regex, userAgent );

					if ( ! modelMatch ) {
						continue;
					}

					result.model = variableReplacement( model.model, modelMatch ).trim();
					break;
				}
			}
			break;
		}

		return result;
	};
}
