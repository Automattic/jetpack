
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useBlockEditContext } from '@wordpress/block-editor';
import { isUpgradable } from "./utils";

export default createHigherOrderComponent(
	MediaReplaceFlow => props => {
		const { name } = useBlockEditContext();
		if ( ! isUpgradable( name ) ) {
			return <MediaReplaceFlow { ...props } />;
		}

		return <MediaReplaceFlow { ...props } />;
	},
	'coverMediaReplaceFlow'
);
