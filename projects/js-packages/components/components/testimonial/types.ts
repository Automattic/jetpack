import { FC } from 'react';

export interface TestimonialProps {
	img: string;
	quote: string;
	author: string;
	profession: string;
}

export type TestimonialType = FC< TestimonialProps >;
