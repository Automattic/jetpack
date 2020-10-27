<?php

/**
 * @author     Takashi Nojima
 * @copyright  Copyright 2014, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text;

/**
 * String utility
 *
 * @author     Takashi Nojima
 * @copyright  Copyright 2014, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter
 */
class StringUtils
{

    /**
     * alias of mb_substr
     *
     * @param string $str
     * @param integer $start (character)
     * @param integer $length (character)
     * @param string $encoding
     * @return string
     */
    public static function substr($str, $start, $length = null, $encoding = 'UTF-8')
    {
        if ($length === null) {
            // for PHP <= 5.4.7
            $length = mb_strlen($str, $encoding);
        }
        return mb_substr($str, $start, $length, $encoding);
    }

    /**
     * alias of mb_strlen
     *
     * @param string $str
     * @param string $encoding
     * @return integer
     */
    public static function strlen($str, $encoding = 'UTF-8')
    {
        return mb_strlen($str, $encoding);
    }

    /**
     * alias of mb_strpos
     *
     * @param string $haystack
     * @param string $needle
     * @param integer $offset
     * @param string $encoding
     * @return integer
     */
    public static function strpos($haystack, $needle, $offset = 0, $encoding = 'UTF-8')
    {
        return mb_strpos($haystack, $needle, $offset, $encoding);
    }

    /**
     * A multibyte-aware substring replacement function.
     *
     * @param string  $string       The string to modify.
     * @param string  $replacement  The replacement string.
     * @param int     $start        The start of the replacement.
     * @param int     $length       The number of characters to replace.
     * @param string  $encoding     The encoding of the string.
     *
     * @return string  The modified string.
     *
     * @see http://www.php.net/manual/en/function.substr-replace.php#90146
     */
    public static function substrReplace($string, $replacement, $start, $length = null, $encoding = 'UTF-8')
    {
        $string_length = static::strlen($string, $encoding);
        if ($start < 0) {
            $start = max(0, $string_length + $start);
        } elseif ($start > $string_length) {
            $start = $string_length;
        }
        if ($length < 0) {
            $length = max(0, $string_length - $start + $length);
        } elseif (($length === null) || ($length > $string_length)) {
            $length = $string_length;
        }
        if (($start + $length) > $string_length) {
            $length = $string_length - $start;
        }

        $suffixOffset = $start + $length;
        $suffixLength = $string_length - $start - $length;

        return static::substr($string, 0, $start, $encoding)
            . $replacement
            . static::substr($string, $suffixOffset, $suffixLength, $encoding);
    }

    /**
     * idn_to_ascii wrapper
     *
     * @param string $domain as utf8
     * @return string
     */
    public static function idnToAscii($domain)
    {
        // INTL_IDNA_VARIANT_UTS46 defined PHP 5.4.0 or later
        if (defined('INTL_IDNA_VARIANT_UTS46')) {
            return idn_to_ascii($domain, IDNA_ALLOW_UNASSIGNED, INTL_IDNA_VARIANT_UTS46);
        }

        return idn_to_ascii($domain, IDNA_ALLOW_UNASSIGNED);
    }

    /**
     * normalize text from NFC
     *
     * @param string $text
     * @return string
     */
    public static function normalizeFromNFC($text)
    {
        return normalizer_normalize($text);
    }

    /**
     * get code point
     *
     * @param string $char
     * @param string $encoding
     * @return int
     */
    public static function ord($char, $encoding = 'UTF-8')
    {
        if (mb_strlen($char, $encoding) > 1) {
            $char = mb_substr($char, 0, 1, $encoding);
        }

        return current(unpack('N', mb_convert_encoding($char, 'UCS-4BE', $encoding)));
    }

    /**
     * get code point at
     *
     * @param string $str
     * @param int $offset
     * @param string $encoding
     * @return int
     */
    public static function codePointAt($str, $offset, $encoding = 'UTF-8')
    {
        return static::ord(mb_substr($str, $offset, 1, $encoding), $encoding);
    }

    /**
     * is surrogate pair char
     *
     * @param string $char
     * @return bool
     */
    public static function isSurrogatePair($char)
    {
        return preg_match('/[\\x{10000}-\\x{10FFFF}]/u', $char);
    }

    /**
     * get the character code count
     *
     * @param $string
     * @param string $encoding
     * @return int
     */
    public static function charCount($string, $encoding = 'UTF-8')
    {
        $count = 0;
        $strlen = static::strlen($string);

        for ($offset = 0; $offset < $strlen; $offset++) {
            $char = static::substr($string, $offset, 1, $encoding);
            $count += static::isSurrogatePair($char) ? 2 : 1;
        }

        return $count;
    }
}
