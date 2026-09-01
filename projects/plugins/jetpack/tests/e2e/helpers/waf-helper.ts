import logger from '@automattic/_jetpack-e2e-commons/logger';
import { executeWpCommand } from '@automattic/_jetpack-e2e-commons/utils/cli';

/**
 * Enable automatic rules
 * @return {string} wp-cli 'jetpack-waf generate_rules' command output
 */
export async function enableAutomaticRules(): Promise< void > {
	logger.debug( 'Enabling automatic firewall rules' );
	await executeWpCommand( 'option update jetpack_waf_automatic_rules 1' );
	await generateRules();
}

/**
 * Generate firewall rules
 * @return {string} wp-cli command output
 */
export async function generateRules(): Promise< string > {
	logger.debug( 'Generating firewall rules' );
	return executeWpCommand( 'jetpack-waf generate_rules' );
}
