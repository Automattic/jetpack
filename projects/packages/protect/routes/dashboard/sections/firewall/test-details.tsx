import { __, sprintf } from '@wordpress/i18n';
import { Dialog, Stack, Text } from '@wordpress/ui';
import { ALLOWED_HEADER, BLOCKED_HEADER, SELF_CHECK_RULE_ID } from './firewall-test';
import type { TestResult } from './firewall-test';

// HTTP/2 responses carry no reason phrase.
const REASON_PHRASES: Record< number, string > = { 200: 'OK', 403: 'Forbidden' };

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
 * Why the response looks the way it does, when the firewall didn't block it.
 *
 * @param result - The test's result.
 * @return The note, or undefined for a block.
 */
function getResponseNote( result: TestResult ): string | undefined {
	if ( result.allowedHeader ) {
		return __(
			'Your IP address is on the always-allowed list, so the firewall let the request through. Requests from other addresses are still checked.',
			'jetpack-protect-pkg'
		);
	}
	if ( ! result.wafHeader ) {
		return __(
			'No firewall header, so the firewall didn’t act on the request. A page cache in front of your site can also answer before the firewall sees it.',
			'jetpack-protect-pkg'
		);
	}
	return undefined;
}

/**
 * The steps the firewall test took, so its result can be checked rather than trusted.
 *
 * @param props          - Component props.
 * @param props.result   - The test's result.
 * @param props.recorded - Whether a new "firewall test" block appeared in the log; null when unknown.
 * @return The steps.
 */
function TestSteps( { result, recorded }: { result: TestResult; recorded: boolean | null } ) {
	const loggedNote = sprintf(
		/* translators: %d is a firewall rule's ID. */
		__( 'It’s in Recently blocked requests as rule %d.', 'jetpack-protect-pkg' ),
		SELF_CHECK_RULE_ID
	);
	const steps: { title: string; detail?: string; code?: string }[] = [
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
				`${ result.status } ${ result.statusText || REASON_PHRASES[ result.status ] || '' }`.trim(),
				result.wafHeader && `${ BLOCKED_HEADER }: ${ result.wafHeader }`,
				result.allowedHeader && `${ ALLOWED_HEADER }: ${ result.allowedHeader }`,
			]
				.filter( Boolean )
				.join( '\n' ),
			detail: getResponseNote( result ),
		},
	];
	if ( recorded !== null ) {
		steps.push( {
			title: recorded
				? __( 'Logged the block', 'jetpack-protect-pkg' )
				: __( 'Nothing was logged', 'jetpack-protect-pkg' ),
			detail: recorded ? loggedNote : undefined,
		} );
	}

	return (
		<ol className="jp-protect-firewall-test">
			{ steps.map( step => (
				<li key={ step.title }>
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

/**
 * The test's steps in a dialog, opened from the result's "Learn more".
 *
 * @param props              - Component props.
 * @param props.result       - The test's result.
 * @param props.recorded     - Whether a new "firewall test" block appeared in the log; null when unknown.
 * @param props.open         - Whether the dialog is open.
 * @param props.onOpenChange - Opens or closes the dialog.
 * @return The dialog.
 */
export default function TestDetails( {
	result,
	recorded,
	open,
	onOpenChange,
}: {
	result: TestResult;
	recorded: boolean | null;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
} ) {
	return (
		<Dialog.Root open={ open } onOpenChange={ onOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>
						{ __( 'How the firewall test works', 'jetpack-protect-pkg' ) }
					</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<TestSteps result={ result } recorded={ recorded } />
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
