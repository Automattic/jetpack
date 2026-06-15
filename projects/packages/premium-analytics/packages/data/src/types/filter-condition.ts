/**
 * Filter condition types for API queries
 */

// Different type of filters have different comparison operators
// @see https://github.a8c.com/Automattic/wpcom/tree/72572945acd96d29adf9ea8f38fc3e99c9a4a668/wp-content/rest-api-plugins/endpoints/woocommerce-analytics/Reports/Filter
export type FilterCondition = {
	key: string;
	value: string | string[];
	compare:
		| '='
		| 'IN'
		| 'NOT IN'
		| '!='
		| '>'
		| '<'
		| '>='
		| '<='
		| 'BETWEEN'
		| 'NOT BETWEEN'
		| 'LIKE'
		| 'NOT LIKE';
};
