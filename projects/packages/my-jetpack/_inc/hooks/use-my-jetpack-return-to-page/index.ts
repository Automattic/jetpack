import { useSearchParams } from 'react-router-dom';

/**
 * Looks at query parameters to determine where the browser should go
 * after a user connection is established. Usually the My Jetpack root
 * is a safe bet, but in some instances (e.g., trying to activate a license),
 * it's easier on people to be sent back to a different page
 * (e.g., the license activation form).
 *
 * @returns {string} the URL of a My Jetpack page that should be displayed after connection.
 */
const useMyJetpackReturnToPage = () => {
	const [ searchParams ] = useSearchParams();

	const returnTo = searchParams.get( 'returnTo' );
	if ( returnTo ) {
		return `admin.php?page=my-jetpack#/${ returnTo }`;
	}

	return `admin.php?page=my-jetpack`;
};

export default useMyJetpackReturnToPage;
