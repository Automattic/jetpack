import apiFetch from '@wordpress/api-fetch';
import {
	SITE_BACKUP_SIZE_GET,
	SITE_BACKUP_SIZE_GET_FAILED,
	SITE_BACKUP_SIZE_GET_SUCCESS,
	SITE_BACKUP_POLICIES_GET,
	SITE_BACKUP_POLICIES_GET_FAILED,
	SITE_BACKUP_POLICIES_GET_SUCCESS,
} from './types';

const getSiteSize = () => ( { dispatch } ) => {
	dispatch( { type: SITE_BACKUP_SIZE_GET } );

	apiFetch( { path: '/jetpack/v4/site/backup/size' } ).then(
		res => {
			if ( ! res.ok ) {
				dispatch( { type: SITE_BACKUP_SIZE_GET_FAILED } );
				return;
			}

			const payload = {
				size: res.size,
			};

			dispatch( { type: SITE_BACKUP_SIZE_GET_SUCCESS, payload } );
		},
		() => {
			dispatch( { type: SITE_BACKUP_SIZE_GET_FAILED } );
		}
	);
};

const getSitePolicies = () => ( { dispatch } ) => {
	dispatch( { type: SITE_BACKUP_POLICIES_GET } );

	apiFetch( { path: '/jetpack/v4/site/backup/policies' } ).then(
		res => {
			const payload = {
				activityLogLimitDays: res.policies?.activity_log_limit_days ?? null,
				storageLimitBytes: res.policies?.storage_limit_bytes ?? null,
			};

			dispatch( { type: SITE_BACKUP_POLICIES_GET_SUCCESS, payload } );
		},
		() => {
			dispatch( { type: SITE_BACKUP_POLICIES_GET_FAILED } );
		}
	);
};

const actions = {
	getSiteSize,
	getSitePolicies,
};

export default actions;
