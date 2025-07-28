import logger from '../logger.js';
import { TestUtils } from './index.ts';

/**
 * Set plan data using the e2e-helper REST API endpoint
 *
 * @param planType - Jetpack plan slug (jetpack_free or jetpack_complete)
 * @return Promise that resolves when plan data is set
 */
export async function setMockPlanData(
	this: TestUtils,
	planType: 'jetpack_free' | 'jetpack_complete' = 'jetpack_complete'
): Promise< void > {
	logger.info( `Setting plan data via REST API: ${ planType }` );

	try {
		const response = await this.requestUtils.rest( {
			method: 'POST',
			path: '/e2e-helper/v1/plan-data',
			data: {
				plan_type: planType,
			},
		} );

		logger.info( `Plan data set successfully for ${ planType }: ${ JSON.stringify( response ) }` );
	} catch ( error ) {
		logger.error( `Failed to set plan data: ${ JSON.stringify( error ) }` );
		throw error;
	}
}
