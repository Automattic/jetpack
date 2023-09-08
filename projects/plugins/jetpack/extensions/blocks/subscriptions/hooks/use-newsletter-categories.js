import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

const useNewsletterCategories = () => {
	const [ data, setData ] = useState( [] );
	const [ enabled, setEnabled ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		const fetchData = async () => {
			try {
				const newsLetterCategories = await apiFetch( {
					path: `/wpcom/v2/newsletter-categories`,
				} );
				setData( newsLetterCategories?.newsletter_categories );
				setEnabled( newsLetterCategories?.enabled ?? false );
			} catch ( e ) {
				setError( true );
			} finally {
				setLoading( false );
			}
		};

		fetchData();
	}, [] );

	return { data, enabled, error, loading };
};

export { useNewsletterCategories };
