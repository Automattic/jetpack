import { getThreatLabel } from '../labels';
import type { ScanThreat } from '../types';

describe( 'getThreatLabel', () => {
	it.each( [
		[
			'a vulnerable plugin uses its installed name and version',
			{
				id: 1,
				title: 'Vulnerable Plugin: contact-form-7 (version 5.3.1)',
				extension: {
					slug: 'contact-form-7',
					name: 'Contact Form 7',
					version: '5.3.1',
					type: 'plugins',
				},
			},
			{ kind: 'Vulnerable plugin', subject: 'Contact Form 7 (5.3.1)' },
		],
		[
			'a file threat splits its title at the first colon',
			{ id: 2, title: 'Malicious code found in file: jptt_eicar.php' },
			{ kind: 'Malicious code found in file', subject: 'jptt_eicar.php' },
		],
		[
			'a title without a kind is the subject',
			{ id: 3, title: 'Database threat' },
			{ kind: '', subject: 'Database threat' },
		],
	] )( '%s', ( _name, threat, expected ) => {
		expect( getThreatLabel( threat as ScanThreat ) ).toEqual( expected );
	} );
} );
