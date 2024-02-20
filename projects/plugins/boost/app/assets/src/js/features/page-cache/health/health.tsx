import { Button, Notice } from '@automattic/jetpack-components';
import { useRunPageCacheSetupAction } from '$lib/stores/page-cache';
import getErrorData from './lib/get-error-data';
import { __ } from '@wordpress/i18n';

type HealthProps = {
	error: string;
};

const Health = ( { error }: HealthProps ) => {
	const runPageCacheSetupAction = useRunPageCacheSetupAction();

	const requestRunSetup = () => {
		runPageCacheSetupAction.mutate();
	};

	// Was there a problem trying to setup cache?
	const errorData = getErrorData( error );
	if ( errorData ) {
		return (
			<Notice
				level="warning"
				hideCloseButton={ true }
				title={ errorData.title }
				actions={ [
					<Button size="small" weight="regular" onClick={ requestRunSetup } key="try-again">
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
