/**
 * External dependencies
 */
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	SVG,
	Path,
	VisuallyHidden,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { RATING_ICONS } from '../../../../../blocks/field-rating/rating-icons.js';

type FieldRatingProps = {
	value?: string | null;
};

const FieldRating = ( { value }: FieldRatingProps ) => {
	const stringValue = value != null ? String( value ) : '';
	if ( stringValue.trim() === '' ) {
		return <>-</>;
	}
	const [ rateValue, outOf ] = stringValue.split( '/' ) ?? [];
	if ( ! rateValue || rateValue.trim() === '' ) {
		return <>-</>;
	}
	if ( ! outOf || outOf.trim() === '' ) {
		return <>-</>;
	}

	const rateValueTrimmed = rateValue.trim();
	const outOfTrimmed = outOf.trim();

	// Require strictly numeric values to reject partial matches like "4abc"
	if ( ! /^[0-9]+$/.test( rateValueTrimmed ) || ! /^[0-9]+$/.test( outOfTrimmed ) ) {
		return <>-</>;
	}

	const parsedRating = Number.parseInt( rateValueTrimmed, 10 );
	const parsedMax = Number.parseInt( outOfTrimmed, 10 );
	if (
		! Number.isFinite( parsedRating ) ||
		parsedRating < 0 ||
		! Number.isFinite( parsedMax ) ||
		parsedMax < 0
	) {
		return <>-</>;
	}
	const displayRating = Math.min( Math.max( 0, parsedRating ), parsedMax );

	const filledIcon = (
		<SVG viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d={ RATING_ICONS.stars }
				fill="#F0B849"
				stroke="#F0B849"
				strokeWidth="1"
				strokeLinejoin="round"
			/>
		</SVG>
	);

	const emptyIcon = (
		<SVG viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d={ RATING_ICONS.stars }
				fill="none"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinejoin="round"
			/>
		</SVG>
	);

	const ratingLabel = sprintf(
		/* translators: 1: rating value, 2: maximum rating (e.g. "4" and "5" for "4 out of 5") */
		__( 'Rating %1$s out of %2$s', 'jetpack-forms' ),
		String( displayRating ),
		String( parsedMax )
	);

	return (
		<>
			<VisuallyHidden as="span">{ ratingLabel }</VisuallyHidden>
			<HStack spacing="1" alignment="topLeft">
				{ Array.from( { length: parsedMax }, ( _, index ) => (
					<span style={ { flex: '0 0 24px' } } key={ index }>
						{ index < displayRating ? filledIcon : emptyIcon }
					</span>
				) ) }
			</HStack>
		</>
	);
};

export default FieldRating;
