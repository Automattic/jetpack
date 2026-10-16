import { render, screen } from '@testing-library/react';
import LazyChapterManagerModal from '../lazy';
import type { ChapterManagerModalProps } from '../types';

jest.mock( '../index', () => ( {
	__esModule: true,
	default: ( { guid, isOpen }: ChapterManagerModalProps ) =>
		isOpen ? <div role="dialog">{ `Chapter manager for ${ guid }` }</div> : null,
} ) );

describe( 'LazyChapterManagerModal', () => {
	it( 'loads the modal on demand and passes its props through', async () => {
		const { container } = render(
			<LazyChapterManagerModal
				isOpen
				guid="abc123"
				attachmentId={ 42 }
				description=""
				onClose={ jest.fn() }
				onSaved={ jest.fn() }
			/>
		);

		// Nothing renders while the chunk loads; the Suspense fallback is empty.
		expect( container ).toBeEmptyDOMElement();

		await expect( screen.findByText( 'Chapter manager for abc123' ) ).resolves.toBeInTheDocument();
	} );
} );
