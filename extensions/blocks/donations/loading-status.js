/**
 * WordPress dependencies
 */
// eslint-disable-next-line wpcalypso/import-docblock
import { __ } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';

const LoadingStatus = ( { className } ) => {
	return (
		<Placeholder
			icon="lock"
			label={ __( 'Donations', 'jetpack' ) }
			instructions={ __( 'Loading data…', 'jetpack' ) }
			className={ className }
		>
			<Spinner />
		</Placeholder>
	);
};

export default LoadingStatus;
