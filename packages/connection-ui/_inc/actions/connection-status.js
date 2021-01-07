export const CONNECTION_STATUS_ACTIVE = 'CONNECTION_STATUS_ACTIVE';
export const CONNECTION_STATUS_INACTIVE = 'CONNECTION_STATUS_INACTIVE';
export const CONNECTION_STATUS_REFRESHING = 'CONNECTION_STATUS_REFRESHING';
export const CONNECTION_STATUS_REFRESHED = 'CONNECTION_STATUS_REFRESHED';

export const connectionStatusActions = {
	connectionStatusSetActive: () => {
		return { type: CONNECTION_STATUS_ACTIVE };
	},
	connectionStatusSetInactive: () => {
		return { type: CONNECTION_STATUS_INACTIVE };
	},
	connectionStatusRefreshing: () => {
		return { type: CONNECTION_STATUS_REFRESHING };
	},
	connectionStatusRefreshed: () => {
		return { type: CONNECTION_STATUS_REFRESHED };
	},
};
