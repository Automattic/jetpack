/**
 * Retrieves the unique topics from an array of photos
 * and returns them in the format expected
 * by the "elements" property ("field" prop) of the Dataviews component.
 *
 * @param {Array} photos - The array of photos.
 * @return {Array} - An array of objects containing the label and value of each topic.
 * @example
 *  Call - getTopics([{ topics: ["nature", "water"] }, { topics: ["nature", "mountain"] }]);
 *  Returns - [{ label: "Nature", value: "nature" }, { label: "Water", value: "water" }, { label: "Mountain", value: "mountain" }]
 */
export const getTopicsElementsFormat = photos => {
	const topics = photos.reduce( ( acc, photo ) => {
		return acc.concat( photo.topics );
	}, [] );
	return [ ...new Set( topics ) ].map( topic => {
		return {
			label: topic.replace( /_/g, ' ' ).replace( /\b\w/g, l => l.toUpperCase() ),
			value: topic,
		};
	} );
};
