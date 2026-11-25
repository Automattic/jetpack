import {
	Card,
	DataForm,
	Spinner,
	type Field,
	type Form,
} from '@jetpack-premium-analytics/externals';
import { useDispatch } from '@wordpress/data';
import { lazy, Suspense, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { JSX } from 'react';

type TeaserSwitchData = {
	/*
	 * Whether the teaser is on for the current user.
	 */
	teaser: boolean;
};

type TeaserSwitchFormProps = {
	/*
	 * Whether the teaser is on for the current user.
	 */
	isOn: boolean;

	/*
	 * Called with the new state when the user flips the switch.
	 */
	onChange: ( isOn: boolean ) => void;
};

/**
 * The title of the card.
 *
 * @return The title.
 */
const getTitle = (): string => __( 'What’s new', 'jetpack-premium-analytics-pkg' );

/**
 * The card with the switch, drawn as the cards of the settings form are.
 *
 * @param {TeaserSwitchFormProps} props - The props.
 * @return The card.
 */
function TeaserSwitchForm( { isOn, onChange }: TeaserSwitchFormProps ): JSX.Element {
	const { createSuccessNotice } = useDispatch( 'core/notices' );

	const fields = useMemo< Field< TeaserSwitchData >[] >(
		() => [
			{
				id: 'teaser',
				type: 'boolean',
				Edit: 'toggle',
				label: __( 'Show a teaser when there is something new', 'jetpack-premium-analytics-pkg' ),
				description: __( 'Only for you, on this site.', 'jetpack-premium-analytics-pkg' ),
			},
		],
		[]
	);
	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'card', isCollapsible: false },
			fields: [ { id: 'whats-new', label: getTitle(), children: [ 'teaser' ] } ],
		} ),
		[]
	);
	const data = useMemo< TeaserSwitchData >( () => ( { teaser: isOn } ), [ isOn ] );

	const onFormChange = useCallback(
		( edits: Partial< TeaserSwitchData > ) => {
			onChange( Boolean( edits.teaser ) );
			createSuccessNotice( __( 'Settings saved.', 'jetpack-premium-analytics-pkg' ), {
				id: 'stats-settings-saved',
				type: 'snackbar',
			} );
		},
		[ createSuccessNotice, onChange ]
	);

	return <DataForm data={ data } fields={ fields } form={ form } onChange={ onFormChange } />;
}

/**
 * The card while the switch loads, so the cards below do not shift when it arrives.
 *
 * @return The card.
 */
function LoadingCard(): JSX.Element {
	return (
		<Card.Root aria-busy="true">
			<Card.Header>
				<Card.Title>{ getTitle() }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Spinner />
			</Card.Content>
		</Card.Root>
	);
}

/**
 * What is drawn when the switch cannot be offered.
 *
 * @return Nothing.
 */
const NoCard = (): null => null;

const TeaserSwitch = lazy( async () => {
	// A load that fails, or an older copy of the module without the hook, leaves the page without the card.
	const whatsNew = await import( '@automattic/jetpack-announcements' ).catch( () => undefined );
	const useTeaserSwitch = whatsNew?.useTeaserSwitch;
	if ( ! useTeaserSwitch ) {
		return { default: NoCard };
	}

	// The dashboard asks for it too, but not while it holds the surface for an onboarding.
	whatsNew.trackWhatsNew?.();

	return {
		default: function TeaserSwitchCard(): JSX.Element {
			const { isOn, setIsOn } = useTeaserSwitch();

			return <TeaserSwitchForm isOn={ isOn } onChange={ setIsOn } />;
		},
	};
} );

/**
 * The card where the current user turns the teaser of What's new on or off.
 *
 * @return The card.
 */
export function WhatsNewCard(): JSX.Element {
	return (
		<Suspense fallback={ <LoadingCard /> }>
			<TeaserSwitch />
		</Suspense>
	);
}
