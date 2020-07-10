/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isUpgradable, isVideoFile } from './utils';
import { CoverMediaProvider, JetpackCoverUpgradeNudge } from './components';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const [ showNudge, setShowNudge ] = useState( false );

		const { attributes } = props;

		// Remove Nudge if the block changes its attributes.
		useEffect( () => setShowNudge( false ), [ attributes ] );

		const handleFilesPreUpload = useCallback( ( files ) => {
			if ( ! files?.length || ! isVideoFile( files[ 0 ] ) ) {
				return;
			}
			setShowNudge( true );
		} );

		const { name } = useBlockEditContext();
		if ( ! isUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<CoverMediaProvider onFilesUpload={ handleFilesPreUpload }>
					<JetpackCoverUpgradeNudge show={ showNudge } name={ name } align={ attributes.align } />
					<BlockEdit { ...props } />
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverBlockEdit'
);
