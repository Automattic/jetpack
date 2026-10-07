// Each kind of filter accepts its own comparison operators.
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
