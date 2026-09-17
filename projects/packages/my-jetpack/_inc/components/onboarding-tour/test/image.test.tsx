import { render, screen } from '@testing-library/react';
import WelcomeTourImage from '../image';

describe( 'WelcomeTourImage', () => {
	it( 'renders both densities once the image URLs resolve', () => {
		render(
			<WelcomeTourImage
				nonAnimatedSrc="https://example.com/a.webp"
				nonAnimatedSrc2x="https://example.com/a-2x.webp"
				animatedSrc="https://example.com/a.webp"
				animatedSrc2x="https://example.com/a-2x.webp"
			/>
		);

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'srcset',
			'https://example.com/a.webp 1x, https://example.com/a-2x.webp 2x'
		);
	} );

	it( 'renders nothing when the image URLs are missing', () => {
		const { container } = render(
			<WelcomeTourImage
				nonAnimatedSrc={ undefined }
				nonAnimatedSrc2x={ undefined }
				animatedSrc={ undefined }
				animatedSrc2x={ undefined }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
