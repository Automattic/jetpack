
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { isUpgradable } from "./utils";

export default ( onNotice ) => ( MediaReplaceFlow => props => {
	const { name } = useBlockEditContext();
	if ( ! isUpgradable( name ) ) {
		return <MediaReplaceFlow { ...props } />;
	}

	const { createNotice } = props;

	return <MediaReplaceFlow
		{ ...props }
		createNotice={ ( status, msg, options ) => {
			onNotice( status, msg, options );
			createNotice( status, msg, options );
		} }
	/>;
} );
