import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import logger from 'jetpack-e2e-commons/logger.cjs';

export async function enableAutomaticRules() {
	logger.sync( 'Enabling automatic firewall rules' );
	const optionUpdated = execWpCommand( 'option update jetpack_waf_automatic_rules 1' );
	const rulesGenerated = execWpCommand( 'jetpack-waf generate_rules' );
	return optionUpdated && rulesGenerated;
}

export async function generateRules() {
	logger.sync( 'Generating firewall rules' );
	return execWpCommand( 'jetpack-waf generate_rules' );
}
