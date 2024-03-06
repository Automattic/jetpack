import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { REST_API_SITE_DISMISS_BANNER } from '../../data/constants';
import useSimpleMutation from '../use-simple-mutation';

const useWelcomeBanner = () => {
	const hasBeenDismissed = window?.myJetpackInitialState?.welcomeBanner?.hasBeenDismissed;
	const [ isDismissed, setIsDismissed ] = useState( hasBeenDismissed );

	const { mutate: dismissWelcomeBanner } = useSimpleMutation(
		'dismissWelcomeBanner',
		{
			path: REST_API_SITE_DISMISS_BANNER,
			method: 'POST',
		},
		{
			onSuccess: () => setIsDismissed( true ),
		},
		null,
		__( 'Failed to dismiss the welcome banner. Please try again', 'jetpack-my-jetpack' )
	);

	return {
		dismissWelcomeBanner,
		isDismissed,
	};
};

export default useWelcomeBanner;
