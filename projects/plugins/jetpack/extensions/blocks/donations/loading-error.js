import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
