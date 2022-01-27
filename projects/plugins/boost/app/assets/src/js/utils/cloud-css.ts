import api from "../api/api";

export function requestCloudCss() {
	api.post( '/cloud-css/request-generate' )
		.then(response => {
			console.log(response);
		});
}
