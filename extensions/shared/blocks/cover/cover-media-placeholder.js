
/**
 * External dependencies
 */
import { pickBy, keys, map, flatten } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

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

const JetpackCoverMediaPlaceholder = ( name ) => createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { onError, allowedVideoFileExtensions } = props;
		const [ error, setError ] = useState( false );

		return (
			<Fragment>
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
							if ( allowedVideoFileExtensions.includes( fileExtension ) ) {
								return setError( message );
							}
						}
						return onError( message );
					} }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
				/>
			</Fragment>
		);
	},
	'JetpackCoverMediaPlaceholder'
);

export default ( name ) => compose( [
	withSelect( ( select ) => {
		const { getEditorSettings } = select( 'core/editor' );
		const wpAllowedMimeTypes = getEditorSettings().allowedMimeTypes || [];
		const allowedVideoMimeTypes = pickBy( wpAllowedMimeTypes, ( type ) => /^video\//.test( type ) );
		const allowedVideoFileExtensions = flatten( map( keys( allowedVideoMimeTypes ), ext => ext.split( '|' ) ) );

		return {
			allowedVideoMimeTypes,
			allowedVideoFileExtensions,
		};
	} ),
	JetpackCoverMediaPlaceholder( name )
] );
