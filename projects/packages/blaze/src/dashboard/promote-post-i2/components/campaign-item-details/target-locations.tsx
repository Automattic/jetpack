import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { FC } from 'react';
import { AudienceList } from '../../../data/promote-post/types';

interface Props {
	audienceList?: AudienceList;
}

const TargetLocations: FC< Props > = ( { audienceList } ) => {
	const isUsingNewGeoLocationData = !! audienceList && 'cities' in audienceList; // We didn't sent this field in the previous model

	const { cities: citiesList, states: statesList, regions, countries } = audienceList || {};

	let regionsList = isUsingNewGeoLocationData ? regions : countries; // Old campaigns used Continents, instead of countries/regions. I will put those under regions now.
	const countriesList = isUsingNewGeoLocationData ? countries : '';

	if ( ! citiesList && ! statesList && ! regionsList && ! countriesList ) {
		regionsList = __( 'Everywhere', 'jetpack-blaze' );
	}

	return (
		<>
			{ citiesList && (
				<span>
					{ createInterpolateElement(
						sprintf(
							/* translators: %(citiesList)s is a list of cities. */ __(
								'<i>Cities:</i> %(citiesList)s',
								'jetpack-blaze'
							),
							{ citiesList }
						),
						{ i: <i /> }
					) }
				</span>
			) }
			{ statesList && (
				<span>
					{ createInterpolateElement(
						sprintf(
							/* translators: %(statesList)s is a list of states. */ __(
								'<i>States:</i> %(statesList)s',
								'jetpack-blaze'
							),
							{ statesList }
						),
						{ i: <i /> }
					) }
				</span>
			) }
			{ countriesList && (
				<span>
					{ createInterpolateElement(
						sprintf(
							/* translators: %(countriesList)s is a list of countries. */ __(
								'<i>Countries:</i> %(countriesList)s',
								'jetpack-blaze'
							),
							{
								countriesList,
							}
						),
						{ i: <i /> }
					) }
				</span>
			) }
			{ regionsList && (
				<span>
					{ createInterpolateElement(
						sprintf(
							/* translators: %(regionsList)s is a list of regions. */ __(
								'<i>Regions:</i> %(regionsList)s',
								'jetpack-blaze'
							),
							{ regionsList }
						),
						{ i: <i /> }
					) }
				</span>
			) }
		</>
	);
};

export default TargetLocations;
