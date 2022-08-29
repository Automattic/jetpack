import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function LoadingContainer() {
	return (
		<div className="wp-block-embed is-loading">
			<Spinner />
			<p>{ __( 'Embedding…', 'jetpack' ) }</p>
		</div>
	);
}
