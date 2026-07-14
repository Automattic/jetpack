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
import type { FC, FocusEvent } from 'react';

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
const GEO_ERROR_ID = 'jetpack-seo-settings-geo-error';
const COUNTRY_CODE_ERROR = __( 'Enter a two-letter country code (for example US).', 'jetpack-seo' );
const PHONE_ERROR = __(
	'Enter a phone number with at least one digit, using only spaces, parentheses, hyphens, and an optional leading +.',
	'jetpack-seo'
);
const PRICE_RANGE_ERROR = __( 'Enter fewer than 100 characters.', 'jetpack-seo' );
const OPENING_HOURS_PAIR_ERROR = __(
	'Enter both opening and closing times, or leave both blank.',
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

const isCountryCode = ( value: string ) => {
	const trimmed = value.trim();
	return ! trimmed || /^[A-Za-z]{2}$/.test( trimmed );
};

const uppercaseAscii = ( value: string ) =>
	value.replace( /[a-z]/g, character => character.toUpperCase() );

const isPhoneNumber = ( value: string ) => {
	const trimmed = value.trim();
	return ! trimmed || ( /^\+?[0-9 ()-]*$/.test( trimmed ) && /[0-9]/.test( trimmed ) );
};

const isPriceRange = ( value: string ) => [ ...value.trim() ].length < 100;

const hasIncompleteOpeningHours = ( localBusiness: LocalBusinessSettings ) =>
	OPENING_DAYS.some( ( { code } ) => {
		const { opens, closes } = localBusiness.openingHours[ code ];
		return Boolean( opens.trim() ) !== Boolean( closes.trim() );
	} );

export const hasLocalBusinessErrors = ( form: SchemaSettingsForm ) => {
	const { localBusiness } = form;
	const { latitude, longitude } = form.localBusiness.geo;
	const hasPartialGeo = Boolean( latitude.trim() ) !== Boolean( longitude.trim() );
	return (
		hasPartialGeo ||
		! isCoordinate( latitude, 90 ) ||
		! isCoordinate( longitude, 180 ) ||
		! isCountryCode( localBusiness.address.addressCountry ) ||
		! isPhoneNumber( localBusiness.telephone ) ||
		! isPriceRange( localBusiness.priceRange ) ||
		hasIncompleteOpeningHours( localBusiness )
	);
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
	const hasPartialGeo = Boolean( geo.latitude.trim() ) !== Boolean( geo.longitude.trim() );
	const geoRangeErrors = GEO_FIELDS.filter(
		( { field, max } ) => Boolean( geo[ field ].trim() ) && ! isCoordinate( geo[ field ], max )
	).map( ( { error } ) => error );
	const geoError = hasPartialGeo ? GEO_PAIR_ERROR : geoRangeErrors.join( ' ' );

	const setAddress = ( field: keyof typeof address, value: string ) =>
		setLocalBusinessField( { address: { ...address, [ field ]: value } } );

	const setGeo = ( field: keyof typeof geo, value: string ) =>
		setLocalBusinessField( { geo: { ...geo, [ field ]: value } } );

	const setHours = ( day: OpeningHoursDay, field: 'opens' | 'closes', value: string ) =>
		setLocalBusinessField( {
			openingHours: {
				...openingHours,
				[ day ]: { ...openingHours[ day ], [ field ]: value },
			},
		} );

	const clearInvalidTime = (
		day: OpeningHoursDay,
		field: 'opens' | 'closes',
		event: FocusEvent< HTMLInputElement >
	) => {
		if ( ! event.currentTarget.validity.badInput ) {
			return;
		}

		// Browsers can retain an incomplete segmented time (for example `10:--`)
		// without emitting an onChange value. Clear that native editing state and
		// re-sync the controlled field when focus leaves the input.
		event.currentTarget.value = '';
		setHours( day, field, '' );
	};

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

			{ ADDRESS_FIELDS.map( ( { field, label, help } ) => {
				const fieldError = field === 'addressCountry' && ! isCountryCode( address[ field ] );
				return (
					<div
						key={ field }
						className={ fieldError ? 'jetpack-seo-settings__schema-field--error' : undefined }
					>
						<TextControl
							label={ label }
							help={ fieldError ? COUNTRY_CODE_ERROR : help }
							placeholder={ localBusinessDefaults.address[ field ] }
							value={ address[ field ] }
							onChange={ next =>
								setAddress( field, field === 'addressCountry' ? uppercaseAscii( next ) : next )
							}
							disabled={ isSaving }
							aria-invalid={ Boolean( fieldError ) }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
					</div>
				);
			} ) }

			<div
				className={
					! isPhoneNumber( localBusiness.telephone )
						? 'jetpack-seo-settings__schema-field--error'
						: undefined
				}
			>
				<TextControl
					label={ __( 'Phone', 'jetpack-seo' ) }
					type="tel"
					help={
						! isPhoneNumber( localBusiness.telephone )
							? PHONE_ERROR
							: __( 'Include the country and area codes when possible.', 'jetpack-seo' )
					}
					value={ localBusiness.telephone }
					onChange={ next => setLocalBusinessField( { telephone: next } ) }
					disabled={ isSaving }
					aria-invalid={ ! isPhoneNumber( localBusiness.telephone ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</div>

			<div
				className={
					! isPriceRange( localBusiness.priceRange )
						? 'jetpack-seo-settings__schema-field--error'
						: undefined
				}
			>
				<TextControl
					label={ __( 'Price range', 'jetpack-seo' ) }
					placeholder="$$"
					help={
						! isPriceRange( localBusiness.priceRange )
							? PRICE_RANGE_ERROR
							: __(
									'Use a numerical range (for example $10–$20) or a relative price level (for example $$).',
									'jetpack-seo'
							  )
					}
					value={ localBusiness.priceRange }
					onChange={ next => setLocalBusinessField( { priceRange: next } ) }
					disabled={ isSaving }
					aria-invalid={ ! isPriceRange( localBusiness.priceRange ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</div>

			<div className="jetpack-seo-settings__schema-paired-fields">
				{ GEO_FIELDS.map( ( { field, label, max } ) => {
					const fieldError = hasPartialGeo || ! isCoordinate( geo[ field ], max );
					return (
						<div key={ field } className="jetpack-seo-settings__schema-paired-field">
							<TextControl
								label={ label }
								inputMode="decimal"
								value={ geo[ field ] }
								onChange={ next => setGeo( field, next ) }
								disabled={ isSaving }
								aria-invalid={ Boolean( fieldError ) }
								aria-describedby={ geoError ? GEO_ERROR_ID : undefined }
								__next40pxDefaultSize
								__nextHasNoMarginBottom
							/>
						</div>
					);
				} ) }
				{ geoError && (
					<span id={ GEO_ERROR_ID } className="jetpack-seo-settings__schema-pair-error">
						{ geoError }
					</span>
				) }
			</div>

			<Stack direction="column" gap="sm">
				<span className="jetpack-seo-settings__schema-field-label">
					{ __( 'Opening hours', 'jetpack-seo' ) }
				</span>
				<span className="jetpack-seo-settings__title-tokens-label">
					{ __(
						"Leave a day blank if it's closed. A closing time earlier than opening means the business closes the following day.",
						'jetpack-seo'
					) }
				</span>
				{ OPENING_DAYS.map( ( { code, label } ) => {
					const hasOpens = Boolean( openingHours[ code ].opens.trim() );
					const hasCloses = Boolean( openingHours[ code ].closes.trim() );
					const opensError = ! hasOpens && hasCloses;
					const closesError = hasOpens && ! hasCloses;
					const hasPairError = opensError || closesError;
					const errorId = `jetpack-seo-settings-opening-hours-${ code }-error`;
					return (
						<div key={ code } className="jetpack-seo-settings__schema-opening-hours-row">
							<span className="jetpack-seo-settings__schema-day-label">{ label }</span>
							<div className="jetpack-seo-settings__schema-paired-fields">
								<div className="jetpack-seo-settings__schema-paired-field">
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
										onBlur={ event => clearInvalidTime( code, 'opens', event ) }
										disabled={ isSaving }
										aria-invalid={ opensError }
										aria-describedby={ hasPairError ? errorId : undefined }
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
								</div>
								<div className="jetpack-seo-settings__schema-paired-field">
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
										onBlur={ event => clearInvalidTime( code, 'closes', event ) }
										disabled={ isSaving }
										aria-invalid={ closesError }
										aria-describedby={ hasPairError ? errorId : undefined }
										__next40pxDefaultSize
										__nextHasNoMarginBottom
									/>
								</div>
								{ hasPairError && (
									<span id={ errorId } className="jetpack-seo-settings__schema-pair-error">
										{ OPENING_HOURS_PAIR_ERROR }
									</span>
								) }
							</div>
						</div>
					);
				} ) }
			</Stack>
		</Stack>
	);
};

export default LocalBusinessFields;
