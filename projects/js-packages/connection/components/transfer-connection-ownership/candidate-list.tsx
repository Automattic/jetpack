/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { SelectControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// SelectControl comes from @wordpress/components, not @wordpress/ui: the latter is
// bundled rather than loaded from WordPress, and its select drags in Base UI and
// Floating UI — roughly 220KB on every page that loads this script.
import { Link, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type { ConnectionOwnerCandidate } from './use-ownership-transfer';

export interface OwnerCandidateListProps {
	/** The administrators ownership could be handed to, or null while loading. */
	candidates: ConnectionOwnerCandidate[] | null;
	/** The currently chosen candidate. */
	selectedId: number | null;
	/** Called with the chosen candidate's ID. */
	onSelect: ( id: number ) => void;
	/** An error to show below the control, if any. */
	error?: string;
}

/**
 * Choose which administrator takes over the connection.
 *
 * @param {OwnerCandidateListProps} props - Component props.
 * @return {import('react').ReactNode} The OwnerCandidateList component.
 */
const OwnerCandidateList = ( {
	candidates,
	selectedId,
	onSelect,
	error,
}: OwnerCandidateListProps ) => {
	const options = useMemo(
		() =>
			( candidates ?? [] ).map( candidate => ( {
				label: candidate.email
					? `${ candidate.displayName } (${ candidate.email })`
					: candidate.displayName,
				value: String( candidate.id ),
			} ) ),
		[ candidates ]
	);

	const handleChange = useCallback(
		( value: string ) => {
			if ( value ) {
				onSelect( Number( value ) );
			}
		},
		[ onSelect ]
	);

	const isLoading = null === candidates;
	const isEmpty = ! isLoading && 0 === candidates.length && ! error;

	if ( isEmpty ) {
		return (
			<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership">
				<Notice.Root intent="warning">
					<Notice.Title>
						{ __( 'No other connected administrators', 'jetpack-connection-js' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'Ownership can only go to an administrator who has connected their WordPress.com account.',
							'jetpack-connection-js'
						) }
					</Notice.Description>
				</Notice.Root>
				<Text render={ <p /> }>
					{ createInterpolateElement(
						__(
							'Ask another administrator to connect, then come back here to transfer ownership. <link>How users connect</link>',
							'jetpack-connection-js'
						),
						{
							link: (
								<Link
									openInNewTab
									href={ getRedirectUrl(
										'why-the-wordpress-com-connection-is-important-for-jetpack',
										{
											anchor:
												'i-want-to-get-the-most-out-of-jetpack-how-do-i-connect-my-wordpress-com-account',
										}
									) }
								/>
							),
						}
					) }
				</Text>
			</Stack>
		);
	}

	// Separate statements, not a ternary: the minifier folds two `__()` calls in one
	// expression into a single call with a non-literal argument, which i18n-check rejects.
	let placeholder: string = __( 'Select an administrator', 'jetpack-connection-js' );
	if ( isLoading ) {
		placeholder = __( 'Loading administrators…', 'jetpack-connection-js' );
	}

	return (
		<Stack direction="column" gap="lg" className="jp-connection__transfer-ownership">
			<Text render={ <p /> }>
				{ __(
					"Choose a connected administrator to take over this site's connection to WordPress.com.",
					'jetpack-connection-js'
				) }
			</Text>

			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'New connection owner', 'jetpack-connection-js' ) }
				value={ null === selectedId ? '' : String( selectedId ) }
				options={ [ { label: placeholder, value: '' }, ...options ] }
				onChange={ handleChange }
				disabled={ isLoading }
			/>

			<Text render={ <p /> } className="jp-connection__transfer-ownership__hint">
				{ createInterpolateElement(
					__(
						"Don't see someone? They need to be an administrator and <link>connect their WordPress.com account</link> first.",
						'jetpack-connection-js'
					),
					{
						link: (
							<Link
								openInNewTab
								href={ getRedirectUrl(
									'why-the-wordpress-com-connection-is-important-for-jetpack',
									{
										anchor:
											'i-want-to-get-the-most-out-of-jetpack-how-do-i-connect-my-wordpress-com-account',
									}
								) }
							/>
						),
					}
				) }
			</Text>

			{ /* A Notice rather than styled text: it arrives after an async failure, and
			     Notice announces itself so the user is not left waiting on nothing. */ }
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
		</Stack>
	);
};

export default OwnerCandidateList;
