/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../../components/upgrade-nudge';

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
export const JetpackCoverUpgradeNudge = ( { name, show, align } ) =>
	show ? (
		<div className="jetpack-upgrade-nudge-wrapper wp-block" data-align={ align }>
			<UpgradeNudge
				plan="value_bundle"
				blockName={ name }
				title={ {
					knownPlan: __( 'To use a video in this block, upgrade to %(planName)s.', 'jetpack' ),
					unknownPlan: __( 'To use a video in this block, upgrade to a paid plan.', 'jetpack' ),
				} }
				subtitle={ false }
			/>
		</div>
	) : null;

/**
 * Cover Media context
 * Used to connect the CoverEdit with
 * the Media Replace Flow.
 */
export const CoverMediaContext = createContext();

/**
 * Cover Media Provider will populate the properties
 * from the CoverEdit to the Media Replace Flow component.
 *
 * @param {object}  props - Provider properties.
 * @param {Function}  props.onFilesUpload - Callback function before to upload files.
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
export const CoverMediaProvider = ( { onFilesUpload, children } ) => {
	return (
		<CoverMediaContext.Provider value={ onFilesUpload }>{ children }</CoverMediaContext.Provider>
	);
};
