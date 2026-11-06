// Prototype landing: the host has no home screen yet, so send visitors to the first guest product.
export const route = {
	beforeLoad: () => {
		const url = new URL( window.location.href );
		url.searchParams.set( 'p', '/backup' );
		window.location.replace( url );
		return new Promise( () => {} );
	},
};
