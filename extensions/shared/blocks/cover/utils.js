
/**
 * Internal dependencies
 */
import { isSimpleSite } from "../../site-type-utils";
import getJetpackExtensionAvailability from "../../get-jetpack-extension-availability";

export const videoFileExtensions = [
	'ogv',
	'mp4',
	'm4v',
	'mov',
	'qt',
	'wmv',
	'avi',
	'mpeg',
	'mpg',
	'mpe',
	'3gp',
	'3gpp',
	'3g2',
	'3gp2',
	'3gp',
	'3g2',
];

/**
 * Check if the cover block should show the upgrade nudge.
 *
 * @param {string} name - Block name.
 * @returns {boolean} True if it should show the nudge. Otherwise, False.
 */
export function isUpgradable( name ) {
	const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );

	return name && name === 'core/cover' && // upgrade only for cover block
		isSimpleSite() && // only for Simple sites
		[ 'missing_plan', 'unknown' ].includes( unavailableReason );
}
