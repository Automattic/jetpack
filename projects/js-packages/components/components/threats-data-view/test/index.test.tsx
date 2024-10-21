import { render, screen } from '@testing-library/react';
import ThreatsDataView from '..';
import { DataViewThreat } from '../types';

const data = [
	{
		id: 185869885,
		signature: 'EICAR_AV_Test',
		title: 'Malicious code found in file: index.php',
		description:
			"This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don't expect it to, contact Jetpack support for some help.",
		firstDetected: '2024-10-07T20:45:06.000Z',
		fixedIn: null,
		fixedOn: null,
		severity: 8,
		fixable: { fixer: 'rollback', target: 'January 26, 2024, 6:49 am', extensionStatus: '' },
		status: 'current',
		filename: '/var/www/html/wp-content/index.php',
		context: {
			'1': 'echo <<<HTML',
			'2': 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
			'3': 'HTML;',
			marks: {},
		},
		source: null,
	},
] as DataViewThreat[];

describe( 'ThreatsDataView', () => {
	it( 'renders threat data', () => {
		render( <ThreatsDataView data={ data } /> );
		expect( screen.getByText( 'Malicious code found in file: index.php' ) ).toBeInTheDocument();
	} );
} );
