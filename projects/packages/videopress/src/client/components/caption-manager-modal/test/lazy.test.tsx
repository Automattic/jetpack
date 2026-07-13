import { render, screen } from '@testing-library/react';
import LazyCaptionManagerModal from '../lazy';
import type { CaptionManagerModalProps } from '../types';

jest.mock( '../index', () => ( {
	__esModule: true,
	default: ( { guid, isOpen }: CaptionManagerModalProps ) =>
		isOpen ? <div role="dialog">{ `Caption manager for ${ guid }` }</div> : null,
} ) );

describe( 'LazyCaptionManagerModal', () => {
	it( 'loads the modal on demand and passes its props through', async () => {
		const { container } = render(
			<LazyCaptionManagerModal
				isOpen
				guid="abc123"
				onClose={ jest.fn() }
				onTracksChange={ jest.fn() }
			/>
		);

		// Nothing renders while the chunk loads; the Suspense fallback is empty.
		expect( container ).toBeEmptyDOMElement();

		await expect( screen.findByText( 'Caption manager for abc123' ) ).resolves.toBeInTheDocument();
	} );
} );
