import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import logger from 'jetpack-e2e-commons/logger.cjs';

export async function enableAutomaticRules() {
	logger.sync( 'Enabling automatic firewall rules' );
	return execWpCommand( 'option update jetpack_waf_automatic_rules 1' );
}

export async function generateRules() {
	logger.sync( 'Generating firewall rules' );
	return execWpCommand( 'jetpack-waf generate_rules' );
}
