
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UpgradeNudge from "../components/upgrade-nudge";

/**
 * Nudge shows when the user tries to upload a video file.
 * Unlike the core/video block, handled/extended by the videopress block,
 * the nudge is not shown permanently.
 * It's handled by the MediaPlaceholder component
 * when the user tries to upload a video file.
 * For this reason, we can't wrap the edit setting
 * with the wrapPaidBlock() HOC, as the videopress does.
 *
 * @param {object}  props - Information about the user.
 * @param {string}  props.name - Show the Nudge component.
 * @param {boolean} props.show - Show the Nudge component.
 * @returns {*} Nudge component or Null.
 */
export const JetpackCoverUpgradeNudge = ( { name, show } ) =>
	show
		? <UpgradeNudge
			plan="value_bundle"
			blockName={ name }
			title={ {
				knownPlan: __( 'To use a video in this block, upgrade to %(planName)s.', 'jetpack' ),
				unknownPlan: __( 'To use a video in this block, upgrade to a paid plan.', 'jetpack' ),
			} }
			subtitle={ false }
		/>
		: null;
