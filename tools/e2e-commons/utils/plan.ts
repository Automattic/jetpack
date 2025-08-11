import logger from '../logger';
import { TestUtils } from '.';

/**
 * Set plan data using the e2e-plan-helper REST API endpoint
 *
 * @param planType - Jetpack plan slug (jetpack_free or jetpack_complete)
 * @return Promise that resolves when plan data is set
 */
export async function setMockPlanData(
	this: TestUtils,
	planType: 'jetpack_free' | 'jetpack_complete' = 'jetpack_complete'
): Promise< void > {
	logger.debug( `Setting mocked plan data: ${ planType }` );

	try {
		const response = await this.requestUtils.rest( {
			method: 'POST',
			path: '/e2e-plan-helper/v1/plan-data',
			data: {
				plan_type: planType,
			},
		} );

		logger.debug(
			`Mocked plan data set successfully for ${ planType }: ${ JSON.stringify( response ) }`
		);
	} catch ( error ) {
		logger.warn( `Failed to set mocked plan data: ${ JSON.stringify( error ) }` );
		throw error;
	}
}
