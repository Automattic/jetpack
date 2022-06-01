/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

const Loading = () => (
	<div className="wp-block-embed is-loading">
		<Spinner />
		<p>{ __( 'Embedding…', 'jetpack' ) }</p>
	</div>
);

export default Loading;
