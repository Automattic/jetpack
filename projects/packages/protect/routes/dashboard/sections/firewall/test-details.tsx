import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { SELF_CHECK_RULE_ID } from './firewall-test';
import type { TestResult } from './firewall-test';

/**
 * The request's path and query, with the spent token shortened.
 *
 * @param url - The test URL.
 * @return For example `/?jetpack_waf_test=3aa897…`.
 */
function getShortRequest( url: string ): string {
	const { pathname, searchParams } = new URL( url );
	const [ [ name, token ] = [ '', '' ] ] = Array.from( searchParams );
	return `${ pathname }?${ name }=${ token.slice( 0, 6 ) }…`;
}

/**
 * The steps the firewall test took, so its result can be checked rather than trusted.
 *
 * @param props          - Component props.
 * @param props.result   - The test's result.
 * @param props.recorded - Whether a new "firewall test" block appeared in the log.
 * @return The steps.
 */
export default function TestDetails( {
	result,
	recorded,
}: {
	result: TestResult;
	recorded: boolean;
} ) {
	const loggedNote = sprintf(
		/* translators: %d is a firewall rule's ID. */
		__( 'It’s in Recently blocked requests as rule %d.', 'jetpack-protect-pkg' ),
		SELF_CHECK_RULE_ID
	);
	const steps = [
		{
			title: __( 'Created a one-time test token', 'jetpack-protect-pkg' ),
			detail: __(
				'Saved on your server for 60 seconds. The firewall checks for it before any of its rules, so the test works even with automatic rules off.',
				'jetpack-protect-pkg'
			),
		},
		{
			title: __( 'Requested your site as a logged-out visitor', 'jetpack-protect-pkg' ),
			code: `GET ${ getShortRequest( result.url ) }`,
		},
		{
			title: __( 'Got a response', 'jetpack-protect-pkg' ),
			code: [
				`${ result.status } ${ result.statusText }`.trim(),
				result.wafHeader && `X-JetpackWAF-Blocked: ${ result.wafHeader }`,
			]
				.filter( Boolean )
				.join( '\n' ),
			detail: result.wafHeader
				? undefined
				: __(
						'No firewall header, so the firewall didn’t act on the request.',
						'jetpack-protect-pkg'
					),
		},
		{
			title: recorded
				? __( 'Logged the block', 'jetpack-protect-pkg' )
				: __( 'Nothing was logged', 'jetpack-protect-pkg' ),
			detail: recorded ? loggedNote : undefined,
		},
	];

	return (
		<ol className="jp-protect-firewall-test">
			{ steps.map( step => (
				<li key={ step.title } className="jp-protect-firewall-test__step">
					<Stack direction="column" gap="xs">
						<Text variant="body-md">{ step.title }</Text>
						{ step.code && <pre className="jp-protect-firewall-test__code">{ step.code }</pre> }
						{ step.detail && (
							<Text variant="body-sm" className="jp-protect-card__muted">
								{ step.detail }
							</Text>
						) }
					</Stack>
				</li>
			) ) }
		</ol>
	);
}
