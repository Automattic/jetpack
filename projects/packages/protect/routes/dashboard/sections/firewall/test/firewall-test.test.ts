import { getBlockLabel, getTestOutcome } from '../firewall-test';

describe( 'getTestOutcome', () => {
	it.each( [
		[ 'a 403 with the firewall header is a block', 403, '403 - rule -2', true, 'blocked' ],
		[ 'the header without a 403 is silent mode', 200, '403 - rule -2', true, 'silent' ],
		[ 'a normal page means nothing blocked it', 200, null, true, 'not-blocked' ],
		[ 'a 403 from the host is not the firewall', 403, null, true, 'not-blocked' ],
		[ 'a normal page while the firewall is off is expected', 200, null, false, 'off' ],
	] )( '%s', ( _name, status, header, active, expected ) => {
		expect( getTestOutcome( status, header, active ) ).toBe( expected );
	} );
} );

describe( 'getBlockLabel', () => {
	it.each( [
		[ 'the self-check', { ruleId: -2, reason: 'firewall test' }, 'Firewall test' ],
		[ 'the IP block list', { ruleId: -1, reason: 'ip block list' }, 'Blocked IP address' ],
		[ 'a rule with a reason', { ruleId: 941100, reason: 'XSS attack' }, 'XSS attack' ],
		[ 'a rule without a reason', { ruleId: 941100, reason: '' }, 'Rule 941100' ],
	] )( '%s', ( _name, block, expected ) => {
		expect( getBlockLabel( block ) ).toBe( expected );
	} );
} );
