# Contact Form - Gutenberg Blocks

Contact form Gutenberg Blocks are implemented in JSX and currently depends on using Gutenberg's [5452](https://github.com/WordPress/gutenberg/pull/5452).

Current form is more of a v0.1 library we can expand on to incorporate the original contact form logic.

Development:

* Run `gulp build` initially to create the blocks .js files after that you can run `gulp gutenpack` and `gulp gutenpack:watch` to continue development.
* Set `define('SCRIPT_DEBUG', true)` and `Jetpack_Constants::set_constant('SCRIPT_DEBUG', true)` somewhere to use your local blocks built with gutenpack.

Blocks Available:

* Form - The main block, consists of an InnerBlock for the `<form>` element and a set template consisting of a default set of inner blocks preconfigured as a contact form

* Text - General `<input type=text>`/`<textarea>` field with configurable label, rows

* Button - A `<button type=submit>` with configurable button text

Current state:

* InnerBlock templating requires [5452](https://github.com/WordPress/gutenberg/pull/5452)
* Needs a solution to filtering blocks in the inserter so we can prevent showing form blocks in non form context. Talks of this in [5452](https://github.com/WordPress/gutenberg/pull/5452).
* allowedBlocks solution in [5452](https://github.com/WordPress/gutenberg/pull/5452) is whitelist only meaning we cant add extra blocks in between form elements - not really a huge issue for this but likely an issue for other use cases

Todo

* Integration with grunion-contact-form:
  * Captcha support should be relatively easy to achieve with a serverside rendered block
  * A server side filter / hook could replace the form action
* Handle duplicate field names gracefully:
  * Currently uses a variation on the label / field name to set id / for settings on label / inputs.
  * Currently uses same variation for `<input name="">` attributes