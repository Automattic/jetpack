import { render, screen } from '@testing-library/react';
import JetpackVaultPressBackupLogo from '../index';

describe( 'JetpackVaultPressBackupLogo', () => {
	const testProps = {
		className: 'sample-classname',
	};

	describe( 'Render the JetpackVaultPressBackupLogo component', () => {
		it( 'validate the class name', () => {
			render( <JetpackVaultPressBackupLogo { ...testProps } /> );

			expect( screen.getByLabelText( 'VaultPress Backup Logo' ) ).toHaveClass(
				testProps.className
			);
		} );
	} );
} );
