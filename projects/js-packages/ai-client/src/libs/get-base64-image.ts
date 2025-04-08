/**
 * Get the base64 representation of an image.
 *
 * @param {string} url - The URL of the image.
 * @return {Promise<string>} The base64 representation of the image.
 */
export const getBase64Image = async ( url: string ) => {
	try {
		const response = await fetch( url );
		const buffer = await response.arrayBuffer();
		const base64String = btoa(
			new Uint8Array( buffer ).reduce( ( data, byte ) => data + String.fromCharCode( byte ), '' )
		);

		return `data:image/png;base64,${ base64String }`;
	} catch {
		// If we can't fetch the image, return the original URL.
		return url;
	}
};
