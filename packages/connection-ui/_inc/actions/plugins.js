export const PLUGIN_CONNECTED = 'PLUGIN_CONNECTED';
export const PLUGIN_DISCONNECTED = 'PLUGIN_DISCONNECTED';

export const PLUGIN_REQUEST_IN_PROGRESS = 'PLUGIN_REQUEST_IN_PROGRESS';
export const PLUGIN_REQUEST_DONE = 'PLUGIN_REQUEST_DONE';

export const pluginActions = {
	pluginConnected: slug => {
		return { type: PLUGIN_CONNECTED, data: { slug } };
	},
	pluginDisconnected: slug => {
		return { type: PLUGIN_DISCONNECTED, data: { slug } };
	},
	pluginRequestInProgress: () => {
		return { type: PLUGIN_REQUEST_IN_PROGRESS };
	},
	pluginRequestDone: () => {
		return { type: PLUGIN_REQUEST_DONE };
	},
};
