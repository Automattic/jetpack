const fs = require( 'fs' );
const { getInput } = require( '@actions/core' );
const { debug } = require( './debug' );
const extras = require( './extra-context' );

/**
 * Returns a list o Slack channel ids, based on context and rules configuration.
 *
 * @returns {string[]} an array of channels ids
 */
function getChannels() {
	const channels = [];
	const defaultChannel = getInput( 'slack_channel' );
	const rulesConfigurationPath = getInput( 'rules_configuration_path' );
	const suiteName = getInput( 'suite_name' );

	// If no rules are configured we only use the default channel
	if ( ! rulesConfigurationPath ) {
		debug( 'No rules configuration found, returning only the default channel' );
		channels.push( defaultChannel );
	} else {
		const rulesConfiguration = JSON.parse(
			fs.readFileSync( rulesConfigurationPath, { encoding: 'utf8' } )
		);
		const { refs, suites } = rulesConfiguration;
		const { refType, refName } = extras;

		if ( refs ) {
			for ( const rule of refs ) {
				if ( rule.type === refType && rule.name === refName ) {
					channels.push( ...rule.channels );
				}

				if ( ! rule.excludeDefaultChannel ) {
					channels.push( defaultChannel );
				}
			}
		}

		if ( suites ) {
			for ( const rule of suites ) {
				if ( rule.name === suiteName ) {
					channels.push( ...rule.channels );
				}

				if ( ! rule.excludeDefaultChannel ) {
					channels.push( defaultChannel );
				}
			}
		}

		if ( ! refs && ! suites ) {
			debug( 'No valid rules found, returning only the default channel' );
			channels.push( defaultChannel );
		}
	}

	const uniqueChannels = [ ...new Set( channels ) ];
	debug( `Found ${ uniqueChannels.length } channels` );
	return uniqueChannels;
}

module.exports = { getChannels };
