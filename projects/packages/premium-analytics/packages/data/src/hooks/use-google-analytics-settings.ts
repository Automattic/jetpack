import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback } from 'react';
import { enqueueSiteSettingsSave } from './site-settings-queue';

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

	const saveChange = useCallback(
		( values: Partial< GoogleAnalyticsSettings > ) => {
			const send = () =>
				saveEntityRecord( 'root', 'site', { google_analytics: values }, { throwOnError: true } );
			return enqueueSiteSettingsSave( send );
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
