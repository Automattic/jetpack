import televisions from '../../fixtures/regexes/device/televisions.json';
import { GenericDeviceResult } from '../../typings/device';
import { buildModel } from '../../utils/model';
import { userAgentParser } from '../../utils/user-agent';
import { variableReplacement } from '../../utils/variable-replacement';

export default class TelevisionParser {
	public parse = ( userAgent: string ): GenericDeviceResult => {
		const result: GenericDeviceResult = {
			type: '',
			brand: '',
			model: '',
		};

		if ( ! this.isHbbTv( userAgent ) ) {
			return result;
		}

		result.type = 'television';

		for ( const [ brand, television ] of Object.entries( televisions ) ) {
			const match = userAgentParser( television.regex, userAgent );

			if ( ! match ) {
				continue;
			}

			result.brand = brand;

			if ( 'model' in television && television.model ) {
				result.model = buildModel( variableReplacement( television.model, match ) ).trim();
			} else if ( 'models' in television && television.models ) {
				for ( const model of television.models ) {
					const modelMatch = userAgentParser( model.regex, userAgent );

					if ( ! modelMatch ) {
						continue;
					}

					result.model = buildModel( variableReplacement( model.model, modelMatch ) ).trim();
					break;
				}
			}
			break;
		}

		return result;
	};

	private isHbbTv = ( userAgent: string ) => {
		return userAgentParser( 'HbbTV/([1-9]{1}(?:.[0-9]{1}){1,2})', userAgent );
	};
}
