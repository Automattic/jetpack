import { Navigate } from 'react-router-dom';
import usePlan from '../../hooks/use-plan';

/**
 * Paid Plan Gate
 *
 * Custom route that only renders when the user has a paid plan.
 *
 * @param {object}      props          - The component props.
 * @param {JSX.Element} props.children - The component to render if the user has a paid plan.
 * @param {string}      props.redirect - The alternate route to redirect to if the user does not have a paid plan.
 *
 * @return {JSX.Element} The PaidPlanRoute component.
 */
export default function PaidPlanGate( {
	children,
	redirect = '/',
}: {
	children?: JSX.Element;
	redirect?: string;
} ): JSX.Element {
	const { hasPlan } = usePlan();

	if ( ! hasPlan ) {
		return <Navigate to={ redirect } replace />;
	}

	return children;
}
