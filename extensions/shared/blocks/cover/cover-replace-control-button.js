
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isUpgradable } from "./utils";

export default ( onNudgeShow ) => createHigherOrderComponent( MediaReplaceFlow => props => {
	const { name } = useBlockEditContext();
	if ( ! isUpgradable( name ) ) {
		return <MediaReplaceFlow { ...props } />;
	}

	const { createNotice } = props;

	return <MediaReplaceFlow
		{ ...props }
		createNotice={ ( status, msg, options ) => {
			onNudgeShow( status, msg, options );
			createNotice( status, msg, options );
		} }
	/>;
}, 'withNudgeHandling' );

