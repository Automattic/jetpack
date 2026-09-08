import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { ModuleItem } from './module-item';
import styles from './styles.module.scss';
import { useOtherModules } from './use-other-modules';

/**
 * The More features content component.
 *
 * Everything the legacy Modules screen lists that the Features tab does not already
 * cover. Shown as its own tab while the shape is being explored; the intent is for it
 * to sit under the feature list behind a "More features" control, and for each of
 * these to eventually move inside the feature that owns it.
 *
 * @return The rendered component.
 */
export function MoreFeaturesContent() {
	const { modules, isLoading } = useOtherModules();

	if ( isLoading ) {
		return null;
	}

	return (
		<section className={ styles.content }>
			<Text variant="body-sm" className={ styles.intro }>
				{ __(
					'Smaller features that do not yet belong to one of the main features above.',
					'jetpack-my-jetpack'
				) }
			</Text>

			<Stack direction="column" className={ styles[ 'module-list' ] }>
				{ modules.map( item => (
					<ModuleItem key={ item.module } module={ item } />
				) ) }
			</Stack>
		</section>
	);
}
