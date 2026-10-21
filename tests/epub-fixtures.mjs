import * as fflate from 'fflate';
export const epubPng = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
const xml = (value) => fflate.strToU8(value);
export function epubEntries({ epub3 = true } = {}) {
  return {
    './META-INF/container.xml': xml(`<?xml version="1.0"?><c:container xmlns:c="urn:oasis:names:tc:opendocument:xmlns:container"><c:rootfiles><c:rootfile media-type = 'application/oebps-package+xml' full-path = 'OPS/package.opf'/></c:rootfiles></c:container>`),
    'OPS/package.opf': xml(`<?xml version="1.0"?>
      <o:package xmlns:o="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" version="3.0">
      <o:metadata><dc:title>Visible Text &amp; Images</dc:title><dc:creator>EPUB Regression</dc:creator></o:metadata>
      <o:manifest>
        <o:item id = 'cover' href = 'Text/cover.xhtml' media-type = 'application/xhtml+xml'/>
        <o:item id = 'note' href = 'Text/note.xhtml' media-type = 'application/xhtml+xml'/>
        <o:item id = 'chapter1' href = 'Text/Chapter%20One.xhtml' media-type = 'application/xhtml+xml'/>
        <o:item id = 'chapter2' href = 'Bonus/Chapter%20One.xhtml' media-type = 'application/xhtml+xml'/>
        <o:item id = 'art' href = 'Images/cover%20art.png' properties = 'cover-image' media-type = 'image/png'/>
        <o:item id = 'illustration' href = 'Images/picture.png' media-type = 'image/png'/>
        ${epub3 ? `<o:item id = 'nav' properties = 'nav' href = 'Nav/nav.xhtml' media-type = 'application/xhtml+xml'/>` : ''}
        <o:item id = 'ncx' href = 'Navigation/toc.ncx' media-type = 'application/x-dtbncx+xml'/>
      </o:manifest>
      <o:spine toc = 'ncx'><o:itemref idref = 'cover'/><o:itemref linear = 'no' idref = 'note'/><o:itemref idref = 'chapter1'/><o:itemref idref = 'chapter2'/></o:spine>
      </o:package>`),
    'OPS/Text/cover.xhtml': xml(`<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Cover</title></head><body epub:type="cover"><img src="../Images/cover%20art.png" alt="Cover art"/></body></html>`),
    'OPS/Text/note.xhtml': xml(`<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Publisher Note</title></head><body><p>Auxiliary publisher note.</p></body></html>`),
    'OPS/Text/Chapter One.xhtml': xml(`<h:html xmlns:h="http://www.w3.org/1999/xhtml"><h:head><h:title>Chapter One</h:title></h:head><h:body>
      <h:style>p { display: none !important; } body { color: transparent; }</h:style>
      <h:h1>Chapter One</h:h1>
      <h:p id="opening" class="hidden" style="display:none; opacity:0; color:black; font-size:0; height:0; position:absolute">The chapter text is finally visible &amp; readable.</h:p>
      <h:p dir="rtl" lang="fa">این متن فارسی باید نمایش داده شود.</h:p>
      <h:p>Ruby: <h:ruby>本<h:rt>ほん</h:rt></h:ruby>. A <h:em>readable</h:em> light novel.</h:p>
      <h:img src="../Images/picture.png" alt="Chapter illustration"/>
      <h:a href="../Bonus/Chapter%20One.xhtml#arrival">Read the second chapter</h:a>
      ${Array.from({ length: 45 }, (_, i) => `<h:p>Paragraph ${i + 1}: A long chapter must scroll normally.</h:p>`).join('')}
      <h:h2 id="scene-2">Second Scene</h:h2><h:p>The second scene remains reachable.</h:p>
      <h:script>window.EPUB_SCRIPT_EXECUTED = true;</h:script>
      </h:body></h:html>`),
    'OPS/Bonus/Chapter One.xhtml': xml(`<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter Two</title></head><body><h1 id="arrival">Chapter Two</h1><p>Second chapter text, from a different folder.</p><a href="../Text/Chapter%20One.xhtml#scene-2">Return to the second scene</a></body></html>`),
    'OPS/Nav/nav.xhtml': xml(`<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol>
      <li><a href="../Text/cover.xhtml">Cover page</a></li>
      <li><a href="../Text/Chapter%20One.xhtml">Part One</a><ol><li><a href="../Text/Chapter%20One.xhtml#scene-2">Second Scene</a></li></ol></li>
      <li><a href="../Bonus/Chapter%20One.xhtml#arrival">Part Two</a></li>
      </ol></nav></body></html>`),
    'OPS/Navigation/toc.ncx': xml(`<n:ncx xmlns:n="http://www.daisy.org/z3986/2005/ncx/"><n:navMap>
      <n:navPoint id="first"><n:navLabel><n:text>First &amp; Main</n:text></n:navLabel><n:content src = '../Text/Chapter%20One.xhtml'/>
        <n:navPoint id="scene"><n:navLabel><n:text>Second Scene</n:text></n:navLabel><n:content src='../Text/Chapter%20One.xhtml#scene-2'/></n:navPoint>
      </n:navPoint>
      <n:navPoint id="second"><n:navLabel><n:text>Second Chapter</n:text></n:navLabel><n:content src='../Bonus/Chapter%20One.xhtml#arrival'/></n:navPoint>
      </n:navMap></n:ncx>`),
    'OPS/Images/cover art.png': epubPng,
    'OPS/Images/picture.png': epubPng,
  };
}
export const zipEpub = (entries) => fflate.zipSync(entries);
export const makeEpub = (options) => zipEpub(epubEntries(options));
