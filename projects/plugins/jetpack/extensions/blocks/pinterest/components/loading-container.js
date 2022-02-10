/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

export default function LoadingContainer() {
	return (
		<div className="wp-block-embed is-loading">
			<Spinner />
			<p>{ __( 'Embedding…', 'jetpack' ) }</p>
		</div>
	);
}
