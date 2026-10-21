import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import sections from '../sections';
import type { DashboardContext } from '../sections/types';

/**
 * The id of the element wrapping a section's settings card.
 *
 * @param key - The section key.
 * @return The id.
 */
const cardId = ( key: string ) => `jp-protect-settings-${ key }`;

/**
 * The Settings tab: each section's settings card, once Jetpack's settings have loaded.
 *
 * @param props         - The dashboard context, without a section's state.
 * @param props.section - The key of the section whose card to scroll to and focus.
 * @return The tab.
 */
export default function SettingsTab( {
	section,
	...props
}: Omit< DashboardContext, 'state' > & { section?: string } ) {
	const { isLoaded, error, dismissError, load } = props.settings;
	const state = window.jetpackProtectDashboard ?? {};
	const cards = sections.filter( item => item.SettingsCard );
	// Once per arrival, so a later save doesn't pull the page back to the card.
	const scrolledTo = useRef< string >( undefined );

	useEffect( () => {
		if ( ! isLoaded || ! section || scrolledTo.current === section ) {
			return;
		}
		const card = document.getElementById( cardId( section ) );
		const heading = card?.querySelector< HTMLElement >( 'h2' );
		if ( ! card || ! heading ) {
			return;
		}
		scrolledTo.current = section;
		// Stop below the sticky tab strip, at the body's 24px padding, or the strip covers the card's title.
		const strip = document.querySelector< HTMLElement >( '.jp-admin-page-tabs' );
		card.style.scrollMarginBlockStart = `${ ( strip?.offsetHeight ?? 0 ) + 24 }px`;
		card.scrollIntoView( { block: 'start' } );
		// The heading names the card for screen readers; -1 makes it focusable without a tab stop.
		heading.tabIndex = -1;
		heading.focus( { preventScroll: true } );
	}, [ isLoaded, section ] );

	if ( ! isLoaded ) {
		return error ? (
			<div className="jp-protect-dashboard__cards jp-protect-dashboard__cards--settings">
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ load }>
							{ __( 'Try again', 'jetpack-protect-pkg' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			</div>
		) : (
			<Stack direction="row" justify="center">
				<Spinner />
			</Stack>
		);
	}

	return (
		<div className="jp-protect-dashboard__cards jp-protect-dashboard__cards--settings">
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
					<Notice.CloseIconButton onClick={ dismissError } />
				</Notice.Root>
			) }
			{ cards.length ? (
				cards.map( ( { key, SettingsCard: Card } ) => (
					<div key={ key } id={ cardId( key ) }>
						<Card { ...props } state={ state[ key ] } />
					</div>
				) )
			) : (
				<Text variant="body-md">
					{ __( 'There’s nothing to set up yet.', 'jetpack-protect-pkg' ) }
				</Text>
			) }
		</div>
	);
}
