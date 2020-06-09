/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import coverEditMediaPlaceholder from './cover-media-placeholder';
import { isSimpleSite } from '../../site-type-utils';
import getJetpackExtensionAvailability from '../../get-jetpack-extension-availability';

const extendCoreCoverBlock = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name } = props;
		const { unavailableReason } = getJetpackExtensionAvailability( 'videopress' );
		if (
			( ! name || name !== 'core/cover' ) || // extend only for cover block
			! isSimpleSite() || // only for Simple sites
			! [ 'missing_plan', 'unknown' ].includes( unavailableReason )
		) {
			return <BlockEdit { ...props } />;
		}

		// Take the control of MediaPlaceholder.
		addFilter(
			'editor.MediaPlaceholder',
			'jetpack/cover-edit-media-placeholder',
			coverEditMediaPlaceholder( name )
		);

		return <BlockEdit { ...props } />;
	},
	'JetpackCoverEdit'
);

addFilter( 'editor.BlockEdit', 'jetpack/cover', extendCoreCoverBlock );
