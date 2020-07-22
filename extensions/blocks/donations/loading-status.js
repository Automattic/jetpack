/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';

const LoadingStatus = ( { className = '' } ) => {
	return (
		<div className={ `${ className } donations__loading-status` }>
			<Placeholder
				icon="lock"
				label={ __( 'Donations', 'jetpack' ) }
				instructions={ __( 'Loading data…', 'jetpack' ) }
			>
				<Spinner />
			</Placeholder>
		</div>
	);
};

export default LoadingStatus;
