import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderActions from '../header-actions';

jest.mock( '@wordpress/components', () => ( {
	DropdownMenu: ( { children, label } ) => (
		<div>
			<span>{ label }</span>
			{ children( { onClose: jest.fn() } ) }
		</div>
	),
	MenuGroup: ( { children } ) => <div>{ children }</div>,
	MenuItem: ( { children, onClick } ) => <button onClick={ onClick }>{ children }</button>,
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );

jest.mock( '@wordpress/icons', () => ( {
	download: 'download',
	moreVertical: 'moreVertical',
	trash: 'trash',
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Button: ( { children, disabled, onClick } ) => (
		<button disabled={ disabled } onClick={ onClick }>
			{ children }
		</button>
	),
	Stack: ( { children } ) => <div>{ children }</div>,
} ) );

describe( 'HeaderActions', () => {
	it( 'opens caption management from the more actions menu', async () => {
		const user = userEvent.setup();
		const onManageCaptions = jest.fn();

		render(
			<HeaderActions
				canSave={ false }
				onSave={ jest.fn() }
				onManageCaptions={ onManageCaptions }
				onDownload={ jest.fn() }
				onDelete={ jest.fn() }
			/>
		);

		await user.click( screen.getByText( 'Manage subtitles' ) );

		expect( onManageCaptions ).toHaveBeenCalledTimes( 1 );
	} );
} );
