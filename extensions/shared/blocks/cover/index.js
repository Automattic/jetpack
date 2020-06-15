/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment, createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import coverEditMediaPlaceholder, { JetpackCoverUpgradeNudge } from './cover-media-placeholder';
import isCurrentUserConnected from "../../is-current-user-connected";
import coverMediaReplaceFlow from './cover-replace-control-button';
import { isUpgradable, isVideoFile } from "./utils";
import './editor.scss';

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
 * @param {string}  props.onFilesUpload - Callback function before to upload files.
 * @param {boolean} props.children - Provider Children.
 * @returns {*} Provider component.
 */
const CoverMediaProvider = ( { onFilesUpload, children } ) => {
	return (
		<CoverMediaContext.Provider value={ {
			onFilesUpload,
		} }>
			{ children }
		</CoverMediaContext.Provider>
	);
};

const jetpackEditBlock = BlockEdit => props => {
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
};

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter( 'editor.MediaPlaceholder', 'jetpack/cover-edit-media-placeholder', coverEditMediaPlaceholder );

	// Take the control of the Replace block button control.
	addFilter( 'editor.MediaReplaceFlow', 'jetpack/cover-edit-media-placeholder', coverMediaReplaceFlow );

	// Extend CoverEdit.
	addFilter( 'editor.BlockEdit', 'jetpack/handle-upgrade-nudge', jetpackEditBlock );
}
