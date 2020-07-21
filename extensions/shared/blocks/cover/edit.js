/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/editor';
import { useEffect, useState, Fragment, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isCoverUpgradable, isVideoFile } from './utils';
import { CoverMediaProvider } from './components';
import UpgradePlanBanner from '../../paid-blocks/upgrade-plan-banner';

export default createHigherOrderComponent(
	BlockEdit => props => {
		const [ showBanner, setShowBanner ] = useState( false );
		const { attributes, clientId, name } = props;

		// Remove Banner when the block changes its attributes.
		useEffect( () => setShowBanner( false ), [ attributes ] );

		const handleFilesPreUpload = useCallback( files => {
			if ( ! files?.length || ! isVideoFile( files[ 0 ] ) ) {
				return;
			}
			setShowBanner( true );
		} );

		const isVisible = useSelect( select => (
			select( 'core/block-editor' ).isBlockSelected( clientId )
		) ) && showBanner;

		if ( ! isCoverUpgradable( name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<InspectorControls>
					<UpgradePlanBanner description={ null } blockName={ name } />
				</InspectorControls>

				<CoverMediaProvider onFilesUpload={ handleFilesPreUpload }>
					<UpgradePlanBanner blockName={ props.name } visible={ isVisible } />
					<BlockEdit { ...props } />
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverBlockEdit'
);
