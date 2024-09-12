# phan-plugins

Phan plugins created for the Jetpack monorepo.

## Usage

Install with

```
composer require --dev automattic/jetpack-phan-plugins
```

Then add reference to the appropriate plugins from `vendor/automattic/jetpack-phan-plugins/src/` into your Phan config `'plugins'` array.

## Plugins

### HtmlTemplatePlugin

An "html template" file is a PHP file that produces a fragment of HTML, loaded by a method or
function call somewhere else in the codebase something like this:

```
function load_template( $name ) {
	$some_var = $this->get_some_var();
	require __DIR__ . "/templates/$name.php";
}
```

Phan will normally evaluate the template as being in the global scope, meaning it doesn't
know about `$this` or `$some_var` and will complain about attempts to access them.

Enter this plugin. First, in a comment at the top of the file (i.e. before any actual code, even `namespace`),
add `@html-template <FQSEN>` (where `<FQSEN>` is like `Namespace\Classname::method_name` or `Namespace\function_name`).
This tells Phan that the file should be interpreted inside the context of the named function or method, including access
to `$this` if appropriate.

Second, in either the template's file comments or the doc comment for the referenced method/function,
include `@html-template-var T $var`, just like `@param` or `@var`, to declare any additional variables
that the method/function provides to the templates it loads.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

phan-plugins is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

