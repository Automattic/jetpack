import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef } from 'react';

export type GoogleAnalyticsSettings = {
	is_active: boolean;
	code: string;
	anonymize_ip: boolean;
};

type SiteSettings = { google_analytics?: GoogleAnalyticsSettings };

/**
 * The Google Analytics setting, read from core's site settings entity and saved one change at a time.
 *
 * @return The stored settings, and the action that saves a change.
 */
export function useGoogleAnalyticsSettings() {
	// The site settings entity has no ID.
	const site = useEntityRecord< SiteSettings >( 'root', 'site', undefined as unknown as string );
	const { saveEntityRecord } = useDispatch( coreStore );
	// The site does not apply overlapping requests in order.
	const queue = useRef< Promise< unknown > >( Promise.resolve() );

	const saveChange = useCallback(
		( values: Partial< GoogleAnalyticsSettings > ) => {
			const send = () =>
				saveEntityRecord( 'root', 'site', { google_analytics: values }, { throwOnError: true } );
			const save = queue.current.then( send, send );
			queue.current = save;
			return save;
		},
		[ saveEntityRecord ]
	);

	const settings = site.record?.google_analytics ?? undefined;

	return {
		settings,
		isError: site.status === 'ERROR' || ( site.hasResolved && ! settings ),
		saveChange,
	};
}
