import { __, sprintf } from '@wordpress/i18n';
import useNotice from './use-notice';

export const useFetchingErrorNotice = (
	infoName: string,
	isError: boolean,
	overrideMessage?: string
) => {
	useNotice( {
		message:
			overrideMessage ??
			sprintf(
				// translators: %s is the name of the information being fetched, e.g. "site purchases".
				__(
					'There was an error fetching your %s information. Check your site connectivity and try again.',
					'jetpack-my-jetpack'
				),
				infoName
			),
		options: { status: 'error' },
		isError,
	} );
};
