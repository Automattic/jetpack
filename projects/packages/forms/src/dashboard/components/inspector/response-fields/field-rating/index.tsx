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
	const iconSvg = (
		<SVG viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d={ RATING_ICONS.stars }
				fill="#F0B849"
				stroke="#F0B849"
				strokeWidth="0"
				strokeLinejoin="round"
			/>
		</SVG>
	);
	const ratingLabel = sprintf(
		/* translators: 1: rating value, 2: maximum rating (e.g. "4" and "5" for "4 out of 5") */
		__( 'Rating %1$s out of %2$s', 'jetpack-forms' ),
		rateValue.trim(),
		outOf.trim()
	);

	return (
		<>
			<VisuallyHidden as="span">{ ratingLabel }</VisuallyHidden>
			<HStack spacing="1" alignment="topLeft">
				{ Array.from( { length: parseInt( rateValue ) }, ( _, index ) => (
					<span style={ { flex: '0 0 24px' } } key={ index }>
						{ iconSvg }
					</span>
				) ) }
			</HStack>
		</>
	);
};

export default FieldRating;
