<?php

require 'extra.php';
require 'gfm.php';
$parser = new WPCom_GHF_Markdown_Parser;

$text1 = <<<EOD
I am just back\slashing up a *storm* \*mofo*.

EOD;

$text = 'Just rockin in the *free* world

```html
<html lang="en">
</html>
```
';
#echo $text;
echo $parser->transform( $text );
echo "\n\n\n";
#echo $parser->hashBlock( '<pre>foobar</pre>' );


$foo = <<<EOD
Here is a *list* with things:

* some `code` is better than others
* **my** code is better than *yours*
* the best code is that which need not be written

Selah.
EOD;
