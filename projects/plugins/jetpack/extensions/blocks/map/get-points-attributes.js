import { isEqual } from 'lodash';

/**
 * Save the viewport with marker edits and forget addresses for removed locations.
 *
 * @param {Array} points         - Updated map locations.
 * @param {Array} previousPoints - Locations before the edit.
 * @return {object} Block attributes to save.
 */
export default function getPointsAttributes( points, previousPoints ) {
	const attributes = { points };
	if ( ! points.length ) {
		attributes.address = '';
		return attributes;
	}

	const coordinates = points.map( point => point.coordinates );
	if (
		isEqual(
			coordinates,
			previousPoints.map( point => point.coordinates )
		)
	) {
		return attributes;
	}

	const latitudes = coordinates.map( coordinate => coordinate.latitude );
	const longitudes = coordinates.map( coordinate => coordinate.longitude );
	attributes.mapCenter = {
		lat: ( Math.min( ...latitudes ) + Math.max( ...latitudes ) ) / 2,
		lng: ( Math.min( ...longitudes ) + Math.max( ...longitudes ) ) / 2,
	};
	return attributes;
}
