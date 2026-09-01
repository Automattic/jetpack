/**
 * VideoCard forwards a DOM ref from VideoThumbnail to PublishFirstVideoPopover's
 * `anchor` prop, so the popover can position itself relative to the thumbnail.
 *
 * Re-implementing VideoThumbnail as a plain function component on React 18 would
 * silently break this wire — React strips `ref` from function-component props.
 * This test fails in that scenario.
 */
import { render, waitFor } from '@testing-library/react';
import { VideoCard } from '../index';
import type { PublishFirstVideoPopoverProps } from '../../publish-first-video-popover/types';

let lastPopoverProps: PublishFirstVideoPopoverProps | undefined;

jest.mock( '../../publish-first-video-popover', () => ( {
	__esModule: true,
	default: ( props: PublishFirstVideoPopoverProps ) => {
		lastPopoverProps = props;
		return null;
	},
} ) );

jest.mock( '../../../hooks/use-permission', () => ( {
	usePermission: () => ( { canPerformAction: true } ),
} ) );

beforeEach( () => {
	lastPopoverProps = undefined;
} );

describe( 'VideoCard ref forwarding', () => {
	it( 'passes the thumbnail DOM element to PublishFirstVideoPopover via the anchor prop', async () => {
		render(
			<VideoCard
				id={ 42 }
				title="Test"
				duration={ 1000 }
				plays={ 0 }
				thumbnail="https://example.com/thumb.jpg"
				editable={ false }
				showQuickActions={ false }
			/>
		);

		await waitFor( () => {
			expect( lastPopoverProps?.anchor ).toBeInstanceOf( HTMLElement );
		} );
		expect( lastPopoverProps?.id ).toBe( 42 );
	} );
} );
