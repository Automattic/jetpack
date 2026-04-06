import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME, VALID_SECTIONS } from '../constants';
import useGenerateAll from '../hooks/use-generate-all';
import { AI_STORE_NAME } from '../store';

export default function SuggestAllButton() {
	const { generate, loading } = useGenerateAll();

	const allGuidelines = useSelect( select => {
		const store = select( STORE_NAME );
		return Object.fromEntries(
			VALID_SECTIONS.map( slug => [ slug, store.getGuideline( slug ) ] )
		);
	}, [] );

	const allEmpty = VALID_SECTIONS.every( slug => ! allGuidelines[ slug ] );
	const hasSuggestions = useSelect(
		select => VALID_SECTIONS.some( slug => select( AI_STORE_NAME ).hasSuggestion( slug ) ),
		[]
	);

	const label = allEmpty
		? __( 'Generate guidelines', 'jetpack' )
		: __( 'Improve guidelines', 'jetpack' );

	// Hide via display:none (not null) so the component stays mounted — returning null
	// from a DOM-injected React root prevented re-rendering when loading started.
	const bannerVisible = allEmpty && ! hasSuggestions && ! loading;
	const hiddenProps = bannerVisible
		? { style: { display: 'none' }, 'aria-hidden': true }
		: {};

	return (
		<Button
			{ ...hiddenProps }
			variant="primary"
			icon={ <JetpackLogo size={ 8 } /> }
			onClick={ generate }
			disabled={ loading }
			accessibleWhenDisabled
			isBusy={ loading }
			className="jetpack-content-guidelines-ai__suggest-all-button"
		>
			{ label }
		</Button>
	);
}
