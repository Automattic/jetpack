import { Spinner, Stack } from '@wordpress/ui';
import clsx from 'clsx';

const GooglePhotosLoading = ( { className } ) => {
	return (
		<Stack
			align="center"
			justify="center"
			className={ clsx( className, 'jetpack-external-media__google-photos-loading' ) }
		>
			<Spinner />
		</Stack>
	);
};

export default GooglePhotosLoading;
