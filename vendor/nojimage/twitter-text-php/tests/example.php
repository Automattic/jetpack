<?php

/**
 * Examples for the Twitter Text (PHP Edition) Library.
 *
 * Can be run on command line or in the browser.
 *
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 */

if (!defined('E_DEPRECATED')) {
    define('E_DEPRECATED', 8192);
}
error_reporting(E_ALL | E_STRICT | E_DEPRECATED);

$ROOT = dirname(dirname(__FILE__));

require_once $ROOT . '/vendor/autoload.php';

$browser = (PHP_SAPI != 'cli');

function print_array(array $a)
{
    $p = print_r($a, true);
    $p = str_replace('  ', ' ', $p);
    echo preg_replace(array(
        '!^Array\s+\(\s+!',
        '!=> Array\s+\(!',
        '!  (\[\d|\))!',
        '!\s+\)\s*$!',
        ), array(
        '  ', '=> (', '\1', '',
        ), $p);
}
$text = 'Tweet mentioning @mikenz and referring to his list @mikeNZ/sports and website http://mikenz.geek.nz #awesome';

if ($browser) {
    echo <<<EOHTML
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html lang="en-GB" xml:lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
<title>Twitter Text (PHP Edition) Library » Examples</title>
<style type="text/css">
<!--/*--><![CDATA[/*><!--*/
body {
  font-family: Arial, sans-serif;
  font-size: 12px;
}
.source, .markup, .output {
  margin-left: 20px;
  width: 900px;
  -moz-border-radius: 8px;
  -khtml-border-radius: 8px;
  -webkit-border-radius: 8px;
  border-radius: 8px;
}
.source {
  background: #eee;
  border: solid 1px #ddd;
  padding: 0 20px;
}
.markup {
  background: #efe;
  border: solid 1px #ded;
  padding: 20px;
  white-space: pre-wrap;
}
.output {
  background: #fed;
  border: solid 1px #edc;
  padding: 20px;
}
/*]]>*/-->
</style>
</head>
<body>
EOHTML;
}

if ($browser) {
    echo '<h1>';
}
echo 'Twitter Text (PHP Edition) Library » Examples';
if ($browser) {
    echo '</h1>';
} else {
    echo PHP_EOL, '============================================', PHP_EOL;
}
echo PHP_EOL;

if ($browser) {
    echo '<h2>';
}
echo 'Extraction Examples';
if ($browser) {
    echo '</h2>';
} else {
    echo PHP_EOL, '-------------------', PHP_EOL;
}
echo PHP_EOL;

$code = <<<EOPHP
<?php
\$text = 'Tweet mentioning @mikenz and referring to his list @mikeNZ/sports and website http://mikenz.geek.nz #awesome';
\$data = \\Twitter\\Text\\Extractor::create()
  ->extract(\$text);
print_r(\$data);
EOPHP;
if ($browser) {
    echo '<h3>Source</h3>', PHP_EOL;
    echo '<pre class="source">';
    highlight_string($code);
    echo '</pre>', PHP_EOL;
} else {
    echo 'Source:', PHP_EOL, PHP_EOL;
    echo $code;
    echo PHP_EOL, PHP_EOL;
}

$data = \Twitter\Text\Extractor::create()
    ->extract($text);

if ($browser) {
    echo '<h3>Output</h3>', PHP_EOL;
    echo '<pre class="output">';
    print_r($data);
    echo '</pre>', PHP_EOL;
} else {
    echo 'Output:', PHP_EOL, PHP_EOL;
    print_r($data);
    echo PHP_EOL, PHP_EOL;
}

if ($browser) {
    echo '<h2>';
}
echo 'Autolink Examples';
if ($browser) {
    echo '</h2>';
} else {
    echo PHP_EOL, '-----------------', PHP_EOL;
}
echo PHP_EOL;

$code = <<<EOPHP
<?php
\$text = 'Tweet mentioning @mikenz and referring to his list @mikeNZ/sports and website http://mikenz.geek.nz #awesome';
\$html = \\Twitter\\Text\\Autolink::create()
  ->setNoFollow(false)
  ->autoLink(\$text);
echo \$html;
EOPHP;
if ($browser) {
    echo '<h3>Source</h3>', PHP_EOL;
    echo '<pre class="source">';
    highlight_string($code);
    echo '</pre>', PHP_EOL;
} else {
    echo 'Source:', PHP_EOL, PHP_EOL;
    echo $code;
    echo PHP_EOL, PHP_EOL;
}

$html = \Twitter\Text\Autolink::create()
    ->setNoFollow(false)
    ->autoLink($text);

if ($browser) {
    echo '<h3>Markup</h3>', PHP_EOL;
    echo '<pre class="markup"><code>';
    echo htmlspecialchars($html, ENT_QUOTES, 'UTF-8', false);
    echo '</code></pre>', PHP_EOL;
} else {
    echo 'Markup:', PHP_EOL, PHP_EOL;
    echo wordwrap(htmlspecialchars($html, ENT_QUOTES, 'UTF-8', false));
    echo PHP_EOL, PHP_EOL;
}

if ($browser) {
    echo '<h3>Output</h3>', PHP_EOL;
    echo '<div class="output">';
    echo $html;
    echo '</div>', PHP_EOL;
} else {
    echo 'Output:', PHP_EOL, PHP_EOL;
    echo wordwrap($html);
    echo PHP_EOL, PHP_EOL;
}

if ($browser) {
    echo '<h2>';
}
echo 'Hit Highlighter Examples';
if ($browser) {
    echo '</h2>';
} else {
    echo PHP_EOL, '------------------------', PHP_EOL;
}
echo PHP_EOL;

$code = <<<EOPHP
<?php
\$text = 'Tweet mentioning @mikenz and referring to his list @mikeNZ/sports and website http://mikenz.geek.nz #awesome';
\$hits  = array(array(70, 77), array(101, 108));
\$html = \\Twitter\\Text\\HitHighlighter::create()
  ->highlight(\$text, \$hits);
echo \$html;
EOPHP;
if ($browser) {
    echo '<h3>Source</h3>', PHP_EOL;
    echo '<pre class="source">';
    highlight_string($code);
    echo '</pre>', PHP_EOL;
} else {
    echo 'Source:', PHP_EOL, PHP_EOL;
    echo $code;
    echo PHP_EOL, PHP_EOL;
}

$html = \Twitter\Text\HitHighlighter::create()
    ->highlight($text, array(array(70, 77), array(101, 108)));

if ($browser) {
    echo '<h3>Markup</h3>', PHP_EOL;
    echo '<pre class="markup"><code>';
    echo htmlspecialchars($html, ENT_QUOTES, 'UTF-8', false);
    echo '</code></pre>', PHP_EOL;
} else {
    echo 'Markup:', PHP_EOL, PHP_EOL;
    echo wordwrap(htmlspecialchars($html, ENT_QUOTES, 'UTF-8', false));
    echo PHP_EOL, PHP_EOL;
}

if ($browser) {
    echo '<h3>Output</h3>', PHP_EOL;
    echo '<div class="output">';
    echo $html;
    echo '</div>', PHP_EOL;
} else {
    echo 'Output:', PHP_EOL, PHP_EOL;
    echo wordwrap($html);
    echo PHP_EOL, PHP_EOL;
}

if ($browser) {
    echo <<<EOHTML
</body>
</html>
EOHTML;
}
