import { Button, Notice } from '@automattic/jetpack-components';
import getErrorData from './lib/get-error-data';
import { __ } from '@wordpress/i18n';
import { type PageCacheError } from '$lib/stores/page-cache';

type HealthProps = {
	error: PageCacheError;
	setupCache: () => void;
};

const Health = ( { error, setupCache }: HealthProps ) => {
	// Was there a problem trying to setup cache?
	const errorData = getErrorData( error );
	if ( errorData ) {
		return (
			<Notice
				level="warning"
				hideCloseButton={ true }
				title={ errorData.title }
				actions={ [
					<Button size="small" weight="regular" onClick={ setupCache } key="try-again">
						{ __( 'Try again', 'jetpack-boost' ) }
					</Button>,
				] }
			>
				<p>{ errorData.message }</p>
			</Notice>
		);
	}

	return null;
};

export default Health;
