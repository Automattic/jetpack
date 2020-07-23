/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { isCoverUpgradable } from './utils';
import UpgradePlanBanner from '../../paid-blocks/upgrade-plan-banner';

export default createHigherOrderComponent(
	BlockEdit => props => {
		if ( ! isCoverUpgradable( props?.name ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<Fragment>
				<InspectorControls>
					<UpgradePlanBanner description={ null } blockName={ props?.name } />
				</InspectorControls>

				<BlockEdit { ...props } />
			</Fragment>
		);
	},
	'JetpackCoverBlockEdit'
);
