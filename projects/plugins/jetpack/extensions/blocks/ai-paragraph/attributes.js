import { STATE } from './state';

export default {
	state: {
		enum: [ ...Object.values( STATE ) ],
		default: STATE.DEFAULT,
	},
};
