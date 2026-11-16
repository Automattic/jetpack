import { useId } from '@wordpress/element';
import { listView } from '@wordpress/icons';
import { Badge, Dialog, Icon, Stack, Text, Tooltip } from '@wordpress/ui';
import { bringYourAiToolCopy } from './ai-tool-copy.ts';
import { chatGptIcon } from './connector-icons.tsx';
import type { Ref } from 'react';

export type SetupChoice = 'guide' | 'ai';

interface Props {
	value: SetupChoice | null;
	onChange: ( value: SetupChoice ) => void;
	titleRef?: Ref< HTMLHeadingElement >;
}

/**
 * The treatment's first view: follow the guided goals, or build with your own AI.
 *
 * @param props          - Component props.
 * @param props.value    - The selected choice, or null.
 * @param props.onChange - Called with the choice the user picks.
 * @param props.titleRef - Ref to the view title, focused when the view opens.
 * @return The setup choice view.
 */
export default function SetupChoiceStep( { value, onChange, titleRef }: Props ) {
	const id = useId();
	const titleId = `${ id }-title`;
	const copy = bringYourAiToolCopy();
	const options = [
		{
			key: 'guide' as const,
			title: copy.guideTitle,
			description: copy.guideDescription,
			icon: listView,
			badge: null,
		},
		{
			key: 'ai' as const,
			title: copy.useAiTitle,
			description: copy.useAiDescription,
			icon: chatGptIcon,
			badge: copy.freeBadge,
		},
	];

	return (
		<Stack direction="column" gap="lg">
			<Dialog.Title
				ref={ titleRef }
				id={ titleId }
				tabIndex={ -1 }
				className="ai-launchpad-wizard__title"
			>
				{ copy.choiceTitle }
			</Dialog.Title>
			<div className="ai-launchpad-wizard__cards" role="radiogroup" aria-labelledby={ titleId }>
				{ options.map( option => {
					const inputId = `${ id }-${ option.key }`;
					const optionTitleId = `${ inputId }-title`;
					const optionDescriptionId = `${ inputId }-description`;
					const optionBadgeId = `${ inputId }-badge`;
					return (
						<label
							key={ option.key }
							htmlFor={ inputId }
							className={
								'ai-launchpad-wizard__card' + ( value === option.key ? ' is-selected' : '' )
							}
						>
							<input
								id={ inputId }
								type="radio"
								name={ `${ id }-choice` }
								value={ option.key }
								checked={ value === option.key }
								onChange={ () => onChange( option.key ) }
								aria-labelledby={ optionTitleId }
								aria-describedby={
									option.badge ? `${ optionDescriptionId } ${ optionBadgeId }` : optionDescriptionId
								}
								className="ai-launchpad-wizard__card-input"
							/>
							<Icon icon={ option.icon } size={ 20 } />
							<Stack
								direction="column"
								gap="xs"
								render={ <span /> }
								className="ai-launchpad-wizard__card-text"
							>
								<Stack align="center" justify="space-between" gap="sm" render={ <span /> }>
									<Text variant="heading-md" id={ optionTitleId }>
										{ option.title }
									</Text>
									{ option.badge && (
										// Hover-only, per the design: the tooltip is not announced and does not show on touch.
										<Tooltip.Root>
											<Tooltip.Trigger
												render={
													<Badge intent="stable" id={ optionBadgeId }>
														{ option.badge }
													</Badge>
												}
											/>
											<Tooltip.Popup
												portal={ <Tooltip.Portal className="ai-launchpad-wizard__portal" /> }
												positioner={ <Tooltip.Positioner side="top" align="end" /> }
												className="ai-launchpad-wizard__tooltip"
											>
												{ copy.freeTooltip }
											</Tooltip.Popup>
										</Tooltip.Root>
									) }
								</Stack>
								<Text
									variant="body-sm"
									id={ optionDescriptionId }
									className="ai-launchpad-wizard__card-description"
								>
									{ option.description }
								</Text>
							</Stack>
						</label>
					);
				} ) }
			</div>
		</Stack>
	);
}
