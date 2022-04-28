/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const Loading = () => {
	return (
		<div className="wp-block-embed is-loading">
			<Spinner />
			{ __( 'Loading…', 'wooads' ) }
		</div>
	);
};
