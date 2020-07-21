/**
 * WordPress dependencies
 */
import { useBlockEditContext } from '@wordpress/block-editor';
import { useEffect, useState, Fragment, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isCoverUpgradable, isVideoFile } from './utils';
import { CoverMediaProvider } from './components';
import UpgradePlanBanner from '../../paid-blocks/upgrade-plan-banner';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const [ showBanner, setShowBanner ] = useState( false );

		const { attributes } = props;

		// Remove Nudge if the block changes its attributes.
		useEffect( () => setShowBanner( false ), [ attributes ] );

		const handleFilesPreUpload = useCallback( ( files ) => {
			if ( ! files?.length || ! isVideoFile( files[ 0 ] ) ) {
				return;
			}
			setShowBanner( true );
		} );

		const { name } = useBlockEditContext();
		if ( ! isCoverUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<CoverMediaProvider onFilesUpload={ handleFilesPreUpload }>
					{ showBanner && ( <UpgradePlanBanner description={ null } blockName={ props.name } /> ) }
					<BlockEdit { ...props } />
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverBlockEdit'
);
