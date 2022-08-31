import cars from '../../fixtures/regexes/device/car_browsers.json';
import { GenericDeviceResult } from '../../typings/device';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';

export default class CarParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
			model: '',
		};

		for ( const [ brand, car ] of Object.entries( cars ) ) {
			const match = userAgentParser( car.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.type = 'car';
			result.brand = brand;

			for ( const model of car.models ) {
				const modelMatch = userAgentParser( model.regex, userAgent );

				if ( ! modelMatch ) {
					continue;
				}

				result.model = variableReplacement( model.model, modelMatch ).trim();
			}

			break;
		}

		return result;
	};
}
