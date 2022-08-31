import vendorFragments from '../fixtures/vendorfragments.json';
import { userAgentParser } from '../utils/user-agent';

export default class VendorFragmentParser {
	public parse = ( userAgent: string ): string => {
		for ( const [ brand, vendorFragment ] of Object.entries( vendorFragments ) ) {
			for ( const regex of vendorFragment ) {
				const match = userAgentParser( regex, userAgent );

				if ( ! match ) {
					continue;
				}

				return brand;
			}
		}

		return '';
	};
}
