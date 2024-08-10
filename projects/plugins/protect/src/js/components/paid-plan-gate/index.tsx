import { Navigate } from 'react-router-dom';
import useProtectData from '../../hooks/use-protect-data';

/**
 * Paid Plan Gate
 *
 * Custom route that only renders when the user has a paid plan.
 *
 * @param {object}      props          - The component props.
 * @param {JSX.Element} props.children - The component to render if the user has a paid plan.
 * @param {string}      props.redirect - The alternate route to redirect to if the user does not have a paid plan.
 *
 * @returns {JSX.Element} The PaidPlanRoute component.
 */
export default function PaidPlanGate( {
	children,
	redirect = '/',
}: {
	children?: JSX.Element;
	redirect?: string;
} ): JSX.Element {
	const { hasRequiredPlan } = useProtectData();

	if ( ! hasRequiredPlan ) {
		return <Navigate to={ redirect } replace />;
	}

	return children;
}
