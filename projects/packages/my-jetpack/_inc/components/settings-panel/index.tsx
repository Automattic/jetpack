import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { IconButton, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useId, useRef } from 'react';
import { useRouteSearch } from '../../router-bridge';
import { useAllJetpackModules } from '../my-jetpack-tab-panel/features/use-all-jetpack-modules';
import { FallbackSettings } from './fallback-settings';
import { moduleSettings } from './registry';
import styles from './styles.module.scss';
import type { KeyboardEvent } from 'react';

/**
 * The settings panel the boot inspector shows for the `configure` search value.
 *
 * @return The panel.
 */
export function SettingsPanel() {
	const search = useRouteSearch();
	const slug = String( search.configure ?? '' );
	const navigate = useNavigate();
	const { modules, hasLoaded } = useAllJetpackModules();
	// Own keys only: a slug such as `constructor` must not find an inherited property.
	const $module =
		modules && Object.hasOwn( modules, slug ) ? modules[ slug as keyof typeof modules ] : undefined;
	const Settings = $module && moduleSettings[ slug ];
	const headingId = useId();
	const headingRef = useRef< HTMLHeadingElement >( null );
	const rootRef = useRef< HTMLElement >( null );
	const openerRef = useRef< HTMLElement | null >( null );

	const onClose = useCallback( () => {
		type NavigateOptions = Parameters< typeof navigate >[ 0 ];

		navigate( {
			search: ( previous: Record< string, unknown > ) => ( { ...previous, configure: undefined } ),
			replace: true,
			viewTransition: false,
		} as unknown as NavigateOptions );
	}, [ navigate ] );

	// Focus moves in on open and on each new slug, and back to whatever opened the panel on close.
	useEffect( () => {
		const active = rootRef.current?.ownerDocument.activeElement;
		if ( active instanceof HTMLElement && ! rootRef.current?.contains( active ) ) {
			openerRef.current = active;
		}
		headingRef.current?.focus();
	}, [ slug ] );

	// Only when focus was lost with the panel; focus already elsewhere stays put.
	useEffect(
		() => () => {
			const opener = openerRef.current;
			const active = opener?.ownerDocument.activeElement;
			if ( opener?.isConnected && ( ! active || active === opener.ownerDocument.body ) ) {
				opener.focus();
			}
		},
		[]
	);

	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLElement > ) => {
			if ( event.key === 'Escape' && ! event.defaultPrevented ) {
				onClose();
			}
		},
		[ onClose ]
	);

	let body;
	if ( $module ) {
		body = Settings ? <Settings module={ $module } /> : <FallbackSettings module={ $module } />;
	} else if ( hasLoaded ) {
		body = (
			<Notice.Root intent="warning">
				<Notice.Description>
					{ __( 'Failed to get feature settings', 'jetpack-my-jetpack' ) }
				</Notice.Description>
			</Notice.Root>
		);
	} else {
		body = <Spinner />;
	}

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape from anywhere inside the panel closes it.
		<section
			ref={ rootRef }
			className={ styles[ 'settings-panel' ] }
			aria-labelledby={ headingId }
			onKeyDown={ onKeyDown }
		>
			<Stack direction="column" gap="lg">
				<Stack direction="row" align="center" justify="space-between">
					<Text
						variant="heading-md"
						render={ <h2 id={ headingId } ref={ headingRef } tabIndex={ -1 } /> }
					>
						{ $module?.name ?? __( 'Feature settings', 'jetpack-my-jetpack' ) }
					</Text>
					<IconButton
						icon={ close }
						label={ __( 'Close', 'jetpack-my-jetpack' ) }
						variant="minimal"
						tone="neutral"
						size="compact"
						onClick={ onClose }
					/>
				</Stack>
				{ body }
			</Stack>
		</section>
	);
}
