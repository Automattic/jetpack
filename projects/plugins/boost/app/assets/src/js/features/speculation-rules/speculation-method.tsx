import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { z } from 'zod';
import ModuleSubsection from '$features/ui/module-subsection/module-subsection';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useMutationNotice } from '$features/ui/mutation-notice/mutation-notice';
import styles from './speculation-method.module.scss';
import { createInterpolateElement } from '@wordpress/element';
import { getRedirectUrl } from '@automattic/jetpack-components';

const unsafeSpeculationRulesLink = getRedirectUrl( 'jetpack-boost-unsafe-speculation-rules' );

export default function SpeculationFetchMethod() {
	const [ speculationMethod, setSpeculationMethod ] = useDataSync(
		'jetpack_boost_ds',
		'speculation_method',
		z.boolean().catch( false )
	);

	const enabledMessage = __( 'Prerender enabled.', 'jetpack-boost' );
	const disabledMessage = __( 'Prefetch enabled.', 'jetpack-boost' );
	useMutationNotice( 'speculation-method', setSpeculationMethod, {
		successMessage: speculationMethod.data ? enabledMessage : disabledMessage,
	} );

	const handleToggle = ( value: boolean ) => {
		setSpeculationMethod.mutate( value );

		recordBoostEvent( 'speculation_method_toggle', { enabled: Number( value ) } );
	};

	return (
		<ModuleSubsection>
			<div className={ styles.wrapper }>
				<div className={ styles.title }>
					<h4>{ __( 'Use Prerender Instead of Prefetch', 'jetpack-boost' ) }</h4>
					<ToggleControl
						className={ styles[ 'toggle-control' ] }
						checked={ speculationMethod.data }
						onChange={ handleToggle }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
			</div>
			<div className={ styles.description }>
				{ createInterpolateElement(
					__(
						'Prerender fully loads pages in the background, making navigation instant when a user clicks a link. This uses more resources but provides a faster experience than prefetch. However, there are times when prefetch is safer to use. Read more on <link>mdn web docs</link>.',
						'jetpack-boost'
					),
					{
						link: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content
							<a
								onClick={ () => recordBoostEvent( 'unsafe_speculation_rules_link_clicked', {} ) }
								href={ unsafeSpeculationRulesLink }
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
					}
				) }
			</div>
		</ModuleSubsection>
	);
}
