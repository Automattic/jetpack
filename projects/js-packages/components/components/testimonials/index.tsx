import { useState, useCallback } from '@wordpress/element';
import Gridicon from '../gridicon';
import { Testimonial } from './testimonial';
import { TestimonialsType } from './types';

const Testimonials: TestimonialsType = ( { testimonials } ) => {
	const [ currentTestimonialIndex, setcurrentTestimonialIndex ] = useState( 0 );

	const incrementTestimonial = useCallback( () => {
		const newIndex =
			currentTestimonialIndex === testimonials.length - 1 ? 0 : currentTestimonialIndex + 1;

		setcurrentTestimonialIndex( newIndex );
	}, [ currentTestimonialIndex, testimonials ] );

	const decrementTestimonial = useCallback( () => {
		const newIndex =
			currentTestimonialIndex === 0 ? testimonials.length - 1 : currentTestimonialIndex - 1;

		setcurrentTestimonialIndex( newIndex );
	}, [ currentTestimonialIndex, testimonials ] );

	const shouldShowArrows = testimonials.length > 1;

	return (
		<div className="testimonials">
			{ shouldShowArrows && (
				<button
					data-testid="left-arrow"
					className="testimonials__left-arrow"
					onClick={ decrementTestimonial }
				>
					<Gridicon icon="chevron-left" size={ 48 } />
				</button>
			) }

			{ testimonials.map( ( testimonial, index ) => (
				<Testimonial
					key={ index }
					{ ...testimonial }
					hidden={ currentTestimonialIndex !== index }
				/>
			) ) }

			{ shouldShowArrows && (
				<button
					data-testid="right-arrow"
					className="testimonials__right-arrow"
					onClick={ incrementTestimonial }
				>
					<Gridicon icon="chevron-right" size={ 48 } />
				</button>
			) }
		</div>
	);
};

export default Testimonials;
