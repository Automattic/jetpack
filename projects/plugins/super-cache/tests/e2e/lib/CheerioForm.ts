import { AnyNode, Cheerio } from 'cheerio';
import { authenticatedRequest } from './plugin-tools';

/**
 * Helper class for reading, updating and submitting HTML forms from a Cheerio DOMs
 */
export default class CheerioForm {
	private readonly fields: Record< string, string > = {};

	constructor( private readonly form: Cheerio< AnyNode > ) {
		for ( const { name, value } of form.serializeArray() ) {
			this.fields[ name ] = value;
		}
	}

	/**
	 * Checks or unchecks a checkbox on the form.
	 *
	 * @param {string} name - Name of the checkbox.
	 * @param {boolean} value - True for check, false for uncheck.
	 */
	public setCheckbox( name: string, value: boolean ): void {
		if ( value ) {
			this.fields[ name ] = this.element( name ).val().toString();
		} else {
			delete this.fields[ name ];
		}
	}

	/**
	 * Submit this form as an authenticated Request, using the given cookie.
	 *
	 * @param {string} authCookie - Auth cookie for form submission.
	 */
	public async submit( authCookie: string ): Promise< void > {
		await authenticatedRequest( authCookie, 'POST', this.form.attr( 'action' ), this.fields );
	}

	private element( name: string ): Cheerio< AnyNode > {
		const element = this.form.find( `input[name=${ name }]` );
		if ( ! element ) {
			throw new Error( `Could not find element with name ${ name }` );
		}

		return element;
	}
}
