/**
 * Create a random email
 * @return {string} A random email
 */
export function createRandomEmail(): string {
	return `${ Math.random().toString( 36 ).substring( 7 ) }@example.com`;
}
/**
 * Create a random name
 * @return {string} A random name
 */
export function createRandomName(): string {
	return ` ${ Math.random().toString( 36 ).substring( 7 ) } ${ Math.random()
		.toString( 36 )
		.substring( 7 ) }`;
}

const commonWords = [
	'he',
	'a',
	'one',
	'all',
	'an',
	'each',
	'other',
	'many',
	'some',
	'two',
	'more',
	'long',
	'new',
	'little',
	'most',
	'good',
	'great',
	'right',
	'mean',
	'old',
	'any',
	'same',
	'three',
	'small',
	'another',
	'large',
	'big',
	'even',
	'such',
	'different',
	'kind',
	'still',
	'high',
	'every',
	'own',
	'light',
	'left',
	'few',
	'next',
	'hard',
	'both',
	'important',
	'white',
	'four',
	'second',
	'enough',
	'above',
	'young',
];

/**
 * Create a random comment
 * @return {string} A random comment
 */
export function createRandomComment(): string {
	const sentence = [];
	for ( let i = 0; i < 15; i++ ) {
		sentence.push( commonWords[ Math.floor( Math.random() * commonWords.length ) ] );
	}
	return sentence.join( ' ' );
}

/**
 * Instead of the complexity of managing secrets. We can use an empty testing account.
 */
export const testingUser = {
	userId: '243752070',
	username: 'emptyaccountwithoutsites',
	email: 'emptyaccountwithoutsites@gmail.com',
	password: 'Wi^^yN54ee0rNXyBmhHtAO6*',
};
