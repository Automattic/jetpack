import { Status } from 'jest-circus-allure-environment';
const logger = require( '../logger' );

// test comments
export const testStep = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );

	const allureStep = allure.startStep( stepName );

	try {
		await fn();
		allureStep.status = Status.PASSED;
		allureStep.endStep();
	} catch ( error ) {
		allureStep.status = Status.FAILED;
		allureStep.endStep();
		throw error;
	}
};
