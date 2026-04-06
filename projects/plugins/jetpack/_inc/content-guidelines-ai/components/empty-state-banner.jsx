import { Card, CardBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import SuggestAllButton from './suggest-all-button';

export default function EmptyStateBanner() {
	const allEmpty = useSelect( select => {
		const store = select( STORE_NAME );
		return VALID_SECTIONS.every( slug => ! store.getGuideline( slug ) );
	}, [] );

	if ( ! allEmpty ) {
		return null;
	}

	return (
		<Card className="jetpack-content-guidelines-ai__banner">
			<CardBody>
				<p className="jetpack-content-guidelines-ai__banner-text">
					{ __(
						'Let Jetpack analyze your site content and generate guidelines for you.',
						'jetpack'
					) }
				</p>
				<SuggestAllButton />
			</CardBody>
		</Card>
	);
}
