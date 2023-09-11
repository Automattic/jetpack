import { FC, ReactNode } from 'react';

export interface TestimonialProps {
	img: string;
	quote: string;
	author: string;
	profession: string | ReactNode;
	hidden?: boolean;
}

export type TestimonialType = FC< TestimonialProps >;

export interface TestimonialsProps {
	testimonials: TestimonialProps[];
}

export type TestimonialsType = FC< TestimonialsProps >;
