const { getInput } = require( '@actions/core' );
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

	// If no rules are configured we only use the default channel
	if ( ! rulesConfigurationPath ) {
		channels.push( defaultChannel );
	}

	if ( rulesConfigurationPath ) {
		const rulesConfiguration = require( rulesConfigurationPath );
		const { refs, suites } = rulesConfiguration;
		const { refType, refName } = extras;

		if ( refs ) {
			for ( const rule of refs ) {
				if ( rule.type === refType && rule.name === refName ) {
					channels.push( ...rule.channels );

					if ( ! rule.excludeDefaultChannel ) {
						channels.push( defaultChannel );
					}
				}
			}
		}

		if ( suites ) {
			for ( const rule of suites ) {
				if ( rule.name === refName ) {
					channels.push( ...rule.channels );

					if ( ! rule.excludeDefaultChannel ) {
						channels.push( defaultChannel );
					}
				}
			}
		}

		if ( ! refs && ! suites ) {
			channels.push( defaultChannel );
		}
	}

	return channels;
}

module.exports = { getChannels };
