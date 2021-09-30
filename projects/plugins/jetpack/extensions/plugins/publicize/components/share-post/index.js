/**
 * WordPress dependencies
 */
import { Button, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSharePost } from '../../hooks/use-share-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';

export function SharePostButton() {
	const [ isSharing, setIsSharing ] = useState( false );
	const { hasEnabledConnections } = useSocialMediaConnections();

	const onPostShareHander = useSharePost( function ( errors ) {
		if ( errors?.length ) {
			// console.error( errors );
		}

		setIsSharing( false );
	} );

	return (
		<Button
			isSecondary
			onClick={ function () {
				setIsSharing( true );
				onPostShareHander();
			} }
			disabled={ isSharing || ! hasEnabledConnections }
			isBusy={ isSharing }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

export function SharePostRow( { isEnabled } ) {
	if ( ! isEnabled ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton />
		</PanelRow>
	);
}
