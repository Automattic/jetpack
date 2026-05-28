/**
 * Placeholder — implemented in a later task.
 *
 * @param props           - Component props.
 * @param props.onDismiss - Dismiss handler.
 * @return Placeholder element.
 */
export default function PricingGate( { onDismiss }: { onDismiss: VoidFunction } ): JSX.Element {
	return <button onClick={ onDismiss }>pricing-gate</button>;
}
