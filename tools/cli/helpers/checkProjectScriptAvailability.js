/**
 * External dependencies
 */
import chalk from 'chalk';

/**
 * Does the project have the given script available?
 *
 * @param {string} projectName  - The name of the project.
 * @param {string} scriptName   - The name of the script to check its availability.
 * @param {object} composerJson - The project's composer.json file, parsed.
 * @param {boolean} output      - Whether to output the result.
 * @returns {boolean} If the project has a watch step, the watch command or false.
 */
export default function checkPropjectScriptAvailability(
	projectName,
	scriptName,
	composerJson,
	output = true
) {
	if ( composerJson.scripts && composerJson.scripts[ scriptName ] ) {
		return true;
	}

	// There's no scriupt step defined.
	output
		? console.warn(
				chalk.yellow(
					`${ chalk.bold( projectName ) } does not have a proper script defined in composer.json`
				),
				chalk.yellow(
					`\nPlease add the ${ chalk.bold( scriptName ) } script to your composer.json file.`
				)
		  )
		: null;
	return false;
}
