
/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { JetpackCoverUpgradeNudge } from './components';
import { isUpgradable, isVideoFile } from './utils';

/**
 * Module Constants
 */
const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];


export default CoreMediaPlaceholder => props => {
	const [ error, setError ] = useState( false );

	const { name } = useBlockEditContext();
	if ( ! isUpgradable( name ) ) {
		return <CoreMediaPlaceholder { ...props } />;
	}

	const { onError } = props;
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
					if ( filename && isVideoFile( filename ) ) {
						return setError( message );
					}
					return onError( message );
				} }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
			/>
		</div>
	);
};
