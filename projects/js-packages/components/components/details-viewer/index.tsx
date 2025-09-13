import styles from './styles.module.scss';

/**
 * Converts a camelCase string to snake_case
 *
 * @param {string} str - The camelCase string to convert
 * @return {string} The snake_case string
 */
const camelToSnakeCase = str => {
	return str.replace( /[A-Z]/g, letter => `_${ letter.toLowerCase() }` );
};

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 *
 * @param {object} obj - The object to convert
 * @return {object} A new object with all keys converted to snake_case
 */
const convertObjectKeysToSnakeCase = obj => {
	if ( obj === null || typeof obj !== 'object' ) {
		return obj;
	}

	if ( Array.isArray( obj ) ) {
		return obj.map( item => convertObjectKeysToSnakeCase( item ) );
	}

	return Object.entries( obj ).reduce( ( result, [ key, value ] ) => {
		const snakeKey = camelToSnakeCase( key );
		result[ snakeKey ] = convertObjectKeysToSnakeCase( value );
		return result;
	}, {} );
};

/**
 * Component to display details data from database matches
 *
 * @param {object} props         - Component props
 * @param {object} props.details - The details object containing optionValue and its value
 * @return {import('react').ReactElement} React component
 */
const DetailsViewer = ( { details } ) => {
	if ( ! details || typeof details !== 'object' ) {
		return null;
	}

	return (
		<div className={ styles[ 'details-viewer' ] }>
			{ Object.entries( details ).map( ( [ key, value ] ) => (
				<div key={ key } className={ styles[ 'details-viewer__item' ] }>
					<div className={ styles[ 'details-viewer__key' ] }>{ camelToSnakeCase( key ) }:</div>
					<div className={ styles[ 'details-viewer__value' ] }>
						<pre>
							{ typeof value === 'object' && value !== null
								? JSON.stringify( convertObjectKeysToSnakeCase( value ), null, 2 )
								: String( value ) }
						</pre>
					</div>
				</div>
			) ) }
		</div>
	);
};

export default DetailsViewer;
