<?php

/**
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright 2014, php-tips.com
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text\TestCase;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;
use Twitter\Text\Autolink;
use Twitter\Text\Configuration;
use Twitter\Text\Extractor;
use Twitter\Text\HitHighlighter;
use Twitter\Text\Parser;
use Twitter\Text\Validator;

/**
 * A TestCase for the different internal encoding with UTF-8
 *
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @author     Takashi Nojima
 * @copyright  Copyright 2014, Mike Cochrane, Nick Pope, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 * @property Autolink $linker
 * @property Extractor $extractor
 * @property HitHighlighter $highlighter
 * @property Validator $validator
 * @property Parser $parser
 */
class InternalEncodingTest extends TestCase
{
    protected function setUp()
    {
        parent::setUp();
        mb_internal_encoding('iso-8859-1');
        $this->linker = new Autolink();
        $this->linker->setNoFollow(false)->setExternal(false)->setTarget('');
        $this->extractor = new Extractor();
        $this->highlighter = new HitHighlighter();
        $this->validator = new Validator();
        $this->parser = new Parser();
    }

    protected function tearDown()
    {
        unset($this->linker);
        mb_internal_encoding('UTF-8');
        parent::tearDown();
    }

    /**
     * A helper function for providers.
     *
     * @param string $type  The test to fetch data from.
     * @param string $test  The test to fetch data for.
     * @return array  The test data to provide.
     */
    protected function providerHelper($type, $test)
    {
        $yamlParseMethod = 'parseFile';
        if (!method_exists('\Symfony\Component\Yaml\Yaml', $yamlParseMethod)) {
            $yamlParseMethod = 'parse';
        }
        $data = Yaml::$yamlParseMethod(DATA . '/' . $type . '.yml');

        return isset($data['tests'][$test]) ? $data['tests'][$test] : array();
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkUsernamesProvider
     */
    public function testAutoLinkUsernames($description, $text, $expected)
    {
        $linked = $this->linker->autoLinkUsernamesAndLists($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkUsernamesProvider()
    {
        return $this->providerHelper('autolink', 'usernames');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkListsProvider
     */
    public function testAutoLinkLists($description, $text, $expected)
    {
        $linked = $this->linker->autoLinkUsernamesAndLists($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkListsProvider()
    {
        return $this->providerHelper('autolink', 'lists');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkHashtagsProvider
     */
    public function testAutoLinkHashtags($description, $text, $expected)
    {
        $linked = $this->linker->autoLinkHashtags($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkHashtagsProvider()
    {
        return $this->providerHelper('autolink', 'hashtags');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkURLsProvider
     */
    public function testAutoLinkURLs($description, $text, $expected)
    {
        $linked = $this->linker->autoLinkURLs($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkURLsProvider()
    {
        return $this->providerHelper('autolink', 'urls');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkCashtagsProvider
     */
    public function testAutoLinkCashtags($description, $text, $expected)
    {
        $linked = $this->linker->autoLinkCashtags($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkCashtagsProvider()
    {
        return $this->providerHelper('autolink', 'cashtags');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkProvider
     */
    public function testAutoLinks($description, $text, $expected)
    {
        $linked = $this->linker->autoLink($text);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkProvider()
    {
        return $this->providerHelper('autolink', 'all');
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkWithJSONProvider
     */
    public function testAutoLinkWithJSONByObj($description, $text, $jsonText, $expected)
    {
        $jsonObj = json_decode($jsonText);

        $linked = $this->linker->autoLinkWithJson($text, $jsonObj);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     * @group encoding
     * @group Autolink
     * @dataProvider  autoLinkWithJSONProvider
     */
    public function testAutoLinkWithJSONByArray($description, $text, $jsonText, $expected)
    {
        $jsonArray = json_decode($jsonText, true);

        $linked = $this->linker->autoLinkWithJson($text, $jsonArray);
        $this->assertSame($expected, $linked, $description);
    }

    /**
     *
     */
    public function autoLinkWithJSONProvider()
    {
        return $this->providerHelper('autolink', 'json');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractMentionedScreennamesProvider
     */
    public function testExtractMentionedScreennames($description, $text, $expected)
    {
        $extracted = $this->extractor->extractMentionedScreennames($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractMentionedScreennamesProvider()
    {
        return $this->providerHelper('extract', 'mentions');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractMentionsWithIndicesProvider
     */
    public function testExtractMentionedScreennamesWithIndices($description, $text, $expected)
    {
        $extracted = $this->extractor->extractMentionedScreennamesWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractMentionsWithIndicesProvider()
    {
        return $this->providerHelper('extract', 'mentions_with_indices');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractMentionsOrListsWithIndicesProvider
     */
    public function testExtractMentionsOrListsWithIndices($description, $text, $expected)
    {
        $extracted = $this->extractor->extractMentionsOrListsWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractMentionsOrListsWithIndicesProvider()
    {
        return $this->providerHelper('extract', 'mentions_or_lists_with_indices');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractReplyScreennameProvider
     */
    public function testExtractReplyScreenname($description, $text, $expected)
    {
        $extracted = $this->extractor->extractReplyScreenname($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractReplyScreennameProvider()
    {
        return $this->providerHelper('extract', 'replies');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractURLsProvider
     */
    public function testExtractURLs($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLs($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractURLsProvider()
    {
        return $this->providerHelper('extract', 'urls');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractURLsWithIndicesProvider
     */
    public function testExtractURLsWithIndices($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLsWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractURLsWithIndicesProvider()
    {
        return $this->providerHelper('extract', 'urls_with_indices');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractURLsWithDirectionalMarkersProvider
     */
    public function testExtractWithDirectionalMarkers($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLsWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractURLsWithDirectionalMarkersProvider()
    {
        return $this->providerHelper('extract', 'urls_with_directional_markers');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractTcoUrlsWithParamsProvider
     */
    public function testExtractTcoUrlsWithParams($description, $text, $expected)
    {
        $extracted = $this->extractor->extractURLs($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractTcoUrlsWithParamsProvider()
    {
        return $this->providerHelper('extract', 'tco_urls_with_params');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractHashtagsProvider
     */
    public function testExtractHashtags($description, $text, $expected)
    {
        $extracted = $this->extractor->extractHashtags($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractHashtagsProvider()
    {
        return $this->providerHelper('extract', 'hashtags');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractHashtagsFromAstralProvider
     */
    public function testExtractHashtagsFromAstral($description, $text, $expected)
    {
        $extracted = $this->extractor->extractHashtags($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractHashtagsFromAstralProvider()
    {
        return $this->providerHelper('extract', 'hashtags_from_astral');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractHashtagsWithIndicesProvider
     */
    public function testExtractHashtagsWithIndices($description, $text, $expected)
    {
        $extracted = $this->extractor->extractHashtagsWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractHashtagsWithIndicesProvider()
    {
        return $this->providerHelper('extract', 'hashtags_with_indices');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractCashtagsProvider
     */
    public function testExtractCashtags($description, $text, $expected)
    {
        $extracted = $this->extractor->extractCashtags($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractCashtagsProvider()
    {
        return $this->providerHelper('extract', 'cashtags');
    }

    /**
     * @group encoding
     * @group Extractor
     * @dataProvider  extractCashtagsWithIndicesProvider
     */
    public function testExtractCashtagsWithIndices($description, $text, $expected)
    {
        $extracted = $this->extractor->extractCashtagsWithIndices($text);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function extractCashtagsWithIndicesProvider()
    {
        return $this->providerHelper('extract', 'cashtags_with_indices');
    }

    /**
     * @group encoding
     * @group HitHighlighter
     * @dataProvider  highlightProvider
     */
    public function testHighlight($description, $text, $hits, $expected)
    {
        $extracted = $this->highlighter->highlight($text, $hits);
        $this->assertSame($expected, $extracted, $description);
    }

    /**
     *
     */
    public function highlightProvider()
    {
        $plainText = $this->providerHelper('hit_highlighting', 'plain_text');
        $withLinks = $this->providerHelper('hit_highlighting', 'with_links');

        return array_merge($plainText, $withLinks);
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidTweetTextProvider
     */
    public function testV1TweetValidity($description, $text, $expected)
    {
        $validated = $this->validator->isValidTweetText($text, Configuration::v1());
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidTweetTextProvider()
    {
        return $this->providerHelper('validate', 'tweets');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidUsernameProvider
     */
    public function testIsValidUsername($description, $text, $expected)
    {
        $validated = $this->validator->isValidUsername($text);
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidUsernameProvider()
    {
        return $this->providerHelper('validate', 'usernames');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidListProvider
     */
    public function testIsValidList($description, $text, $expected)
    {
        $validated = $this->validator->isValidList($text);
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidListProvider()
    {
        return $this->providerHelper('validate', 'lists');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidHashtagProvider
     */
    public function testIsValidHashtag($description, $text, $expected)
    {
        $validated = $this->validator->isValidHashtag($text);
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidHashtagProvider()
    {
        return $this->providerHelper('validate', 'hashtags');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidURLProvider
     */
    public function testIsValidURL($description, $text, $expected)
    {
        $validated = $this->validator->isValidURL($text);
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidURLProvider()
    {
        return $this->providerHelper('validate', 'urls');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider  isValidURLWithoutProtocolProvider
     */
    public function testIsValidURLWithoutProtocol($description, $text, $expected)
    {
        $validated = $this->validator->isValidURL($text, true, false);
        $this->assertSame($expected, $validated, $description);
    }

    /**
     *
     */
    public function isValidURLWithoutProtocolProvider()
    {
        return $this->providerHelper('validate', 'urls_without_protocol');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider getWeightedTweetsCounterTestProvider
     */
    public function testGetWeightedTweetsCounter($description, $text, $expected)
    {
        $parser = new Parser(Configuration::v2());
        $result = $parser->parseTweet($text);
        $this->assertSame($expected, $result->toArray(), $description);
    }

    /**
     *
     */
    public function getWeightedTweetsCounterTestProvider()
    {
        return $this->providerHelper('validate', 'WeightedTweetsCounterTest');
    }

    /**
     * @group encoding
     * @group Validation
     * @dataProvider getWeightedTweetsWithDiscountedEmojiCounterTestProvider
     */
    public function testGetWeightedTweetsWithDiscountedEmojiCounter($description, $text, $expected)
    {
        $result = $this->parser->parseTweet($text);
        $this->assertSame($expected, $result->toArray(), $description);
    }

    /**
     *
     */
    public function getWeightedTweetsWithDiscountedEmojiCounterTestProvider()
    {
        return $this->providerHelper('validate', 'WeightedTweetsWithDiscountedEmojiCounterTest');
    }
}
