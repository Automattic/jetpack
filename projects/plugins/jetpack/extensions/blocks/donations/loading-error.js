import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const LoadingError = ( { error } ) => {
	return (
		<Placeholder
			icon="lock"
			label={ __( 'Donations', 'jetpack' ) }
			instructions={ error }
		></Placeholder>
	);
};

export default LoadingError;
