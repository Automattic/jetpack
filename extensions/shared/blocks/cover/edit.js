
/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isUpgradable, isVideoFile } from "./utils";
import { CoverMediaProvider, JetpackCoverUpgradeNudge } from "./components";

export default createHigherOrderComponent(
	BlockEdit => props => {
		const { name } = useBlockEditContext();
		const [ showNudge, setShowNudge ] = useState( false );

		// Remove Nudge if the block changes its attributes.
		const { attributes } = props;
		const { align } = attributes;
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
					<JetpackCoverUpgradeNudge show={ showNudge } name={ name } align={ align } />
					<BlockEdit { ...props } />
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverBlockEdit'
);
