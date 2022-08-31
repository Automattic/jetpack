import mobiles from '../fixtures/mobiles.json';
import { DeviceType, GenericDeviceResult } from '../typings/device';
import { userAgentParser } from '../utils/user-agent';

export type DeviceResult = GenericDeviceResult | null;

export default class MobileParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
		};
		let resultType = '';

		for ( const [ brand, mobile ] of Object.entries( mobiles ) ) {
			const match = userAgentParser( mobile.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			resultType = ( 'device' in mobile && mobile.device ) || '';
			result.brand = brand;
		}

		if ( resultType === 'car browser' ) {
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
