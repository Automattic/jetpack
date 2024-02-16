import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';
import { useState } from 'react';
import { usePageCache } from '$lib/stores/page-cache';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( true );
	const [ query, mutation ] = usePageCache();

	const settings = query?.data;
	const setSettings = mutation.mutate;

	const setLogging = ( newValue: boolean ) => {
		if ( ! setSettings || ! settings ) {
			return;
		}

		setSettings( {
			...settings,
			logging: newValue,
		} );
	};

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.head }>
				<div className={ styles.summary }>
					{ __( 'No exceptions or logging.', 'jetpack-boost' ) }
				</div>
				<div className={ styles.actions }>
					<Button
						variant="link"
						size="small"
						weight="regular"
						iconSize={ 16 }
						icon={ <Lightning /> }
					>
						{ __( 'Clear Cache', 'jetpack-boost' ) }
					</Button>{ ' ' }
					<Button
						variant="link"
						size="small"
						weight="regular"
						iconSize={ 16 }
						icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
						onClick={ () => setIsExpanded( ! isExpanded ) }
					>
						{ __( 'Show Options', 'jetpack-boost' ) }
					</Button>
				</div>
			</div>
			{ isExpanded && (
				<div className={ styles.body }>
					{ settings && (
						<>
							<div className={ styles.section }>
								<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
								<p>
									{ __( 'URLs of pages and posts that will never be cached:', 'jetpack-boost' ) }
								</p>
								<textarea rows={ 3 }></textarea>
								<p className={ styles.description }>
									{ __(
										'Use (*) to address multiple URLs under a given path. Be sure each URL path is in its own line. See an example or learn more.',
										'jetpack-boost'
									) }
								</p>
								<Button>{ __( 'Save', 'jetpack-boost' ) }</Button>
							</div>
							<div className={ styles.section }>
								<div className={ styles.title }>{ __( 'Logging', 'jetpack-boost' ) }</div>
								<label htmlFor="cache-logging">
									<input
										type="checkbox"
										id="cache-logging"
										checked={ settings.logging }
										onChange={ event => setLogging( event.target.checked ) }
									/>{ ' ' }
									{ __( 'Activate logging to track all your cache events.', 'jetpack-boost' ) }
								</label>
							</div>
						</>
					) }
				</div>
			) }
		</div>
	);
};

export default Meta;
