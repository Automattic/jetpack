/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';


/**
 * Internal dependencies
 */
import coverEditMediaPlaceholder from './cover-media-placeholder';
import isCurrentUserConnected from "../../is-current-user-connected";
import coverMediaReplaceFlow from './cover-replace-control-button';
import { JetpackCoverUpgradeNudge, CoverMediaProvider } from './components';
import { isUpgradable, isVideoFile } from "./utils";

import './editor.scss';

const jetpackEditBlock = createHigherOrderComponent(
	BlockEdit => props => {
		const { name } = useBlockEditContext();
		const [ showNudge, setShowNudge ] = useState( false );

		// Remove Nudge if the block changes its attributes.
		const { attributes } = props;
		useEffect( () => setShowNudge( false ), [ attributes ] );

		if ( ! isUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		const handleFilesPreUpload = ( files ) => {
			if ( ! files?.length ) {
				return;
			}

			if ( ! isVideoFile( files[ 0 ] ) ) {
				return;
			}

			setShowNudge( true );
		};

		return (
			<Fragment>
				<CoverMediaProvider onFilesUpload={ handleFilesPreUpload }>
					<JetpackCoverUpgradeNudge show={ showNudge } name={ name } />
					<BlockEdit { ...props } />
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverEdit'
);

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter( 'editor.MediaPlaceholder', 'jetpack/cover-edit-media-placeholder', coverEditMediaPlaceholder );

	// Take the control of the Replace block button control.
	addFilter( 'editor.MediaReplaceFlow', 'jetpack/cover-edit-media-placeholder', coverMediaReplaceFlow );

	// Extend CoverEdit.
	addFilter( 'editor.BlockEdit', 'jetpack/handle-upgrade-nudge', jetpackEditBlock );
}
