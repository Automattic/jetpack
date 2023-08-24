import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { CONNECTION_STORE_ID } from '../../../../../../js-packages/connection';

const useNewsletterCategories = () => {
	const [ data, setData ] = useState( [] );
	const [ error, setError ] = useState( false );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		const blogId = select( CONNECTION_STORE_ID ).getBlogId();

		const fetchData = async () => {
			try {
				const newsLetterCategories = await apiFetch( {
					url: `https://public-api.wordpress.com/wpcom/v2/sites/${ blogId }/newsletter-categories`,
				} );
				setData( newsLetterCategories?.newsletter_categories );
			} catch ( e ) {
				setError( true );
			} finally {
				setLoading( false );
			}
		};

		fetchData();
	}, [] );

	return { data, enabled: data.length, error, loading };
};

export { useNewsletterCategories };
