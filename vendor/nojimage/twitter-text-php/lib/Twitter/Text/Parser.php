<?php

/**
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */

namespace Twitter\Text;

/**
 * Twitter Text Parser
 *
 * @author    Takashi Nojima
 * @copyright Copyright 2018, Takashi Nojima
 * @license   http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package   Twitter.Text
 */
class Parser
{
    /**
     * @var Configuration
     */
    private $config;

    /**
     * Create a Parser
     *
     * @param Configuration $config
     * @return Parser
     */
    public static function create(Configuration $config = null)
    {
        return new self($config);
    }

    /**
     * construct
     *
     * @param Configuration $config
     */
    public function __construct(Configuration $config = null)
    {
        if ($config === null) {
            $config = new Configuration();
        }

        $this->config = $config;
    }

    /**
     * Parses a given tweet text with the weighted character count configuration
     *
     * @param string $tweet which is to be parsed
     * @return ParseResults
     */
    public function parseTweet($tweet)
    {
        if ($tweet === null || '' === $tweet) {
            return new ParseResults();
        }

        $normalizedTweet = StringUtils::normalizeFromNFC($tweet);
        $normalizedTweetLength = StringUtils::strlen($normalizedTweet);

        $emojiParsingEnabled = $this->config->getEmojiParsingEnabled();
        $maxWeightedTweetLength = $this->config->getScaledMaxWeightedTweetLength();
        $transformedUrlWeight = $this->config->getScaledTransformedURLLength();

        $extractor = new Extractor();
        $urlEntitiesMap = $this->transformEntitiesToHash($extractor->extractURLsWithIndices($normalizedTweet));
        $emojiEntitiesMap = $emojiParsingEnabled
            ? $this->transformEntitiesToHash($extractor->extractEmojiWithIndices($normalizedTweet))
            : array();

        $hasInvalidCharacters = false;
        $weightedCount = 0;
        $offset = 0;
        $displayOffset = 0;
        $validOffset = 0;

        while ($offset < $normalizedTweetLength) {
            if (isset($urlEntitiesMap[$offset])) {
                list($urlStart, $urlEnd) = $urlEntitiesMap[$offset]['indices'];
                $urlLength = $urlEnd - $urlStart;

                $weightedCount += $transformedUrlWeight;
                $offset += $urlLength;
                $displayOffset += $urlLength;
                if ($weightedCount <= $maxWeightedTweetLength) {
                    $validOffset += $urlLength;
                }
            } elseif ($emojiParsingEnabled && isset($emojiEntitiesMap[$offset])) {
                $emoji = $emojiEntitiesMap[$offset]['emoji'];
                $emojiLength = StringUtils::strlen($emoji);
                $charCount = StringUtils::charCount($emoji);

                $weightedCount += $this->config->defaultWeight;
                $offset += $emojiLength;
                $displayOffset += $charCount;
                if ($weightedCount <= $maxWeightedTweetLength) {
                    $validOffset += $charCount;
                }
            } else {
                $char =  StringUtils::substr($normalizedTweet, $offset, 1);

                $hasInvalidCharacters = $hasInvalidCharacters || $this->hasInvalidCharacters($char);
                $charCount = StringUtils::strlen($char);
                $charWidth = StringUtils::isSurrogatePair($char) ? 2 : 1;

                $weightedCount += $this->getCharacterWeight($char, $this->config);
                $offset += $charCount;
                $displayOffset += $charWidth;

                if (!$hasInvalidCharacters && $weightedCount <= $maxWeightedTweetLength) {
                    $validOffset += $charWidth;
                }
            }
        }

        $scaledWeightedLength = $weightedCount / $this->config->scale;
        $permillage = $scaledWeightedLength * 1000 / $this->config->maxWeightedTweetLength;
        $isValid = !$hasInvalidCharacters && $weightedCount <= $maxWeightedTweetLength;

        $normalizedTweetOffset = StringUtils::strlen($tweet) - $normalizedTweetLength;
        $displayTextRange = array(0, $displayOffset + $normalizedTweetOffset - 1);
        $validTextRange = array(0, $validOffset + $normalizedTweetOffset - 1);

        return new ParseResults($scaledWeightedLength, $permillage, $isValid, $displayTextRange, $validTextRange);
    }

    /**
     * Convert to Hash by indices start
     *
     * @param array $entities
     * @return array
     */
    private function transformEntitiesToHash(array $entities)
    {
        return array_reduce($entities, function ($map, $entity) {
            $map[$entity['indices'][0]] = $entity;

            return $map;
        }, array());
    }

    /**
     * Get the character weight from ranges
     *
     * @param string $char the Character
     * @param Configuration $config the parse configuration
     * @return int
     */
    private function getCharacterWeight($char, Configuration $config)
    {
        $codePoint = StringUtils::ord($char);

        foreach ($config->ranges as $range) {
            if ($this->inRange($codePoint, $range)) {
                return $range['weight'];
            }
        }

        return $config->defaultWeight;
    }

    /**
     * check codepoint in range
     *
     * @param int $codePoint
     * @param array $range
     * @return boolean
     */
    private function inRange($codePoint, array $range)
    {
        return ($codePoint >= $range['start'] && $codePoint <= $range['end']);
    }

    /**
     * check has invalid characters
     *
     * @param string $char
     * @return bool
     */
    private function hasInvalidCharacters($char)
    {
        return preg_match(Regex::getInvalidCharactersMatcher(), $char);
    }
}
