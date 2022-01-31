/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder } from '@wordpress/components';

const LoadingError = ( { className, error } ) => {
	return (
		<Placeholder
			icon="lock"
			label={ __( 'Donations', 'jetpack' ) }
			instructions={ error }
			className={ className }
		></Placeholder>
	);
};

export default LoadingError;
