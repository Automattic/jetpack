/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState, Fragment, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { isCoverUpgradable, isVideoFile } from './utils';
import { CoverMediaProvider } from './components';
import UpgradePlanBanner from "../../paid-blocks/upgrade-plan-banner";

export default createHigherOrderComponent(
	CoverBlockList => props => {
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

		const isVisible =
			useSelect( select => select( 'core/block-editor' ).isBlockSelected( clientId ) ) &&
			showBanner;

		if ( ! isCoverUpgradable( name ) ) {
			return <CoverBlockList { ...props } />;
		}

		return (
			<Fragment>
				<CoverMediaProvider onFilesUpload={ handleFilesPreUpload }>
					<UpgradePlanBanner blockName={ props.name } visible={ isVisible } />
					<CoverBlockList
						{ ...props }
						className={ isVisible ? 'has-warning is-upgradable' : null }
					/>
				</CoverMediaProvider>
			</Fragment>
		);
	},
	'JetpackCoverListBlock'
);
