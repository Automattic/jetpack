/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UpgradePlanBanner from './upgrade-plan-banner';
import { isUpgradable } from '../plan-utils';

export default OriginalBlockEdit => props => {
	// Do not extend is block is not upgradable.
	if ( ! isUpgradable( props?.name ) ) {
		return <OriginalBlockEdit { ...props } />;
	}

	const { isTopLevelBlock, isBlockSelected } = useSelect( select => {
		const blockEditorSelector = select( 'core/block-editor' );
		const { clientId } = props;

		return {
			isTopLevelBlock: ! blockEditorSelector.getBlockRootClientId( clientId, 'core/block-preview' ),
			isBlockSelected: blockEditorSelector.isBlockSelected( clientId ),
		};
	} );

	// Do not extend if block is not top-level.
	if ( ! isTopLevelBlock ) {
		return <OriginalBlockEdit { ...props } />;
	}

	// Do not extend if block is not currently selected.
	if ( ! isBlockSelected ) {
		return <OriginalBlockEdit { ...props } />;
	}

	return (
		<Fragment>
			<InspectorControls>
				<UpgradePlanBanner description={ null } align={ props?.attributes?.align } />
			</InspectorControls>

			<UpgradePlanBanner title={ null } align={ props?.attributes?.align } />
			<OriginalBlockEdit { ...props } />
		</Fragment>
	);
};
