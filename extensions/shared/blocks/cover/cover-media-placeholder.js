/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../../components/upgrade-nudge';
import { videoFileExtensions } from './utils';
import { isSimpleSite } from '../../site-type-utils';
import getJetpackExtensionAvailability from '../../get-jetpack-extension-availability';

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

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
const JetpackCoverUpgradeNudge = ( { name, show } ) =>
	show ? (
		<UpgradeNudge
			plan="value_bundle"
			blockName={ name }
			title={ {
				knownPlan: __( 'To use a video in this block, upgrade to %(planName)s.', 'jetpack' ),
				unknownPlan: __( 'To use a video in this block, upgrade to a paid plan.', 'jetpack' ),
			} }
			subtitle={ false }
		/>
	) : null;

export default CoreMediaPlaceholder => props => {
	const [ error, setError ] = useState( false );
	const { name } = useBlockEditContext();
	const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );

	if (
		! name ||
		name !== 'core/cover' || // extend only for cover block
		! isSimpleSite() || // only for Simple sites
		! [ 'missing_plan', 'unknown' ].includes( unavailableReason )
	) {
		return <CoreMediaPlaceholder { ...props } />;
	}

	const { onError } = props;
	return (
		<div className="jetpack-cover-media-placeholder">
			<JetpackCoverUpgradeNudge name={ name } show={ !! error } />
			<CoreMediaPlaceholder
				{ ...props }
				multiple={ false }
				onError={ message => {
					// Try to pick up filename from the error message.
					// We should find a better way to do it. Unstable.
					const filename = message?.[ 0 ]?.props?.children;
					if ( ! filename ) {
						return onError( message );
					}

					const fileExtension = filename.split( '.' )?.[ 1 ];
					if ( ! videoFileExtensions.includes( fileExtension ) ) {
						return onError( message );
					}

					return setError( message );
				} }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
			/>
		</div>
	);
};
