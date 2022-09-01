import mobiles from '../fixtures/mobiles.json';
import { DeviceType, GenericMobileResult } from '../typings/device';
import { buildModel } from '../utils/model';
import { userAgentParser } from '../utils/user-agent';
import { variableReplacement } from '../utils/variable-replacement';

export type MobileResult = GenericMobileResult | null;

export default class MobileParser {
	public parse = ( userAgent: string ): GenericMobileResult => {
		const result: GenericMobileResult = {
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

		result.type = resultType as DeviceType;

		// Sanitize device brand
		if ( result.brand === 'Unknown' ) {
			result.brand = '';
		}

		return result;
	};
}
