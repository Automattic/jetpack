
/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditContext } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UpgradeNudge from "../../components/upgrade-nudge";
import { videoFileExtensions } from './utils';
import { isSimpleSite } from "../../site-type-utils";
import getJetpackExtensionAvailability from "../../get-jetpack-extension-availability";

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

const JetpackCoverUpgradeNudge = ( { name, show } ) =>
	show
		? <UpgradeNudge
			plan="value_bundle"
			blockName={ name }
			title={ {
				knownPlan: __( 'To use a video in this block, upgrade to %(planName)s.', 'jetpack' ),
				unknownPlan: __( 'To use a video in this block, upgrade to a paid plan.', 'jetpack' ),
			} }
			subtitle={ __(
				'Upload unlimited videos to your website and \
				display them using a fast, unbranded, \
				customizable player.',
				'jetpack'
			) }
		/>
		: null;

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );
		if (
			( ! name || name !== 'core/cover' ) || // extend only for cover block
			! isSimpleSite() || // only for Simple sites
			! [ 'missing_plan', 'unknown' ].includes( unavailableReason )
		) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		const { onError } = props;
		const [ error, setError ] = useState( false );

		return (
			<div className="jetpack-cover-media-placeholder">
				<JetpackCoverUpgradeNudge name={ name } show={ !! error } />
				<CoreMediaPlaceholder
					{ ...props }
					multiple={ false }
					onError = { ( message ) => {
						// Try to pick up filename from the error message.
						// We should find a better way to do it. Unstable.
						const filename = message?.[0]?.props?.children;
						if ( filename ) {
							const fileExtension = ( filename.split( '.' ) )?.[ 1 ];
							if ( videoFileExtensions.includes( fileExtension ) ) {
								return setError( message );
							}
						}
						return onError( message );
					} }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
				/>
			</div>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
