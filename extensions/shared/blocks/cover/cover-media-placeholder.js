
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { useBlockEditContext } from '@wordpress/block-editor';

export default createHigherOrderComponent(
	CoreMediaPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( name !== 'core/cover' ) {
			return <CoreMediaPlaceholder { ...props } />;
		}

		return (
			<Fragment>
				<CoreMediaPlaceholder { ...props } />
			</Fragment>
		);
	},
	'JetpackCoverMediaPlaceholder'
);
