/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type {
	LocalBusinessAddress,
	LocalBusinessSettings,
	OpeningHoursDay,
} from '../../../data/schema-settings-types';
import type { SchemaSettingsForm } from '../../../data/use-schema-settings';
import type { FC } from 'react';

const OPENING_DAYS: Array< { code: OpeningHoursDay; label: string } > = [
	{ code: 'Mo', label: __( 'Monday', 'jetpack-seo' ) },
	{ code: 'Tu', label: __( 'Tuesday', 'jetpack-seo' ) },
	{ code: 'We', label: __( 'Wednesday', 'jetpack-seo' ) },
	{ code: 'Th', label: __( 'Thursday', 'jetpack-seo' ) },
	{ code: 'Fr', label: __( 'Friday', 'jetpack-seo' ) },
	{ code: 'Sa', label: __( 'Saturday', 'jetpack-seo' ) },
	{ code: 'Su', label: __( 'Sunday', 'jetpack-seo' ) },
];

const ADDRESS_FIELDS: Array< { field: keyof LocalBusinessAddress; label: string; help?: string } > =
	[
		{ field: 'streetAddress', label: __( 'Street address', 'jetpack-seo' ) },
		{ field: 'addressLocality', label: __( 'City', 'jetpack-seo' ) },
		{ field: 'addressRegion', label: __( 'State/Region', 'jetpack-seo' ) },
		{ field: 'postalCode', label: __( 'Postal code', 'jetpack-seo' ) },
		{
			field: 'addressCountry',
			label: __( 'Country', 'jetpack-seo' ),
			help: __( 'Two-letter country code (for example US).', 'jetpack-seo' ),
		},
	];

const GEO_FIELDS: Array< {
	field: keyof LocalBusinessSettings[ 'geo' ];
	label: string;
	max: number;
	error: string;
} > = [
	{
		field: 'latitude',
		label: __( 'Latitude', 'jetpack-seo' ),
		max: 90,
		error: __( 'Enter a latitude between -90 and 90.', 'jetpack-seo' ),
	},
	{
		field: 'longitude',
		label: __( 'Longitude', 'jetpack-seo' ),
		max: 180,
		error: __( 'Enter a longitude between -180 and 180.', 'jetpack-seo' ),
	},
];
const GEO_PAIR_ERROR = __(
	'Enter both latitude and longitude, or leave both blank.',
	'jetpack-seo'
);

interface Props {
	/** The schema-settings form controller, owned by the Schema card. */
	form: SchemaSettingsForm;
}

const isCoordinate = ( value: string, max: number ) => {
	if ( ! value.trim() ) {
		return true;
	}
	const number = Number( value );
	return Number.isFinite( number ) && Math.abs( number ) <= max;
};

export const hasLocalBusinessErrors = ( form: SchemaSettingsForm ) => {
	const { latitude, longitude } = form.localBusiness.geo;
	const hasPartialGeo = Boolean( latitude.trim() ) !== Boolean( longitude.trim() );
	return hasPartialGeo || ! isCoordinate( latitude, 90 ) || ! isCoordinate( longitude, 180 );
};

/**
 * LocalBusiness settings fields shown when the LocalBusiness toggle is enabled.
 *
 * @param props      - Component props.
 * @param props.form - The schema-settings form controller from the card.
 * @return LocalBusiness settings fields.
 */
const LocalBusinessFields: FC< Props > = ( { form } ) => {
	const { localBusiness, localBusinessDefaults, isSaving, setLocalBusinessField } = form;
	const { address, geo, openingHours } = localBusiness;
	const storedAddressEmpty = Object.values( address ).every( value => ! value );
	const defaultAddressEmpty = Object.values( localBusinessDefaults.address ).every(
		value => ! value
	);

	const setAddress = ( field: keyof typeof address, value: string ) =>
		setLocalBusinessField( { address: { ...address, [ field ]: value } } );

	const setGeo = ( field: keyof typeof geo, value: string ) =>
		setLocalBusinessField( { geo: { ...geo, [ field ]: value } } );

	// ponytail: single interval per day; split shifts when someone asks.
	const setHours = ( day: OpeningHoursDay, field: 'opens' | 'closes', value: string ) =>
		setLocalBusinessField( {
			openingHours: {
				...openingHours,
				[ day ]: { ...openingHours[ day ], [ field ]: value },
			},
		} );

	return (
		<Stack direction="column" gap="lg">
			{ storedAddressEmpty && defaultAddressEmpty && (
				<span className="jetpack-seo-settings__title-tokens-label">
					{ __(
						'Add your business address — Google requires it before LocalBusiness info is shown.',
						'jetpack-seo'
					) }
				</span>
			) }

			{ ADDRESS_FIELDS.map( ( { field, label, help } ) => (
				<TextControl
					key={ field }
					label={ label }
					help={ help }
					placeholder={ localBusinessDefaults.address[ field ] }
					value={ address[ field ] }
					onChange={ next => setAddress( field, next ) }
					disabled={ isSaving }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			) ) }

			<TextControl
				label={ __( 'Phone', 'jetpack-seo' ) }
				type="tel"
				value={ localBusiness.telephone }
				onChange={ next => setLocalBusinessField( { telephone: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<TextControl
				label={ __( 'Price range', 'jetpack-seo' ) }
				placeholder="$$"
				help={ __( 'How expensive the business is, from $ to $$$$.', 'jetpack-seo' ) }
				value={ localBusiness.priceRange }
				onChange={ next => setLocalBusinessField( { priceRange: next } ) }
				disabled={ isSaving }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>

			<Stack direction="row" gap="sm" align="flex-start" wrap="wrap">
				{ GEO_FIELDS.map( ( { field, label, max, error } ) => {
					const hasPartialGeo = Boolean( geo.latitude.trim() ) !== Boolean( geo.longitude.trim() );
					const fieldError =
						hasPartialGeo ||
						( Boolean( geo[ field ].trim() ) && ! isCoordinate( geo[ field ], max ) );
					const helpText = hasPartialGeo ? GEO_PAIR_ERROR : error;
					return (
						<div
							key={ field }
							className={
								'jetpack-seo-settings__schema-profile-input' +
								( fieldError ? ' jetpack-seo-settings__schema-profile-input--error' : '' )
							}
						>
							<TextControl
								label={ label }
								inputMode="decimal"
								value={ geo[ field ] }
								onChange={ next => setGeo( field, next ) }
								disabled={ isSaving }
								help={ fieldError ? helpText : undefined }
								aria-invalid={ Boolean( fieldError ) }
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
						</div>
					);
				} ) }
			</Stack>

			<Stack direction="column" gap="sm">
				<span className="jetpack-seo-settings__schema-field-label">
					{ __( 'Opening hours', 'jetpack-seo' ) }
				</span>
				<span className="jetpack-seo-settings__title-tokens-label">
					{ __( "Leave a day blank if it's closed.", 'jetpack-seo' ) }
				</span>
				{ OPENING_DAYS.map( ( { code, label } ) => (
					<Stack key={ code } direction="row" gap="sm" align="center" wrap="wrap">
						<span className="jetpack-seo-settings__schema-day-label">{ label }</span>
						<TextControl
							label={ sprintf(
								/* translators: %s: day of week. */
								__( '%s opens', 'jetpack-seo' ),
								label
							) }
							hideLabelFromVision
							type="time"
							value={ openingHours[ code ].opens }
							onChange={ next => setHours( code, 'opens', next ) }
							disabled={ isSaving }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
						<TextControl
							label={ sprintf(
								/* translators: %s: day of week. */
								__( '%s closes', 'jetpack-seo' ),
								label
							) }
							hideLabelFromVision
							type="time"
							value={ openingHours[ code ].closes }
							onChange={ next => setHours( code, 'closes', next ) }
							disabled={ isSaving }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					</Stack>
				) ) }
			</Stack>
		</Stack>
	);
};

export default LocalBusinessFields;
