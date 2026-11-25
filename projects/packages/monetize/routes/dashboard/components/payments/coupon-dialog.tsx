import { __, _n, sprintf } from '@wordpress/i18n';
import {
	Button,
	Dialog,
	InputControl,
	InputLayout,
	Notice,
	SearchableChipSelectControl,
	SelectControl,
	Stack,
	SwitchControl,
	ValidityIndicator,
} from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { useSaveCoupon } from '../../data/coupons';
import { useMembershipProducts } from '../../data/memberships';
import { showSuccessSnackbar } from '../../data/notices';
import { trackPaymentsEvent } from '../../data/tracking';
import {
	DURATIONS,
	initialForm,
	invalidEmails,
	missingPlanIds,
	randomCode,
	toPayload,
	validate,
} from './coupon-form';
import { priceLabel } from './plans';
import type { CouponForm } from './coupon-form';
import type { Coupon } from '../../data/coupons';
import type { StripeStatus } from '../../data/memberships';

type Props = {
	/** The coupon to edit, or null to add one. */
	coupon: Coupon | null;
	/** The site's coupon codes, so a generated one is new. */
	codes: string[];
	/** The Stripe account's currencies. */
	currencies: Pick< StripeStatus, 'defaultCurrency' | 'minimumAmounts' >;
	/** Called once the dialog should go. */
	onClose: () => void;
};

type Item = { label: string; value: string };

/**
 * How long a discount lasts, as the duration select names it.
 *
 * @param duration - `<n> months`, or empty for forever.
 * @return The label.
 */
function durationLabel( duration: string ): string {
	const months = parseInt( duration, 10 );
	if ( ! months ) {
		return __( 'Forever', 'jetpack-monetize' );
	}
	if ( months % 12 === 0 ) {
		/* translators: %d: a number of years. */
		return sprintf( _n( '%d year', '%d years', months / 12, 'jetpack-monetize' ), months / 12 );
	}
	/* translators: %d: a number of months. */
	return sprintf( _n( '%d month', '%d months', months, 'jetpack-monetize' ), months );
}

/**
 * Marks a field invalid and shows its error in red below its description.
 *
 * @param message - The error, if any.
 * @return Props for the field.
 */
function errorProps( message: string | undefined ) {
	return {
		'aria-invalid': Boolean( message ),
		details: message ? <ValidityIndicator type="invalid" message={ message } /> : undefined,
	};
}

/**
 * Adds or edits a coupon.
 *
 * @param props            - Component props.
 * @param props.coupon     - The coupon to edit, or null.
 * @param props.codes      - The site's coupon codes.
 * @param props.currencies - The Stripe account's currencies.
 * @param props.onClose    - Callback to close the dialog.
 * @return The dialog.
 */
export default function CouponDialog( { coupon, codes, currencies, onClose }: Props ) {
	const isEditing = Boolean( coupon );
	const [ form, setForm ] = useState< CouponForm >( () => initialForm( coupon, currencies ) );
	const { data: products, isPending: isLoadingPlans } = useMembershipProducts();
	const { mutate, isPending, isError, error } = useSaveCoupon();
	const planIds = useMemo( () => products?.map( product => product.id ) ?? null, [ products ] );
	const takenCodes = useMemo(
		() => codes.filter( code => code.toUpperCase() !== coupon?.code.toUpperCase() ),
		[ codes, coupon ]
	);
	const errors = validate( form, { isEditing, takenCodes, planIds } );
	const missingPlans = useMemo( () => missingPlanIds( form, planIds ), [ form, planIds ] );

	const update = useCallback(
		( changes: Partial< CouponForm > ) => setForm( prev => ( { ...prev, ...changes } ) ),
		[]
	);

	const typeItems = useMemo(
		() => [
			{ label: __( 'Percentage', 'jetpack-monetize' ), value: 'percentage' },
			{ label: __( 'Amount', 'jetpack-monetize' ), value: 'amount' },
		],
		[]
	);
	const currencyItems = useMemo( () => {
		const offered = Object.keys( currencies.minimumAmounts );
		// An existing coupon may be in a currency the account no longer offers.
		return ( offered.includes( form.currency ) ? offered : [ ...offered, form.currency ] ).map(
			code => ( { label: code, value: code } )
		);
	}, [ currencies.minimumAmounts, form.currency ] );
	const durationItems = useMemo(
		() =>
			// An existing coupon may last a length Calypso no longer offers.
			( DURATIONS.includes( form.duration ) ? DURATIONS : [ ...DURATIONS, form.duration ] ).map(
				duration => ( { label: durationLabel( duration ), value: duration } )
			),
		[ form.duration ]
	);
	const planItems = useMemo(
		() =>
			( products ?? [] ).map( product => ( {
				label: product.title,
				value: String( product.id ),
				description: priceLabel( product ),
			} ) ),
		[ products ]
	);
	// Missing plans still show as chips, so they can be removed.
	const selectedPlans = useMemo(
		() => [
			...planItems.filter( item => form.planIds.includes( Number( item.value ) ) ),
			...missingPlans.map( id => ( {
				/* translators: %d: a payment plan's ID. */
				label: sprintf( __( 'Unavailable plan (ID %d)', 'jetpack-monetize' ), id ),
				value: String( id ),
			} ) ),
		],
		[ planItems, form.planIds, missingPlans ]
	);

	const onCodeChange = useCallback( ( code: string ) => update( { code } ), [ update ] );
	const onGenerateCode = useCallback(
		() => update( { code: randomCode( codes ) } ),
		[ codes, update ]
	);
	const onTypeChange = useCallback(
		( item: Item | null ) =>
			item && update( { discountType: item.value as CouponForm[ 'discountType' ] } ),
		[ update ]
	);
	const onDiscountChange = useCallback(
		( discount: string ) => update( { discount } ),
		[ update ]
	);
	const onCurrencyChange = useCallback(
		( item: Item | null ) => item && update( { currency: item.value } ),
		[ update ]
	);
	const onStartDateChange = useCallback(
		( startDate: string ) => update( { startDate } ),
		[ update ]
	);
	const onEndDateChange = useCallback( ( endDate: string ) => update( { endDate } ), [ update ] );
	const onDurationChange = useCallback(
		( item: Item | null ) => item && update( { duration: item.value } ),
		[ update ]
	);
	const onPlansChange = useCallback(
		( items: Item[] ) => update( { planIds: items.map( item => Number( item.value ) ) } ),
		[ update ]
	);
	const onEmailsChange = useCallback( ( emails: string ) => update( { emails } ), [ update ] );
	const onLimitChange = useCallback(
		( limitPerUser: string ) => update( { limitPerUser } ),
		[ update ]
	);
	const onCannotCombineChange = useCallback(
		( cannotCombine: boolean ) => update( { canBeCombined: ! cannotCombine } ),
		[ update ]
	);
	const onFirstTimeChange = useCallback(
		( firstTimeOnly: boolean ) => update( { firstTimeOnly } ),
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
		mutate(
			{ payload: toPayload( form ), id: coupon?.id },
			{
				onSuccess: () => {
					trackPaymentsEvent( 'coupon_save', {
						editing: isEditing,
						discount_type: form.discountType,
					} );
					const message = isEditing
						? /* translators: %s: a coupon code. */
							sprintf( __( 'Coupon “%s” updated.', 'jetpack-monetize' ), form.code )
						: /* translators: %s: a coupon code. */
							sprintf( __( 'Coupon “%s” added.', 'jetpack-monetize' ), form.code );
					showSuccessSnackbar( message );
					onClose();
				},
			}
		);
	}, [ coupon, form, isEditing, mutate, onClose ] );

	// A blank code or discount only blocks saving, so a new coupon doesn't open full of errors.
	let codeError;
	if ( errors.includes( 'codeTaken' ) ) {
		codeError = __( 'Another coupon already uses this code.', 'jetpack-monetize' );
	} else if ( form.code !== '' && errors.includes( 'code' ) ) {
		codeError = __( 'Use 3 to 20 letters, numbers, or hyphens.', 'jetpack-monetize' );
	}
	let discountError;
	if ( form.discount !== '' && errors.includes( 'discount' ) ) {
		discountError =
			form.discountType === 'percentage'
				? __( 'Enter a whole number from 1 to 100.', 'jetpack-monetize' )
				: __( 'Enter a whole amount of at least 1.', 'jetpack-monetize' );
	}
	const startDateError = errors.includes( 'startDate' )
		? __( 'Enter a start date.', 'jetpack-monetize' )
		: undefined;
	const endDateError = errors.includes( 'endDate' )
		? __( 'Choose a date that’s not in the past or before the start date.', 'jetpack-monetize' )
		: undefined;
	const emailsError = errors.includes( 'emails' )
		? sprintf(
				/* translators: %s: a comma-separated list of email addresses. */
				__( 'Fix these email addresses: %s', 'jetpack-monetize' ),
				invalidEmails( form.emails ).join( ', ' )
			)
		: undefined;
	const limitError = errors.includes( 'limitPerUser' )
		? __( 'Enter a whole number of at least 1.', 'jetpack-monetize' )
		: undefined;

	// Wait for the plans, so a missing one is caught before saving.
	const canSave =
		errors.length === 0 && ! isPending && ! ( isLoadingPlans && form.planIds.length > 0 );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>
						{ isEditing
							? __( 'Edit coupon', 'jetpack-monetize' )
							: __( 'Add a coupon', 'jetpack-monetize' ) }
					</Dialog.Title>
					<Dialog.CloseIconButton disabled={ isPending } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<InputControl
							disabled={ isPending }
							label={ __( 'Coupon code', 'jetpack-monetize' ) }
							value={ form.code }
							onValueChange={ onCodeChange }
							maxLength={ 20 }
							suffix={
								<InputLayout.Slot padding="minimal" className="jp-monetize-payments__input-action">
									<Button
										variant="minimal"
										tone="neutral"
										size="small"
										onClick={ onGenerateCode }
										disabled={ isPending }
									>
										{ __( 'Generate', 'jetpack-monetize' ) }
									</Button>
								</InputLayout.Slot>
							}
							description={ __(
								'Customers enter this at checkout. Letters, numbers, and hyphens; not case-sensitive.',
								'jetpack-monetize'
							) }
							{ ...errorProps( codeError ) }
						/>
						<div className="jp-monetize-payments__prices">
							<SelectControl
								disabled={ isPending }
								label={ __( 'Discount type', 'jetpack-monetize' ) }
								items={ typeItems }
								value={ typeItems.find( item => item.value === form.discountType ) ?? null }
								onValueChange={ onTypeChange }
							/>
							{ form.discountType === 'amount' && (
								<SelectControl
									label={ __( 'Currency', 'jetpack-monetize' ) }
									items={ currencyItems }
									value={ currencyItems.find( item => item.value === form.currency ) ?? null }
									onValueChange={ onCurrencyChange }
									disabled={ isPending || currencyItems.length < 2 }
								/>
							) }
							<InputControl
								disabled={ isPending }
								type="number"
								min={ 1 }
								max={ form.discountType === 'percentage' ? 100 : undefined }
								step={ 1 }
								label={
									form.discountType === 'percentage'
										? __( 'Percentage off', 'jetpack-monetize' )
										: __( 'Amount off', 'jetpack-monetize' )
								}
								suffix={
									form.discountType === 'percentage' ? (
										<InputLayout.Slot>%</InputLayout.Slot>
									) : undefined
								}
								value={ form.discount }
								onValueChange={ onDiscountChange }
								{ ...errorProps( discountError ) }
							/>
						</div>
						<div className="jp-monetize-payments__prices">
							<InputControl
								disabled={ isPending }
								type="date"
								label={ __( 'Start date', 'jetpack-monetize' ) }
								value={ form.startDate }
								onValueChange={ onStartDateChange }
								{ ...errorProps( startDateError ) }
							/>
							<InputControl
								disabled={ isPending }
								type="date"
								label={ __( 'Expiration date (optional)', 'jetpack-monetize' ) }
								value={ form.endDate }
								onValueChange={ onEndDateChange }
								{ ...errorProps( endDateError ) }
							/>
						</div>
						<SelectControl
							disabled={ isPending }
							label={ __( 'Duration', 'jetpack-monetize' ) }
							items={ durationItems }
							value={ durationItems.find( item => item.value === form.duration ) ?? null }
							onValueChange={ onDurationChange }
							description={ __(
								'How long the discount lasts on a subscription once it’s applied.',
								'jetpack-monetize'
							) }
						/>
						<SearchableChipSelectControl
							disabled={ isPending }
							label={ __( 'Plans', 'jetpack-monetize' ) }
							items={ planItems }
							value={ selectedPlans }
							onValueChange={ onPlansChange }
							description={ __( 'Leave empty to apply it to every plan.', 'jetpack-monetize' ) }
							details={
								missingPlans.length > 0 && (
									<ValidityIndicator
										type="invalid"
										message={
											missingPlans.length === form.planIds.length
												? __(
														'Remove the unavailable plans to save the coupon. With no plans selected, it applies to every plan.',
														'jetpack-monetize'
													)
												: __(
														'Remove the unavailable plans to save the coupon.',
														'jetpack-monetize'
													)
										}
									/>
								)
							}
						/>
						<InputControl
							disabled={ isPending }
							label={ __( 'Limit to specific emails (optional)', 'jetpack-monetize' ) }
							value={ form.emails }
							onValueChange={ onEmailsChange }
							description={ __(
								'Separate emails with commas. Use * to match part of an email, e.g. *@university.edu.',
								'jetpack-monetize'
							) }
							{ ...errorProps( emailsError ) }
						/>
						<InputControl
							disabled={ isPending }
							type="number"
							min={ 1 }
							step={ 1 }
							label={ __( 'Usage limit (optional)', 'jetpack-monetize' ) }
							value={ form.limitPerUser }
							onValueChange={ onLimitChange }
							description={ __(
								'How many times each customer can use this coupon. Leave empty for no limit.',
								'jetpack-monetize'
							) }
							{ ...errorProps( limitError ) }
						/>
						<SwitchControl
							disabled={ isPending }
							label={ __( 'Cannot be combined with other coupons', 'jetpack-monetize' ) }
							checked={ ! form.canBeCombined }
							onCheckedChange={ onCannotCombineChange }
						/>
						<SwitchControl
							disabled={ isPending }
							label={ __( 'Eligible for first-time order only', 'jetpack-monetize' ) }
							checked={ form.firstTimeOnly }
							onCheckedChange={ onFirstTimeChange }
						/>
						{ isError && (
							<Notice.Root intent="error">
								<Notice.Description>
									{ error.message ||
										__( 'The coupon could not be saved. Please try again.', 'jetpack-monetize' ) }
								</Notice.Description>
							</Notice.Root>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" tone="neutral" onClick={ onClose } disabled={ isPending }>
						{ __( 'Cancel', 'jetpack-monetize' ) }
					</Button>
					<Button onClick={ onSave } disabled={ ! canSave } loading={ isPending }>
						{ __( 'Save', 'jetpack-monetize' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
