import { registerStore } from '@wordpress/data';

const DEFAULT_STATE = {
	isModalVisible: true,
};

registerStore( 'automattic/wpcom-block-theme-previews', {
	reducer: ( state = DEFAULT_STATE, action ) => {
		switch ( action.type ) {
			case 'DISMISS_MODAL':
				return {
					...state,
					isModalVisible: false,
				};
		}
		return state;
	},
	actions: {
		dismissModal: () => ( {
			type: 'DISMISS_MODAL',
		} ),
	},
	selectors: {
		isModalVisible: state => state.isModalVisible,
	},
	persist: true,
} );
