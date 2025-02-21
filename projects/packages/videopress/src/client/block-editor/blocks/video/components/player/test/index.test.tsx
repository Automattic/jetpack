/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { VideoBlockAttributes } from '../../../types';
import Player from '../index';

const baseAttributes: VideoBlockAttributes = {
	videoRatio: 100,
	autoplay: true,
	align: 'center',
	posterData: {
		type: 'media-library',
		id: 1,
		url: 'https://videopress.com/wp-content/uploads/2024/10/placeholder-video-1.mp4',
	},
};

const previewMock = {
	html: '',
	width: 0,
	height: 0,
	thumbnail_height: 0,
	thumbnail_width: 0,
	version: '',
	title: '',
	type: '',
	provider_name: '',
	provider_url: '',
};

describe( 'Player', () => {
	it( 'should render', () => {
		render(
			<Player
				showCaption={ true }
				isSelected={ false }
				attributes={ baseAttributes }
				setAttributes={ () => {} }
				preview={ previewMock }
				isRequestingEmbedPreview={ false }
				html=""
			/>
		);

		expect( screen.getByRole( 'figure' ) ).toBeInTheDocument();
	} );
} );
