/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice, SelectControl, Text } from '@wordpress/ui';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import './style.scss';
import type { ConnectionOwnerCandidate } from './use-ownership-transfer';

/** Shape `SelectControl` takes for each option; `@wordpress/ui` does not export the type. */
interface SelectItem {
	label: string;
	value: string | null;
}

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
 * A select rather than a list of radios: a site can have far more connected
 * administrators than a dialog can show at once.
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
	const items: SelectItem[] = useMemo(
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
		( item: SelectItem | null ) => {
			if ( item?.value ) {
				onSelect( Number( item.value ) );
			}
		},
		[ onSelect ]
	);

	const isLoading = null === candidates;
	const isEmpty = ! isLoading && 0 === candidates.length && ! error;

	if ( isEmpty ) {
		return (
			<div className="jp-connection__transfer-ownership">
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
										'why-the-wordpress-com-connection-is-important-for-jetpack'
									) }
								/>
							),
						}
					) }
				</Text>
			</div>
		);
	}

	// Separate statements, not a ternary: the minifier folds two `__()` calls in one
	// expression into a single call with a non-literal argument, which i18n-check rejects.
	let placeholder: string = __( 'Select an administrator', 'jetpack-connection-js' );
	if ( isLoading ) {
		placeholder = __( 'Loading administrators…', 'jetpack-connection-js' );
	}

	return (
		<div className="jp-connection__transfer-ownership">
			<Text render={ <p /> }>
				{ __(
					"Choose a connected administrator to take over this site's connection to WordPress.com.",
					'jetpack-connection-js'
				) }
			</Text>

			<SelectControl
				label={ __( 'New connection owner', 'jetpack-connection-js' ) }
				placeholder={ placeholder }
				items={ items }
				value={ items.find( item => item.value === String( selectedId ) ) ?? null }
				onValueChange={ handleChange }
				disabled={ isLoading }
				popupWidth="anchor"
			/>

			{ ! isLoading && (
				<Text render={ <p /> } variant="body-sm">
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
										'why-the-wordpress-com-connection-is-important-for-jetpack'
									) }
								/>
							),
						}
					) }
				</Text>
			) }

			{ error && (
				<Text render={ <p /> } className="jp-connection__transfer-ownership__error">
					{ error }
				</Text>
			) }
		</div>
	);
};

export default OwnerCandidateList;
