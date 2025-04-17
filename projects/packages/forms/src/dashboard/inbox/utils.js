// Function to get the URL of the page or post where the form was submitted.
export const getPath = item => {
	try {
		const url = new URL( item.entry_permalink );
		return url.pathname;
	} catch {
		return '';
	}
};
