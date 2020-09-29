<?php

require dirname(__DIR__) . '/vendor/autoload.php';

$classFile = dirname(__DIR__) . '/lib/Twitter/Text/EmojiRegex.php';
$emojiDataUrl = 'https://www.unicode.org/Public/emoji/12.1/emoji-test.txt';

// --
$emojiData = file($emojiDataUrl);
$emojiCodes = array_map(function ($line) {
    $value = preg_replace('/^([0-9A-F]{4,}(?: [0-9A-F]{4,})*)\s*;.*$/u', '$1', trim($line));

    return explode(' ', $value);
}, array_filter($emojiData, function ($line) {
    return preg_match('/^[0-9A-F]{2}[0-9A-F]{2,}.*; /', $line);
}));

// sort code length, reverse®
usort($emojiCodes, function ($a, $b) {
    $aLength = count($a);
    $bLength = count($b);
    if ($aLength === $bLength) {
        return 0;
    }

    return ($bLength < $aLength) ? -1 : 1;
});

$codeRegexList = array_reduce($emojiCodes, function ($carry, $codes) {
    $carry[] = implode('', array_map(function ($c) {
        return sprintf('\x{%s}', strtolower($c));
    }, $codes));

    return $carry;
}, array());

$regex = implode('|', $codeRegexList);

echo "\n";

// -- modify class file
$classContent = file_get_contents($classFile);
$replacedClassContent = preg_replace('/(\s+const VALID_EMOJI_PATTERN = \')(?:.*)(\';)/', '$1/' . $regex . '/u$2', $classContent);

echo $replacedClassContent;

file_put_contents($classFile, $replacedClassContent);
