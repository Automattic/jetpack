import { Spinner } from '@wordpress/components';
import clsx from 'clsx';

const GooglePhotosLoading = ( { className } ) => {
	return (
		<div className={ clsx( className, 'jetpack-external-media__google-photos-loading' ) }>
			<Spinner />
		</div>
	);
};

export default GooglePhotosLoading;
