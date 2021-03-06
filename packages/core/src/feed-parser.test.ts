import {JSDOM} from 'jsdom';
import {FeedParser} from './feed-parser';
import {expect} from 'chai';
import {describe, it} from 'mocha';
import * as fc from 'fast-check';

describe('FeedParser', () => {

  const toDocument = (markup: string): HTMLDocument => new JSDOM(markup).window.document;

  it('toWords', () => {
    fc.assert(
      fc.property(
        fc.string(0, 500), (text) => {

          expect(Array.isArray(FeedParser.toWords(text))).to.be.true;

        }));
  });

  // it('toAbsoluteUrl', () => {
  //   fc.assert(
  //     fc.property(
  //       fc.webUrl({validSchemes: ['https', ''], withQueryParameters: true, withFragments: true}),
  //       (link) => {
  //
  //         const relativeLink = link.startsWith('://');
  //         if (relativeLink) {
  //           link = link.substring(2);
  //         }
  //
  //         const absolute = new URL(FeedParser.toAbsoluteUrl(new URL('https://example.com/'), link));
  //
  //         if (relativeLink) {
  //           expect(absolute.href.indexOf(link) > -1).to.be.true;
  //         } else {
  //           expect(absolute.href.indexOf(new URL(link).pathname) > -1).to.be.true;
  //         }
  //
  //         // expect(absolute.href.indexOf('//') === absolute.href.lastIndexOf('//')).to.be.true;
  //
  //       }));
  // });

  it('findTextNodesInContext', () => {
    const markup = `<!DOCTYPE html>
<html>
<body>
<div id="context-el">
    <div class="post" itemscope="" itemtype="http://schema.org/BlogPosting">
        <h2 class="title" itemprop="name">
            <a href="https://developers.googleblog.com/2019/12/mpaani-raises-series-from-connections.html"
               itemprop="url">
                mPaani raises Series A from connections made at Google's accelerator
            </a>
        </h2>
        <div class="post-header">
            <div class="published">
                <span class="publishdate" itemprop="datePublished">Monday, December 16, 2019</span>
            </div>
        </div>
        <div class="post-body">
            <div class="post-content post-summary">
                <em>Jen Harvey, Head of Marketing, Google Developers Launchpad</em>
                <br>
                <p>
                    Google Developers Launchpad is an accelerator program that excels in helping startups solve the
                    world???s biggest problems through the best of Google, with a focus on advanced technology. However
                    our impact doesn???t stop there. A distinguishing aspect of our program is the network that we build
                    with, and for, our founders. Over the past five years, Launchpad has created a global community of
                    founders based on deep, genuine connections that we foster during the program, and that community
                    supports one another in remarkable ways.
                </p><a href="https://developers.googleblog.com/2019/12/mpaani-raises-series-from-connections.html"
                       class="read-more">Read More</a></div>
            <div class="post-content post-original" itemprop="articleBody">
                <em>Jen Harvey, Head of Marketing, Google Developers Launchpad</em>
                <br>
                <p>
                    Google Developers Launchpad is an accelerator program that excels in helping startups solve the
                    world???s biggest problems through the best of Google, with a focus on advanced technology. However
                    our impact doesn???t stop there. A distinguishing aspect of our program is the network that we build
                    with, and for, our founders. Over the past five years, Launchpad has created a global community of
                    founders based on deep, genuine connections that we foster during the program, and that community
                    supports one another in remarkable ways.
                </p>
            </div>
        </div>
        <div class="jump-link">
            <a class="maia-button maia-button-secondary"
               href="https://developers.googleblog.com/2019/12/mpaani-raises-series-from-connections.html#more">
                Read more ??
            </a>
        </div>
        <div class="comment-container">
            <i class="comment-img material-icons">
                ???
            </i>
        </div>
        <div class="post-footer">
            <a href="https://plus.google.com/112374322230920073195" rel="author">
                Google
            </a>
        </div>
    </div>

</div>
</body>
</html>`;

    const doc = toDocument(markup);
    const context = doc.getElementById('context-el');

    const feedParser = new FeedParser(doc, 'http://example.com', null, null);

    const nodes = feedParser.findTextNodesInContext(context);

    expect(nodes.map(node => node.parentElement.tagName)).to.eql(['A', 'SPAN', 'EM', 'P', 'A', 'EM', 'P', 'A', 'I', 'A']);
  });

  it('relativeXpath', () => {
    const markup = `<tr class="athing comtr " id="25781813"><td>
            <table border="0">  <tbody><tr>    <td class="ind"><img src="s.gif" height="1" width="80"></td><td valign="top" class="votelinks">
      <center><a id="up_25781813" href="https://news.ycombinator.com/vote?id=25781813&amp;how=up&amp;goto=item%3Fid%3D25775872"><div class="votearrow" title="upvote"></div></a></center>    </td><td class="default"><div style="margin-top:2px; margin-bottom:-10px;"><span class="comhead">
          <a href="https://news.ycombinator.com/user?id=jnwatson" class="hnuser">jnwatson</a> <span class="age"><a href="https://news.ycombinator.com/item?id=25781813">1 day ago</a></span> <span id="unv_25781813"></span><span class="par"></span> <a class="togg" n="17" href="javascript:void(0)" onclick="return toggle(event, 25781813)"></a>          <span class="storyon"></span>
                  </span></div><br><div class="comment">
                  <span class="commtext c00">"I'm the idea guy" out of someone's mouth is the stark red-flag warning that their net contribution is 0.</span>
              <div class="reply">        <p><font size="1">
                      <u><a id="foo" href="https://news.ycombinator.com/reply?id=25781813&amp;goto=item%3Fid%3D25775872%2325781813">reply</a></u>
                  </font>
      </p></div></div></td></tr>
      </tbody></table></td></tr>`;
    const doc = toDocument(markup);
    const link = doc.getElementById('foo');

    expect(FeedParser.getRelativeXPath(link, doc.body)).to.eq('//body/table[1]/tbody[1]/tr[1]/td[3]/div[2]/div[1]/p[1]/font[1]/u[1]/a[1]');
  });

  it('generalizeXPathsSimple', () => {
    const xpaths = [
      '//body/table[1]/tbody[1]/tr[1]/td[3]/table[1]/tbody[1]/tr[1]/td[1]/font[1]/a[1]',
      '//body/table[1]/tbody[1]/tr[1]/td[3]/table[1]/tbody[1]/tr[1]/td[1]/font[1]/a[2]',
      '//body/table[1]/tbody[1]/tr[1]/td[3]/table[1]/tbody[1]/tr[1]/td[1]/font[1]/a[3]',
      '//body/table[1]/tbody[1]/tr[1]/td[3]/table[2]/tbody[1]/tr[2]/td[1]/font[1]/a[1]',
      '//body/table[1]/tbody[1]/tr[1]/td[3]/table[2]/tbody[1]/tr[4]/td[1]/font[1]/a[1]'
    ];
    expect(FeedParser.generalizeXPaths(xpaths)).to.eq('//body/table[1]/tbody[1]/tr[1]/td[3]/table/tbody[1]/tr/td[1]/font[1]/a');
  });

  it('generalizeXPathsComplex', () => {
    const xpaths = [
      '//*[@id=\'democracy\']/ul[1]/li[2]',
      '//*[@id=\'democracy\']/ul[1]/li[5]',
      '//*[@id=\'democracy\']/ul[1]/li[9]',
      '//*[@id=\'economy\']/ul[1]/li[1]',
      '//*[@id=\'economy\']/ul[1]/li[8]',
      '//*[@id=\'health\']/ul[1]/li[10]'
    ];
    expect(FeedParser.generalizeXPaths(xpaths)).to.eq('//*[contains(id, \'democracy\') or contains(id, \'economy\') or contains(id, \'health\')]/ul[1]/li');
  });
});
