import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, LinkButton, Notice, Stack, Text } from '@wordpress/ui';
import { useStatus } from '../data/queries';
import { useFeatureAction } from '../data/use-feature-action';
import type { Feature, SectionState } from '../types';
import type { JSX, ReactNode } from 'react';

/**
 * The PHP screen's copy for each feature, one complete sentence per string.
 *
 * @param feature - Feature.
 * @return Copy.
 */
function copyFor( feature: Feature ) {
	if ( feature === 'sharing' ) {
		return {
			addBlock: __(
				'Add the Sharing Buttons block to your theme’s template.',
				'jetpack-sharing-likes'
			),
			off: __( 'Sharing buttons are turned off for this site.', 'jetpack-sharing-likes' ),
			turnOn: __( 'Turn on sharing buttons', 'jetpack-sharing-likes' ),
			nudge: __(
				'Legacy sharing buttons cannot be customized on block themes. Use the Sharing Buttons block in your theme’s template instead.',
				'jetpack-sharing-likes'
			),
			switchToBlock: __( 'Switch to the Sharing Buttons block', 'jetpack-sharing-likes' ),
		};
	}

	return {
		addBlock: __( 'Add the Like block to your theme’s template.', 'jetpack-sharing-likes' ),
		off: __( 'Like buttons are turned off for this site.', 'jetpack-sharing-likes' ),
		turnOn: __( 'Turn on Like buttons', 'jetpack-sharing-likes' ),
		nudge: __(
			'Legacy Like buttons cannot be customized on block themes. Use the Like block in your theme’s template instead.',
			'jetpack-sharing-likes'
		),
		switchToBlock: __( 'Switch to the Like block', 'jetpack-sharing-likes' ),
	};
}

/**
 * Renders the section variant `status` gives a feature. `block_call_to_action` offers no way back, on purpose.
 *
 * @param props          - Props.
 * @param props.feature  - Feature.
 * @param props.state    - Variant.
 * @param props.children - The feature's options, shown while it configures.
 * @return Variant.
 */
export function FeatureVariant( {
	feature,
	state,
	children,
}: {
	feature: Feature;
	state: SectionState;
	children?: ReactNode;
} ): JSX.Element {
	const status = useStatus();
	const { run, isPending } = useFeatureAction();
	const copy = copyFor( feature );
	const containerRef = useRef< HTMLDivElement >( null );
	const stateAtAction = useRef< SectionState | null >( null );

	const switchToBlock = useCallback( () => {
		stateAtAction.current = state;
		run( feature, 'switch-to-block' );
	}, [ run, feature, state ] );
	const activate = useCallback( () => {
		stateAtAction.current = state;
		run( feature, 'activate' );
	}, [ run, feature, state ] );

	// The clicked button disappears with the old variant, so keyboard focus moves to what replaced it.
	useEffect( () => {
		if ( isPending || null === stateAtAction.current ) {
			return;
		}
		if ( stateAtAction.current !== state ) {
			containerRef.current?.focus();
		}
		stateAtAction.current = null;
	}, [ isPending, state ] );

	let content: ReactNode;

	switch ( state ) {
		case 'block_call_to_action':
			content = (
				<Stack direction="column" gap="md">
					<Text render={ <p /> }>{ copy.addBlock }</Text>
					<div>
						<LinkButton variant="outline" href={ status?.site_editor_url ?? '' }>
							{ __( 'Open Site Editor', 'jetpack-sharing-likes' ) }
						</LinkButton>
					</div>
				</Stack>
			);
			break;
		case 'off':
			content = (
				<Stack direction="column" gap="md">
					<Text render={ <p /> }>{ copy.off }</Text>
					<div>
						<Button variant="outline" loading={ isPending } onClick={ activate }>
							{ copy.turnOn }
						</Button>
					</div>
				</Stack>
			);
			break;
		case 'configure_with_block_nudge':
			content = (
				<Stack direction="column" gap="lg">
					<Notice.Root intent="info">
						<Notice.Description>{ copy.nudge }</Notice.Description>
						<Notice.Actions>
							<Button
								variant="outline"
								size="compact"
								loading={ isPending }
								onClick={ switchToBlock }
							>
								{ copy.switchToBlock }
							</Button>
						</Notice.Actions>
					</Notice.Root>
					{ children }
				</Stack>
			);
			break;
		default:
			content = children;
	}

	return (
		<div ref={ containerRef } tabIndex={ -1 } className="jetpack-sharing-likes__variant">
			{ content }
		</div>
	);
}
