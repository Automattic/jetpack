import { getSectionState } from '../../data/state';

/**
 * What `Sections\Payments::get_state()` prints.
 */
export interface PaymentsState {
	/** Whether the plan includes donations, premium content or recurring payments. */
	canManagePlans: boolean;
}

/**
 * The Payments state, or one that can't manage plans if PHP printed none.
 *
 * @return The state.
 */
export function getPaymentsState(): PaymentsState {
	return { canManagePlans: false, ...getSectionState< Partial< PaymentsState > >( 'payments' ) };
}
