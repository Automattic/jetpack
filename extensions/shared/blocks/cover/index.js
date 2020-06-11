/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import coverEditMediaPlaceholder, { JetpackCoverUpgradeNudge } from './cover-media-placeholder';
import isCurrentUserConnected from "../../is-current-user-connected";
import coverMediaReplaceFlow from './cover-replace-control-button';
import { isUpgradable } from "./utils";
import './editor.scss';

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter(
		'editor.MediaPlaceholder',
		'jetpack/cover-edit-media-placeholder',
		coverEditMediaPlaceholder
	);

	const jetpackEditBlock = BlockEdit => props => {
		const { name } = useBlockEditContext();
		const [ showNudge, setShowNudge ] = useState( false );

		useEffect( () => {
			// Take the control of the Replace block button control.
			addFilter(
				'editor.MediaReplaceFlow',
				'jetpack/cover-edit-media-placeholder',
				coverMediaReplaceFlow( ( data ) => setShowNudge( !! data ) )
			);
		}, [ name ] );

		if ( ! isUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<JetpackCoverUpgradeNudge show={ showNudge } name={ name } />
				<BlockEdit { ...props } />
			</Fragment>
		);
	};

	addFilter( 'editor.BlockEdit', 'jetpack/handle-upgrade-nudge', jetpackEditBlock );
}
