import { formatCurrency } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Collapsible,
	Dialog,
	InputControl,
	Notice,
	SelectControl,
	Stack,
	SwitchControl,
	TextareaControl,
} from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSavePlan } from '../../data/memberships';
import { showSuccessSnackbar } from '../../data/notices';
import { trackPaymentsEvent } from '../../data/tracking';
import {
	TIER_DESCRIPTION_MAX,
	WELCOME_MESSAGE_MAX,
	defaultTitle,
	initialForm,
	minimumPrice,
	toPayload,
	validate,
} from './plan-form';
import type { PlanForm } from './plan-form';
import type { Plan } from './plans';
import type { StripeStatus } from '../../data/memberships';
import type { ChangeEvent } from 'react';

type Props = {
	/** The plan to edit, or null to add one. */
	plan: Plan | null;
	/** The Stripe account's currencies. */
	currencies: Pick< StripeStatus, 'defaultCurrency' | 'minimumAmounts' >;
	/** Whether a new plan starts as a newsletter tier. */
	startAsTier?: boolean;
	/** Called once the dialog should go. */
	onClose: () => void;
};

const toAmount = ( value: string ) => Number( value ) || 0;

type PriceInputProps = {
	label: string;
	value: number;
	onChange: ( value: number ) => void;
	description?: string;
	disabled?: boolean;
};

/**
 * A price field that keeps what the user typed, so clearing it leaves it blank rather than 0.
 *
 * @param props             - Component props.
 * @param props.label       - The field's label.
 * @param props.value       - The starting price.
 * @param props.onChange    - Called with the price, 0 when blank.
 * @param props.description - Help or error text.
 * @param props.disabled    - Whether the field is disabled.
 * @return The field.
 */
function PriceInput( { label, value, onChange, description, disabled }: PriceInputProps ) {
	const [ text, setText ] = useState( () => String( value ) );
	const onValueChange = useCallback(
		( next: string ) => {
			setText( next );
			onChange( toAmount( next ) );
		},
		[ onChange ]
	);

	return (
		<InputControl
			type="number"
			min={ 0 }
			step="any"
			label={ label }
			value={ text }
			onValueChange={ onValueChange }
			description={ description }
			disabled={ disabled }
		/>
	);
}

/**
 * Adds or edits a payment plan, including a newsletter tier's monthly and annual prices.
 *
 * @param props             - Component props.
 * @param props.plan        - The plan to edit, or null.
 * @param props.currencies  - The Stripe account's currencies.
 * @param props.startAsTier - Whether a new plan starts as a tier.
 * @param props.onClose     - Callback to close the dialog.
 * @return The dialog.
 */
export default function PlanDialog( { plan, currencies, startAsTier = false, onClose }: Props ) {
	const isEditing = Boolean( plan );
	const [ initial ] = useState( () => initialForm( plan, currencies, startAsTier ) );
	const [ form, setForm ] = useState< PlanForm >( initial );
	const { mutate, isPending, isError, error } = useSavePlan();
	const errors = validate( form, currencies );
	const minimum = formatCurrency( minimumPrice( currencies, form.currency ), form.currency );
	const priceChanged =
		isEditing &&
		( form.price !== initial.price || ( form.isTier && form.annualPrice !== initial.annualPrice ) );

	useEffect( () => {
		trackPaymentsEvent( 'plan_dialog_show', { editing: isEditing } );
		// Once per dialog.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const update = useCallback(
		( changes: Partial< PlanForm > ) =>
			setForm( prev => {
				const next = { ...prev, ...changes };
				// A name the user hasn't typed follows the type and interval.
				return next.titleEdited
					? next
					: { ...next, title: defaultTitle( next.isTier, next.interval ) };
			} ),
		[]
	);

	const currencyItems = useMemo( () => {
		const offered = Object.keys( currencies.minimumAmounts );
		// An existing plan may be in a currency the account no longer offers.
		return ( offered.includes( form.currency ) ? offered : [ ...offered, form.currency ] ).map(
			code => ( { label: code, value: code } )
		);
	}, [ currencies.minimumAmounts, form.currency ] );
	const intervalItems = useMemo(
		() => [
			{ label: __( 'Monthly', 'jetpack-monetize' ), value: '1 month' },
			{ label: __( 'Yearly', 'jetpack-monetize' ), value: '1 year' },
			{ label: __( 'One time sale', 'jetpack-monetize' ), value: 'one-time' },
		],
		[]
	);

	const onTitleChange = useCallback(
		( title: string ) => update( { title, titleEdited: true } ),
		[ update ]
	);
	const onTierChange = useCallback(
		( isTier: boolean ) => update( { isTier, addToNewsletter: isTier } ),
		[ update ]
	);
	const onDescriptionChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) => update( { description: event.target.value } ),
		[ update ]
	);
	const onIntervalChange = useCallback(
		( item: { value: string | null } | null ) => update( { interval: item?.value ?? '1 month' } ),
		[ update ]
	);
	const onCurrencyChange = useCallback(
		( item: { value: string | null } | null ) => item?.value && update( { currency: item.value } ),
		[ update ]
	);
	const onPriceChange = useCallback( ( price: number ) => update( { price } ), [ update ] );
	const onAnnualPriceChange = useCallback(
		( annualPrice: number ) => update( { annualPrice } ),
		[ update ]
	);
	const onWelcomeChange = useCallback(
		( event: ChangeEvent< HTMLTextAreaElement > ) =>
			update( { welcomeMessage: event.target.value } ),
		[ update ]
	);
	const onNewsletterChange = useCallback(
		( addToNewsletter: boolean ) => update( { addToNewsletter } ),
		[ update ]
	);
	const onPayWhatYouWantChange = useCallback(
		( payWhatYouWant: boolean ) => update( { payWhatYouWant } ),
		[ update ]
	);
	const onMultipleChange = useCallback(
		( multiplePerUser: boolean ) => update( { multiplePerUser } ),
		[ update ]
	);

	const onOpenChange = useCallback(
		( open: boolean ) => {
			// Held open mid-save, so a failure still has somewhere to show.
			if ( ! open && ! isPending ) {
				onClose();
			}
		},
		[ isPending, onClose ]
	);

	const onSave = useCallback( () => {
		const payload = toPayload( form );
		mutate(
			{
				payload,
				annualPrice: form.isTier ? form.annualPrice : undefined,
				ids: { monthly: plan?.product.id, annual: plan?.annual?.id },
			},
			{
				onSuccess: () => {
					trackPaymentsEvent( 'plan_save', {
						editing: isEditing,
						is_tier: form.isTier,
						interval: payload.interval,
						currency: payload.currency,
					} );
					showSuccessSnackbar(
						isEditing
							? /* translators: %s: the plan's name. */
								sprintf( __( 'Plan “%s” updated.', 'jetpack-monetize' ), payload.title )
							: /* translators: %s: the plan's name. */
								sprintf( __( 'Plan “%s” added.', 'jetpack-monetize' ), payload.title )
					);
					onClose();
				},
			}
		);
	}, [ form, isEditing, mutate, onClose, plan ] );

	let title;
	if ( form.isTier ) {
		title = isEditing
			? __( 'Edit newsletter tier', 'jetpack-monetize' )
			: __( 'Add a newsletter tier', 'jetpack-monetize' );
	} else {
		title = isEditing
			? __( 'Edit payment plan', 'jetpack-monetize' )
			: __( 'Add a payment plan', 'jetpack-monetize' );
	}

	const priceError = sprintf(
		/* translators: %s: the smallest price allowed, e.g. $0.50. */
		__( 'Enter a price of at least %s.', 'jetpack-monetize' ),
		minimum
	);
	const lengthError = ( max: number ) =>
		sprintf(
			/* translators: %d: the most characters allowed. */
			__( 'Shorten this to %d characters or fewer.', 'jetpack-monetize' ),
			max
		);

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					<Dialog.CloseIconButton disabled={ isPending } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<InputControl
							label={ __( 'Name', 'jetpack-monetize' ) }
							value={ form.title }
							onValueChange={ onTitleChange }
							disabled={ isPending }
							description={
								errors.includes( 'title' )
									? __( 'Enter a name.', 'jetpack-monetize' )
									: __(
											'Let your audience know what they’ll get when they subscribe.',
											'jetpack-monetize'
										)
							}
						/>
						<SwitchControl
							label={ __( 'Paid newsletter tier', 'jetpack-monetize' ) }
							checked={ form.isTier }
							onCheckedChange={ onTierChange }
							disabled={ isEditing || isPending }
						/>
						{ form.isTier && (
							<TextareaControl
								label={ __( 'What subscribers get at this tier', 'jetpack-monetize' ) }
								value={ form.description }
								onChange={ onDescriptionChange }
								disabled={ isPending }
								placeholder={ __(
									'e.g. Full archive access, community Q&A, and bonus newsletters',
									'jetpack-monetize'
								) }
								description={
									errors.includes( 'description' )
										? lengthError( TIER_DESCRIPTION_MAX )
										: sprintf(
												/* translators: %1$d: characters used. %2$d: the most allowed. */
												__(
													'Optional. Shown to readers when they choose a paid tier. %1$d/%2$d characters; Markdown is supported.',
													'jetpack-monetize'
												),
												form.description.trim().length,
												TIER_DESCRIPTION_MAX
											)
								}
							/>
						) }
						{ ! form.isTier && (
							<SelectControl
								label={ __( 'Renewal frequency', 'jetpack-monetize' ) }
								items={ intervalItems }
								value={ intervalItems.find( item => item.value === form.interval ) ?? null }
								onValueChange={ onIntervalChange }
								disabled={ isPending }
							/>
						) }
						<SelectControl
							label={ __( 'Currency', 'jetpack-monetize' ) }
							items={ currencyItems }
							value={ currencyItems.find( item => item.value === form.currency ) ?? null }
							onValueChange={ onCurrencyChange }
							disabled={ isPending || currencyItems.length < 2 }
						/>
						<div className="jp-monetize-payments__prices">
							<PriceInput
								label={
									form.isTier
										? __( 'Monthly price', 'jetpack-monetize' )
										: __( 'Amount', 'jetpack-monetize' )
								}
								value={ form.price }
								onChange={ onPriceChange }
								disabled={ isPending }
								description={ errors.includes( 'price' ) ? priceError : undefined }
							/>
							{ form.isTier && (
								<PriceInput
									label={ __( 'Annual price', 'jetpack-monetize' ) }
									value={ form.annualPrice }
									onChange={ onAnnualPriceChange }
									disabled={ isPending }
									description={
										errors.includes( 'annualPrice' )
											? __(
													'Enter an annual price above the monthly price, and at least the minimum.',
													'jetpack-monetize'
												)
											: undefined
									}
								/>
							) }
						</div>
						{ priceChanged && (
							<Notice.Root intent="info">
								<Notice.Description>
									{ __(
										'Updating the price will not affect existing subscribers, who will pay what they were originally charged on renewal.',
										'jetpack-monetize'
									) }
								</Notice.Description>
							</Notice.Root>
						) }
						<TextareaControl
							label={ __( 'Welcome message', 'jetpack-monetize' ) }
							value={ form.welcomeMessage }
							onChange={ onWelcomeChange }
							disabled={ isPending }
							placeholder={ __( 'Thank you for subscribing!', 'jetpack-monetize' ) }
							description={
								errors.includes( 'welcomeMessage' )
									? lengthError( WELCOME_MESSAGE_MAX )
									: sprintf(
											/* translators: %1$d: characters used. %2$d: the most allowed. */
											__(
												'Sent when your customer completes their order. %1$d/%2$d characters.',
												'jetpack-monetize'
											),
											form.welcomeMessage.length,
											WELCOME_MESSAGE_MAX
										)
							}
						/>
						<Collapsible.Root>
							<Collapsible.Trigger
								render={ <Button variant="minimal" tone="neutral" size="compact" /> }
							>
								{ __( 'Advanced options', 'jetpack-monetize' ) }
							</Collapsible.Trigger>
							<Collapsible.Panel>
								<Stack direction="column" gap="md" className="jp-monetize-payments__advanced">
									{ ! form.isTier && (
										<SwitchControl
											label={ __(
												'Add customers to the newsletter mailing list',
												'jetpack-monetize'
											) }
											checked={ form.addToNewsletter }
											onCheckedChange={ onNewsletterChange }
											disabled={ isEditing || isPending }
										/>
									) }
									<SwitchControl
										label={ __(
											'Let customers pick their own amount (“Pay what you want”)',
											'jetpack-monetize'
										) }
										checked={ form.payWhatYouWant }
										onCheckedChange={ onPayWhatYouWantChange }
										disabled={ isPending }
									/>
									<SwitchControl
										label={ __(
											'Let customers make the same purchase more than once',
											'jetpack-monetize'
										) }
										checked={ form.multiplePerUser }
										onCheckedChange={ onMultipleChange }
										disabled={ isPending }
									/>
								</Stack>
							</Collapsible.Panel>
						</Collapsible.Root>
						{ isError && (
							<Notice.Root intent="error">
								<Notice.Description>
									{ error.message ||
										__( 'The plan could not be saved. Please try again.', 'jetpack-monetize' ) }
								</Notice.Description>
							</Notice.Root>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" tone="neutral" onClick={ onClose } disabled={ isPending }>
						{ __( 'Cancel', 'jetpack-monetize' ) }
					</Button>
					<Button
						onClick={ onSave }
						disabled={ errors.length > 0 || isPending }
						loading={ isPending }
					>
						{ __( 'Save', 'jetpack-monetize' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
