
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UpgradeNudge from "../../components/upgrade-nudge";

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image' ];

const JetpackCoverUpgradeNudge = ( { name, show } ) =>
	show
		? <UpgradeNudge
			plan="value_bundle"
			blockName={ name }
			title={ {
				knownPlan: __( 'To use a video in this block, upgrade to %(planName) plan.', 'jetpack' ),
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

export default ( name ) => createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const [ uploadingError, setUploadingError ] = useState( false );
		const { onError } = props;

		return (
			<Fragment>
				<JetpackCoverUpgradeNudge name={ name } show={ uploadingError } />
				<CoreMediaPlaceholder
					{ ...props }
					onError = { ( message ) => {
						setUploadingError( true );
						return onError( message );
					} }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
				/>
			</Fragment>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
