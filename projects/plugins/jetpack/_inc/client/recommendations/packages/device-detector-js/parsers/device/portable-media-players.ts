import portableMediaPlayers from '../../fixtures/regexes/device/portable_media_player.json';
import { DeviceType, GenericDeviceResult } from '../../typings/device';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';

export default class PortableMediaPlayersParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
			model: '',
		};

		for ( const [ brand, portableMediaPlayer ] of Object.entries( portableMediaPlayers ) ) {
			const match = userAgentParser( portableMediaPlayer.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = portableMediaPlayer.device as DeviceType;
			result.brand = brand;

			if ( 'model' in portableMediaPlayer && portableMediaPlayer.model ) {
				result.model = variableReplacement( portableMediaPlayer.model, match ).trim();
			} else if ( 'models' in portableMediaPlayer && portableMediaPlayer.models ) {
				for ( const model of portableMediaPlayer.models ) {
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
