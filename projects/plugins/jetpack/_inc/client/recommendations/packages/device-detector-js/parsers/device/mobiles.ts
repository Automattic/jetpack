import mobiles from '../../fixtures/regexes/device/mobiles.json';
import { DeviceType, GenericDeviceResult } from '../../typings/device';
import { buildModel } from '../../utils/model';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';

export default class MobileParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
			model: '',
		};
		let resultType = '';

		for ( const [ brand, mobile ] of Object.entries( mobiles ) ) {
			const match = userAgentParser( mobile.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			resultType = ( 'device' in mobile && mobile.device ) || '';
			result.brand = brand;

			if ( 'model' in mobile && mobile.model ) {
				result.model = buildModel( variableReplacement( mobile.model, match ) ).trim();
			} else if ( 'models' in mobile && mobile.models ) {
				for ( const model of mobile.models ) {
					const modelMatch = userAgentParser( model.regex, userAgent );

					if ( ! modelMatch ) {
						continue;
					}

					result.model = buildModel( variableReplacement( model.model, modelMatch ) ).trim();

					if ( 'device' in model && model.device ) {
						resultType = model.device;
					}

					if ( 'brand' in model ) {
						result.brand = model.brand || '';
					}
					break;
				}
			}
			break;
		}

		// Sanitize device type
		if ( resultType === 'tv' ) {
			result.type = 'television';
		} else if ( resultType === 'car browser' ) {
			result.type = 'car';
		} else {
			result.type = resultType as DeviceType;
		}

		// Sanitize device brand
		if ( result.brand === 'Unknown' ) {
			result.brand = '';
		}

		return result;
	};
}
