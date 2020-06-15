
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
import { CoverMediaContext } from './components';
import { isUpgradable } from "./utils";

export default createHigherOrderComponent( MediaReplaceFlow => props => {
	const { name } = useBlockEditContext();
	if ( ! isUpgradable( name ) ) {
		return <MediaReplaceFlow { ...props } />;
	}

	const { createNotice } = props;
	return (
		<CoverMediaContext.Consumer>
			{ ( { onFilesUpload } ) => (
				<MediaReplaceFlow
					{ ...props }
					onFilesUpload={ onFilesUpload }
					createNotice={ ( status, msg, options ) => {
						createNotice( status, msg, options );
					} }
				/>
			) }
		</CoverMediaContext.Consumer>
	);
}, 'withNudgeHandling' );

