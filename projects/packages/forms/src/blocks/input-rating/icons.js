import { SVG, Path } from '@wordpress/components';

// React SVG components - keep in sync with PHP definitions in class-contact-form-field.php
export const StarIcon = (
	<SVG
		viewBox="0 0 24 24"
		width="1em"
		height="1em"
		aria-hidden="true"
		className="jetpack-field-rating__icon"
	>
		<Path
			d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
			fill="currentColor"
			stroke="var(--jetpack--contact-form--rating-star-color, var(--jetpack--contact-form--primary-color, #333))"
			strokeWidth={ 2 }
			strokeLinejoin="round"
		/>
	</SVG>
);

export const HeartIcon = (
	<SVG
		viewBox="0 0 24 24"
		width="1em"
		height="1em"
		aria-hidden="true"
		className="jetpack-field-rating__icon"
	>
		<Path
			d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
			fill="currentColor"
			stroke="var(--jetpack--contact-form--rating-star-color, var(--jetpack--contact-form--primary-color, #333))"
			strokeWidth={ 2 }
			strokeLinejoin="round"
		/>
	</SVG>
);
