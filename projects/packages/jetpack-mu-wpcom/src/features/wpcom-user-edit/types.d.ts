declare global {
	interface Window {
		JETPACK_MU_WPCOM_USER_EDIT: {
			fields: {
				[ key: string ]: {
					selector: string;
					disabled: boolean;
				};
			};
		};
	}
}

export {};
