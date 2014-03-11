/***
 * @author cuongnv
 */
/**
 * CG Editor
 */
(function($){
	//name space
	$.cg = {};
	$.fn.cgEditor = function(options){
		//Notes: this pointer refers to dom element.
		//merge options
		var opts = $.extend({
			'previewTag':null,
			'enableTab':true,
			'isShowToolbar':true,
		}, options||{});
		//local cache this object
		var $that = $(this.get(0));
		console.log($that)
		//init markdown converter
		$.cg.converter = new $.cg.Showdown.converter();
		
		//trigger converter
		if(opts.previewTag != null){
			opts.previewTag.html($.cg.converter.makeHtml($that.val()));
		}
		$('pre code').each(function(i, e) {hljs.highlightBlock(e)});
		$that.keyup(function(e){
			if(opts.previewTag != null){
				opts.previewTag.html($.cg.converter.makeHtml($that.val()));
			}
			$('pre code').each(function(i, e) {hljs.highlightBlock(e)});
		});
		
		// prevent tab key
		$that.keydown(function(e){
			if(opts.enableTab){
				if(e.keyCode == 9){
					var selection = $that.prop("selectionStart");
					var str = $that.val();
					$that.val(str.substring(0, selection) + "    " + str.substring(selection, str.length));
					selection += 4;
					$that.prop("selectionStart",  selection);
					$that.prop("selectionEnd", selection);
					if(e.preventDefault)
						e.preventDefault();
					return false;
				}
			}
		});
		
		// create toolbar
		if( opts.isShowToolbar ){
			//$that.before('');
			//TODO: generate toolbar
			
		}
		$('#cg-code').click(function(){
			alert('not implement yet!');
		});
		$('#cg-uncode').click(function(){
			alert('not implement yet!');
		});
	};
	//
	// showdown.js -- A javascript port of Markdown.
	//
	// Copyright (c) 2007 John Fraser.
	//
	// Original Markdown Copyright (c) 2004-2005 John Gruber
	//   <http://daringfireball.net/projects/markdown/>
	//
	// Redistributable under a BSD-style open source license.
	// See license.txt for more information.
	//
	// The full source distribution is at:
	//
//					A A L
//					T C A
//					T K B
	//
	//   <http://www.attacklab.net/>
	//

	//
	// Wherever possible, Showdown is a straight, line-by-line port
	// of the Perl version of Markdown.
	//
	// This is not a normal parser design; it's basically just a
	// series of string substitutions.  It's hard to read and
	// maintain this way,  but keeping Showdown close to the original
	// design makes it easier to port new features.
	//
	// More importantly, Showdown behaves like markdown.pl in most
	// edge cases.  So web applications can do client-side preview
	// in Javascript, and then build identical HTML on the server.
	//
	// This port needs the new RegExp functionality of ECMA 262,
	// 3rd Edition (i.e. Javascript 1.5).  Most modern web browsers
	// should do fine.  Even with the new regular expression features,
	// We do a lot of work to emulate Perl's regex functionality.
	// The tricky changes in this file mostly have the "attacklab:"
	// label.  Major or self-explanatory changes don't.
	//
	// Smart diff tools like Araxis Merge will be able to match up
	// this file with markdown.pl in a useful way.  A little tweaking
	// helps: in a copy of markdown.pl, replace "#" with "//" and
	// replace "$text" with "text".  Be sure to ignore whitespace
	// and line endings.
	//


	//
	// Showdown usage:
	//
	//   var text = "Markdown *rocks*.";
	//
	//   var converter = new Showdown.converter();
	//   var html = converter.makeHtml(text);
	//
	//   alert(html);
	//
	// Note: move the sample code to the bottom of this
	// file before uncommenting it.
	//


	//
	// Showdown namespace
	//
	$.cg.Showdown = {};

	//
	// converter
	//
	// Wraps all "globals" so that the only thing
	// exposed is makeHtml().
	//
	$.cg.Showdown.converter = function() {

	//
	// Globals:
	//

	// Global hashes, used by various utility routines
	var g_urls;
	var g_titles;
	var g_html_blocks;

	// Used to track when we're inside an ordered or unordered list
	// (see _ProcessListItems() for details):
	var g_list_level = 0;


	this.makeHtml = function(text) {
	//
	// Main function. The order in which other subs are called here is
	// essential. Link and image substitutions need to happen before
	// _EscapeSpecialCharsWithinTagAttributes(), so that any *'s or _'s in the <a>
	// and <img> tags get encoded.
	//

		// Clear the global hashes. If we don't clear these, you get conflicts
		// from other articles when generating a page which contains more than
		// one article (e.g. an index page that shows the N most recent
		// articles):
		g_urls = new Array();
		g_titles = new Array();
		g_html_blocks = new Array();

		// attacklab: Replace ~ with ~T
		// This lets us use tilde as an escape char to avoid md5 hashes
		// The choice of character is arbitray; anything that isn't
	    // magic in Markdown will work.
		text = text.replace(/~/g,"~T");

		// attacklab: Replace $ with ~D
		// RegExp interprets $ as a special character
		// when it's in a replacement string
		text = text.replace(/\$/g,"~D");

		// Standardize line endings
		text = text.replace(/\r\n/g,"\n"); // DOS to Unix
		text = text.replace(/\r/g,"\n"); // Mac to Unix

		// Make sure text begins and ends with a couple of newlines:
		text = "\n\n" + text + "\n\n";

		// Convert all tabs to spaces.
		text = _Detab(text);

		// Strip any lines consisting only of spaces and tabs.
		// This makes subsequent regexen easier to write, because we can
		// match consecutive blank lines with /\n+/ instead of something
		// contorted like /[ \t]*\n+/ .
		text = text.replace(/^[ \t]+$/mg,"");

		// Turn block-level HTML blocks into hash entries
		text = _HashHTMLBlocks(text);

		// Strip link definitions, store in hashes.
		text = _StripLinkDefinitions(text);

		text = _RunBlockGamut(text);

		text = _UnescapeSpecialChars(text);

		// attacklab: Restore dollar signs
		text = text.replace(/~D/g,"$$");

		// attacklab: Restore tildes
		text = text.replace(/~T/g,"~");

		return text;
	};


	var _StripLinkDefinitions = function(text) {
	//
	// Strips link definitions from text, stores the URLs and titles in
	// hash references.
	//

		// Link defs are in the form: ^[id]: url "optional title"

		/*
			var text = text.replace(/
					^[ ]{0,3}\[(.+)\]:  // id = $1  attacklab: g_tab_width - 1
					  [ \t]*
					  \n?				// maybe *one* newline
					  [ \t]*
					<?(\S+?)>?			// url = $2
					  [ \t]*
					  \n?				// maybe one newline
					  [ \t]*
					(?:
					  (\n*)				// any lines skipped = $3 attacklab: lookbehind removed
					  ["(]
					  (.+?)				// title = $4
					  [")]
					  [ \t]*
					)?					// title is optional
					(?:\n+|$)
				  /gm,
				  function(){...});
		*/
		var text = text.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|\Z)/gm,
			function (wholeMatch,m1,m2,m3,m4) {
				m1 = m1.toLowerCase();
				g_urls[m1] = _EncodeAmpsAndAngles(m2);  // Link IDs are case-insensitive
				if (m3) {
					// Oops, found blank lines, so it's not a title.
					// Put back the parenthetical statement we stole.
					return m3+m4;
				} else if (m4) {
					g_titles[m1] = m4.replace(/"/g,"&quot;");
				}
				
				// Completely remove the definition from the text
				return "";
			}
		);

		return text;
	};


	var _HashHTMLBlocks = function(text) {
		// attacklab: Double up blank lines to reduce lookaround
		text = text.replace(/\n/g,"\n\n");

		// Hashify HTML blocks:
		// We only want to do this for block-level HTML tags, such as headers,
		// lists, and tables. That's because we still want to wrap <p>s around
		// "paragraphs" that are wrapped in non-block-level tags, such as anchors,
		// phrase emphasis, and spans. The list of tags we're looking for is
		// hard-coded:
		var block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del"
		var block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math"

		// First, look for nested blocks, e.g.:
		//   <div>
		//     <div>
		//     tags for inner block must be indented.
		//     </div>
		//   </div>
		//
		// The outermost tags must start at the left margin for this to match, and
		// the inner nested divs must be indented.
		// We need to do this before the next, more liberal match, because the next
		// match will start at the first `<div>` and stop at the first `</div>`.

		// attacklab: This regex can be expensive when it fails.
		/*
			var text = text.replace(/
			(						// save in $1
				^					// start of line  (with /m)
				<($block_tags_a)	// start tag = $2
				\b					// word break
									// attacklab: hack around khtml/pcre bug...
				[^\r]*?\n			// any number of lines, minimally matching
				</\2>				// the matching end tag
				[ \t]*				// trailing spaces/tabs
				(?=\n+)				// followed by a newline
			)						// attacklab: there are sentinel newlines at end of document
			/gm,function(){...}};
		*/
		text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,hashElement);

		//
		// Now match more liberally, simply from `\n<tag>` to `</tag>\n`
		//

		/*
			var text = text.replace(/
			(						// save in $1
				^					// start of line  (with /m)
				<($block_tags_b)	// start tag = $2
				\b					// word break
									// attacklab: hack around khtml/pcre bug...
				[^\r]*?				// any number of lines, minimally matching
				.*</\2>				// the matching end tag
				[ \t]*				// trailing spaces/tabs
				(?=\n+)				// followed by a newline
			)						// attacklab: there are sentinel newlines at end of document
			/gm,function(){...}};
		*/
		text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math)\b[^\r]*?.*<\/\2>[ \t]*(?=\n+)\n)/gm,hashElement);

		// Special case just for <hr />. It was easier to make a special case than
		// to make the other regex more complicated.  

		/*
			text = text.replace(/
			(						// save in $1
				\n\n				// Starting after a blank line
				[ ]{0,3}
				(<(hr)				// start tag = $2
				\b					// word break
				([^<>])*?			// 
				\/?>)				// the matching end tag
				[ \t]*
				(?=\n{2,})			// followed by a blank line
			)
			/g,hashElement);
		*/
		text = text.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,hashElement);

		// Special case for standalone HTML comments:

		/*
			text = text.replace(/
			(						// save in $1
				\n\n				// Starting after a blank line
				[ ]{0,3}			// attacklab: g_tab_width - 1
				<!
				(--[^\r]*?--\s*)+
				>
				[ \t]*
				(?=\n{2,})			// followed by a blank line
			)
			/g,hashElement);
		*/
		text = text.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,hashElement);

		// PHP and ASP-style processor instructions (<?...?> and <%...%>)

		/*
			text = text.replace(/
			(?:
				\n\n				// Starting after a blank line
			)
			(						// save in $1
				[ ]{0,3}			// attacklab: g_tab_width - 1
				(?:
					<([?%])			// $2
					[^\r]*?
					\2>
				)
				[ \t]*
				(?=\n{2,})			// followed by a blank line
			)
			/g,hashElement);
		*/
		text = text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,hashElement);

		// attacklab: Undo double lines (see comment at top of this function)
		text = text.replace(/\n\n/g,"\n");
		return text;
	};

	var hashElement = function(wholeMatch,m1) {
		var blockText = m1;

		// Undo double lines
		blockText = blockText.replace(/\n\n/g,"\n");
		blockText = blockText.replace(/^\n/,"");
		
		// strip trailing blank lines
		blockText = blockText.replace(/\n+$/g,"");
		
		// Replace the element text with a marker ("~KxK" where x is its key)
		blockText = "\n\n~K" + (g_html_blocks.push(blockText)-1) + "K\n\n";
		
		return blockText;
	};

	var _RunBlockGamut = function(text) {
	//
	// These are all the transformations that form block-level
	// tags like paragraphs, headers, and list items.
	//
		text = _DoHeaders(text);

		// Do Horizontal Rules:
		var key = hashBlock("<hr />");
		text = text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm,key);
		text = text.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm,key);
		text = text.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm,key);

		text = _DoLists(text);
		text = _DoCodeBlocks(text);
		text = _DoBlockQuotes(text);

		// We already ran _HashHTMLBlocks() before, in Markdown(), but that
		// was to escape raw HTML in the original Markdown source. This time,
		// we're escaping the markup we've just created, so that we don't wrap
		// <p> tags around block-level tags.
		text = _HashHTMLBlocks(text);
		text = _FormParagraphs(text);

		return text;
	};


	var _RunSpanGamut = function(text) {
	//
	// These are all the transformations that occur *within* block-level
	// tags like paragraphs, headers, and list items.
	//

		text = _DoCodeSpans(text);
		text = _EscapeSpecialCharsWithinTagAttributes(text);
		text = _EncodeBackslashEscapes(text);

		// Process anchor and image tags. Images must come first,
		// because ![foo][f] looks like an anchor.
		text = _DoImages(text);
		text = _DoAnchors(text);

		// Make links out of things like `<http://example.com/>`
		// Must come after _DoAnchors(), because you can use < and >
		// delimiters in inline links like [this](<url>).
		text = _DoAutoLinks(text);
		text = _EncodeAmpsAndAngles(text);
		text = _DoItalicsAndBold(text);

		// Do hard breaks:
		text = text.replace(/  +\n/g," <br />\n");

		return text;
	};

	var _EscapeSpecialCharsWithinTagAttributes = function(text) {
	//
	// Within tags -- meaning between < and > -- encode [\ ` * _] so they
	// don't conflict with their use in Markdown for code, italics and strong.
	//

		// Build a regex to find HTML tags and comments.  See Friedl's 
		// "Mastering Regular Expressions", 2nd Ed., pp. 200-201.
		var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;

		text = text.replace(regex, function(wholeMatch) {
			var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g,"$1`");
			tag = escapeCharacters(tag,"\\`*_");
			return tag;
		});

		return text;
	};

	var _DoAnchors = function(text) {
	//
	// Turn Markdown link shortcuts into XHTML <a> tags.
	//
		//
		// First, handle reference-style links: [link text] [id]
		//

		/*
			text = text.replace(/
			(							// wrap whole match in $1
				\[
				(
					(?:
						\[[^\]]*\]		// allow brackets nested one level
						|
						[^\[]			// or anything else
					)*
				)
				\]

				[ ]?					// one optional space
				(?:\n[ ]*)?				// one optional newline followed by spaces

				\[
				(.*?)					// id = $3
				\]
			)()()()()					// pad remaining backreferences
			/g,_DoAnchors_callback);
		*/
		text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeAnchorTag);

		//
		// Next, inline-style links: [link text](url "optional title")
		//

		/*
			text = text.replace(/
				(						// wrap whole match in $1
					\[
					(
						(?:
							\[[^\]]*\]	// allow brackets nested one level
						|
						[^\[\]]			// or anything else
					)
				)
				\]
				\(						// literal paren
				[ \t]*
				()						// no id, so leave $3 empty
				<?(.*?)>?				// href = $4
				[ \t]*
				(						// $5
					(['"])				// quote char = $6
					(.*?)				// Title = $7
					\6					// matching quote
					[ \t]*				// ignore any spaces/tabs between closing quote and )
				)?						// title is optional
				\)
			)
			/g,writeAnchorTag);
		*/
		text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeAnchorTag);

		//
		// Last, handle reference-style shortcuts: [link text]
		// These must come last in case you've also got [link test][1]
		// or [link test](/foo)
		//

		/*
			text = text.replace(/
			(		 					// wrap whole match in $1
				\[
				([^\[\]]+)				// link text = $2; can't contain '[' or ']'
				\]
			)()()()()()					// pad rest of backreferences
			/g, writeAnchorTag);
		*/
		text = text.replace(/(\[([^\[\]]+)\])()()()()()/g, writeAnchorTag);

		return text;
	};

	var writeAnchorTag = function(wholeMatch,m1,m2,m3,m4,m5,m6,m7) {
		if (m7 == undefined) m7 = "";
		var whole_match = m1;
		var link_text   = m2;
		var link_id	 = m3.toLowerCase();
		var url		= m4;
		var title	= m7;
		
		if (url == "") {
			if (link_id == "") {
				// lower-case and turn embedded newlines into spaces
				link_id = link_text.toLowerCase().replace(/ ?\n/g," ");
			}
			url = "#"+link_id;
			
			if (g_urls[link_id] != undefined) {
				url = g_urls[link_id];
				if (g_titles[link_id] != undefined) {
					title = g_titles[link_id];
				}
			}
			else {
				if (whole_match.search(/\(\s*\)$/m)>-1) {
					// Special case for explicit empty url
					url = "";
				} else {
					return whole_match;
				}
			}
		}	
		
		url = escapeCharacters(url,"*_");
		var result = "<a href=\"" + url + "\"";
		
		if (title != "") {
			title = title.replace(/"/g,"&quot;");
			title = escapeCharacters(title,"*_");
			result +=  " title=\"" + title + "\"";
		}
		
		result += ">" + link_text + "</a>";
		
		return result;
	};


	var _DoImages = function(text) {
	//
	// Turn Markdown image shortcuts into <img> tags.
	//

		//
		// First, handle reference-style labeled images: ![alt text][id]
		//

		/*
			text = text.replace(/
			(						// wrap whole match in $1
				!\[
				(.*?)				// alt text = $2
				\]

				[ ]?				// one optional space
				(?:\n[ ]*)?			// one optional newline followed by spaces

				\[
				(.*?)				// id = $3
				\]
			)()()()()				// pad rest of backreferences
			/g,writeImageTag);
		*/
		text = text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,writeImageTag);

		//
		// Next, handle inline images:  ![alt text](url "optional title")
		// Don't forget: encode * and _

		/*
			text = text.replace(/
			(						// wrap whole match in $1
				!\[
				(.*?)				// alt text = $2
				\]
				\s?					// One optional whitespace character
				\(					// literal paren
				[ \t]*
				()					// no id, so leave $3 empty
				<?(\S+?)>?			// src url = $4
				[ \t]*
				(					// $5
					(['"])			// quote char = $6
					(.*?)			// title = $7
					\6				// matching quote
					[ \t]*
				)?					// title is optional
			\)
			)
			/g,writeImageTag);
		*/
		text = text.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,writeImageTag);

		return text;
	};

	var writeImageTag = function(wholeMatch,m1,m2,m3,m4,m5,m6,m7) {
		var whole_match = m1;
		var alt_text   = m2;
		var link_id	 = m3.toLowerCase();
		var url		= m4;
		var title	= m7;

		if (!title) title = "";
		
		if (url == "") {
			if (link_id == "") {
				// lower-case and turn embedded newlines into spaces
				link_id = alt_text.toLowerCase().replace(/ ?\n/g," ");
			}
			url = "#"+link_id;
			
			if (g_urls[link_id] != undefined) {
				url = g_urls[link_id];
				if (g_titles[link_id] != undefined) {
					title = g_titles[link_id];
				}
			}
			else {
				return whole_match;
			}
		}	
		
		alt_text = alt_text.replace(/"/g,"&quot;");
		url = escapeCharacters(url,"*_");
		var result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";

		// attacklab: Markdown.pl adds empty title attributes to images.
		// Replicate this bug.

		//if (title != "") {
			title = title.replace(/"/g,"&quot;");
			title = escapeCharacters(title,"*_");
			result +=  " title=\"" + title + "\"";
		//}
		
		result += " />";
		
		return result;
	};


	var _DoHeaders = function(text) {

		// Setext-style headers:
		//	Header 1
		//	========
		//  
		//	Header 2
		//	--------
		//
		text = text.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,
			function(wholeMatch,m1){return hashBlock("<h1>" + _RunSpanGamut(m1) + "</h1>");});

		text = text.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,
			function(matchFound,m1){return hashBlock("<h2>" + _RunSpanGamut(m1) + "</h2>");});

		// atx-style headers:
		//  # Header 1
		//  ## Header 2
		//  ## Header 2 with closing hashes ##
		//  ...
		//  ###### Header 6
		//

		/*
			text = text.replace(/
				^(\#{1,6})				// $1 = string of #'s
				[ \t]*
				(.+?)					// $2 = Header text
				[ \t]*
				\#*						// optional closing #'s (not counted)
				\n+
			/gm, function() {...});
		*/

		text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,
			function(wholeMatch,m1,m2) {
				var h_level = m1.length;
				return hashBlock("<h" + h_level + ">" + _RunSpanGamut(m2) + "</h" + h_level + ">");
			});

		return text;
	};

	// This declaration keeps Dojo compressor from outputting garbage:
	var _ProcessListItems;

	var _DoLists = function(text) {
	//
	// Form HTML ordered (numbered) and unordered (bulleted) lists.
	//

		// attacklab: add sentinel to hack around khtml/safari bug:
		// http://bugs.webkit.org/show_bug.cgi?id=11231
		text += "~0";

		// Re-usable pattern to match any entirel ul or ol list:

		/*
			var whole_list = /
			(									// $1 = whole list
				(								// $2
					[ ]{0,3}					// attacklab: g_tab_width - 1
					([*+-]|\d+[.])				// $3 = first list item marker
					[ \t]+
				)
				[^\r]+?
				(								// $4
					~0							// sentinel for workaround; should be $
				|
					\n{2,}
					(?=\S)
					(?!							// Negative lookahead for another list item marker
						[ \t]*
						(?:[*+-]|\d+[.])[ \t]+
					)
				)
			)/g
		*/
		var whole_list = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

		if (g_list_level) {
			text = text.replace(whole_list,function(wholeMatch,m1,m2) {
				var list = m1;
				var list_type = (m2.search(/[*+-]/g)>-1) ? "ul" : "ol";

				// Turn double returns into triple returns, so that we can make a
				// paragraph for the last item in a list, if necessary:
				list = list.replace(/\n{2,}/g,"\n\n\n");;
				var result = _ProcessListItems(list);
		
				// Trim any trailing whitespace, to put the closing `</$list_type>`
				// up on the preceding line, to get it past the current stupid
				// HTML block parser. This is a hack to work around the terrible
				// hack that is the HTML block parser.
				result = result.replace(/\s+$/,"");
				result = "<"+list_type+">" + result + "</"+list_type+">\n";
				return result;
			});
		} else {
			whole_list = /(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;
			text = text.replace(whole_list,function(wholeMatch,m1,m2,m3) {
				var runup = m1;
				var list = m2;

				var list_type = (m3.search(/[*+-]/g)>-1) ? "ul" : "ol";
				// Turn double returns into triple returns, so that we can make a
				// paragraph for the last item in a list, if necessary:
				var list = list.replace(/\n{2,}/g,"\n\n\n");;
				var result = _ProcessListItems(list);
				result = runup + "<"+list_type+">\n" + result + "</"+list_type+">\n";	
				return result;
			});
		}

		// attacklab: strip sentinel
		text = text.replace(/~0/,"");

		return text;
	};

	_ProcessListItems = function(list_str) {
	//
	//  Process the contents of a single ordered or unordered list, splitting it
	//  into individual list items.
	//
		// The $g_list_level global keeps track of when we're inside a list.
		// Each time we enter a list, we increment it; when we leave a list,
		// we decrement. If it's zero, we're not in a list anymore.
		//
		// We do this because when we're not inside a list, we want to treat
		// something like this:
		//
		//    I recommend upgrading to version
		//    8. Oops, now this line is treated
		//    as a sub-list.
		//
		// As a single paragraph, despite the fact that the second line starts
		// with a digit-period-space sequence.
		//
		// Whereas when we're inside a list (or sub-list), that line will be
		// treated as the start of a sub-list. What a kludge, huh? This is
		// an aspect of Markdown's syntax that's hard to parse perfectly
		// without resorting to mind-reading. Perhaps the solution is to
		// change the syntax rules such that sub-lists must start with a
		// starting cardinal number; e.g. "1." or "a.".

		g_list_level++;

		// trim trailing blank lines:
		list_str = list_str.replace(/\n{2,}$/,"\n");

		// attacklab: add sentinel to emulate \z
		list_str += "~0";

		/*
			list_str = list_str.replace(/
				(\n)?							// leading line = $1
				(^[ \t]*)						// leading whitespace = $2
				([*+-]|\d+[.]) [ \t]+			// list marker = $3
				([^\r]+?						// list item text   = $4
				(\n{1,2}))
				(?= \n* (~0 | \2 ([*+-]|\d+[.]) [ \t]+))
			/gm, function(){...});
		*/
		list_str = list_str.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,
			function(wholeMatch,m1,m2,m3,m4){
				var item = m4;
				var leading_line = m1;
				var leading_space = m2;

				if (leading_line || (item.search(/\n{2,}/)>-1)) {
					item = _RunBlockGamut(_Outdent(item));
				}
				else {
					// Recursion for sub-lists:
					item = _DoLists(_Outdent(item));
					item = item.replace(/\n$/,""); // chomp(item)
					item = _RunSpanGamut(item);
				}

				return  "<li>" + item + "</li>\n";
			}
		);

		// attacklab: strip sentinel
		list_str = list_str.replace(/~0/g,"");

		g_list_level--;
		return list_str;
	};


	var _DoCodeBlocks = function(text) {
	//
	//  Process Markdown `<pre><code>` blocks.
	//  

		/*
			text = text.replace(text,
				/(?:\n\n|^)
				(								// $1 = the code block -- one or more lines, starting with a space/tab
					(?:
						(?:[ ]{4}|\t)			// Lines must start with a tab or a tab-width of spaces - attacklab: g_tab_width
						.*\n+
					)+
				)
				(\n*[ ]{0,3}[^ \t\n]|(?=~0))	// attacklab: g_tab_width
			/g,function(){...});
		*/

		// attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
		text += "~0";
		
		text = text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/gm,
			function(wholeMatch,m1,m2) {
				var codeblock = m1;
				var nextChar = m2;
			
				codeblock = _EncodeCode( _Outdent(codeblock));
				codeblock = _Detab(codeblock);
				codeblock = codeblock.replace(/^\n+/g,""); // trim leading newlines
				codeblock = codeblock.replace(/\n+$/g,""); // trim trailing whitespace

				codeblock = "<pre><code>" + codeblock + "\n</code></pre>";

				return hashBlock(codeblock) + nextChar;
			}
		);

		// attacklab: strip sentinel
		text = text.replace(/~0/,"");

		return text;
	};

	var hashBlock = function(text) {
		text = text.replace(/(^\n+|\n+$)/g,"");
		return "\n\n~K" + (g_html_blocks.push(text)-1) + "K\n\n";
	};


	var _DoCodeSpans = function(text) {
	//
	//   *  Backtick quotes are used for <code></code> spans.
	// 
	//   *  You can use multiple backticks as the delimiters if you want to
//		 include literal backticks in the code span. So, this input:
//		 
//			 Just type ``foo `bar` baz`` at the prompt.
//		 
//		   Will translate to:
//		 
//			 <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
//		 
//		There's no arbitrary limit to the number of backticks you
//		can use as delimters. If you need three consecutive backticks
//		in your code, use four for delimiters, etc.
	//
	//  *  You can use spaces to get literal backticks at the edges:
//		 
//			 ... type `` `bar` `` ...
//		 
//		   Turns to:
//		 
//			 ... type <code>`bar`</code> ...
	//

		/*
			text = text.replace(/
				(^|[^\\])					// Character before opening ` can't be a backslash
				(`+)						// $2 = Opening run of `
				(							// $3 = The code block
					[^\r]*?
					[^`]					// attacklab: work around lack of lookbehind
				)
				\2							// Matching closer
				(?!`)
			/gm, function(){...});
		*/

		text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
			function(wholeMatch,m1,m2,m3,m4) {
				var c = m3;
				c = c.replace(/^([ \t]*)/g,"");	// leading whitespace
				c = c.replace(/[ \t]*$/g,"");	// trailing whitespace
				c = _EncodeCode(c);
				return m1+"<code>"+c+"</code>";
			});

		return text;
	};


	var _EncodeCode = function(text) {
	//
	// Encode/escape certain characters inside Markdown code runs.
	// The point is that in code, these characters are literals,
	// and lose their special Markdown meanings.
	//
		// Encode all ampersands; HTML entities are not
		// entities within a Markdown code span.
		text = text.replace(/&/g,"&amp;");

		// Do the angle bracket song and dance:
		text = text.replace(/</g,"&lt;");
		text = text.replace(/>/g,"&gt;");

		// Now, escape characters that are magic in Markdown:
		text = escapeCharacters(text,"\*_{}[]\\",false);

	// jj the line above breaks this:
	//---

	//* Item

	//   1. Subitem

//	            special char: *
	//---

		return text;
	};


	var _DoItalicsAndBold = function(text) {

		// <strong> must go first:
		text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,
			"<strong>$2</strong>");

		text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,
			"<em>$2</em>");

		return text;
	};


	var _DoBlockQuotes = function(text) {

		/*
			text = text.replace(/
			(								// Wrap whole match in $1
				(
					^[ \t]*>[ \t]?			// '>' at the start of a line
					.+\n					// rest of the first line
					(.+\n)*					// subsequent consecutive lines
					\n*						// blanks
				)+
			)
			/gm, function(){...});
		*/

		text = text.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,
			function(wholeMatch,m1) {
				var bq = m1;

				// attacklab: hack around Konqueror 3.5.4 bug:
				// "----------bug".replace(/^-/g,"") == "bug"

				bq = bq.replace(/^[ \t]*>[ \t]?/gm,"~0");	// trim one level of quoting

				// attacklab: clean up hack
				bq = bq.replace(/~0/g,"");

				bq = bq.replace(/^[ \t]+$/gm,"");		// trim whitespace-only lines
				bq = _RunBlockGamut(bq);				// recurse
				
				bq = bq.replace(/(^|\n)/g,"$1  ");
				// These leading spaces screw with <pre> content, so we need to fix that:
				bq = bq.replace(
						/(\s*<pre>[^\r]+?<\/pre>)/gm,
					function(wholeMatch,m1) {
						var pre = m1;
						// attacklab: hack around Konqueror 3.5.4 bug:
						pre = pre.replace(/^  /mg,"~0");
						pre = pre.replace(/~0/g,"");
						return pre;
					});
				
				return hashBlock("<blockquote>\n" + bq + "\n</blockquote>");
			});
		return text;
	};


	var _FormParagraphs = function(text) {
	//
	//  Params:
//	    $text - string to process with html <p> tags
	//

		// Strip leading and trailing lines:
		text = text.replace(/^\n+/g,"");
		text = text.replace(/\n+$/g,"");

		var grafs = text.split(/\n{2,}/g);
		var grafsOut = new Array();

		//
		// Wrap <p> tags.
		//
		var end = grafs.length;
		for (var i=0; i<end; i++) {
			var str = grafs[i];

			// if this is an HTML marker, copy it
			if (str.search(/~K(\d+)K/g) >= 0) {
				grafsOut.push(str);
			}
			else if (str.search(/\S/) >= 0) {
				str = _RunSpanGamut(str);
				str = str.replace(/^([ \t]*)/g,"<p>");
				str += "</p>"
				grafsOut.push(str);
			}

		}

		//
		// Unhashify HTML blocks
		//
		end = grafsOut.length;
		for (var i=0; i<end; i++) {
			// if this is a marker for an html block...
			while (grafsOut[i].search(/~K(\d+)K/) >= 0) {
				var blockText = g_html_blocks[RegExp.$1];
				blockText = blockText.replace(/\$/g,"$$$$"); // Escape any dollar signs
				grafsOut[i] = grafsOut[i].replace(/~K\d+K/,blockText);
			}
		}

		return grafsOut.join("\n\n");
	};


	var _EncodeAmpsAndAngles = function(text) {
	// Smart processing for ampersands and angle brackets that need to be encoded.
		
		// Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
		//   http://bumppo.net/projects/amputator/
		text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;");
		
		// Encode naked <'s
		text = text.replace(/<(?![a-z\/?\$!])/gi,"&lt;");
		
		return text;
	};


	var _EncodeBackslashEscapes = function(text) {
	//
	//   Parameter:  String.
	//   Returns:	The string, with after processing the following backslash
//				   escape sequences.
	//

		// attacklab: The polite way to do this is with the new
		// escapeCharacters() function:
		//
		// 	text = escapeCharacters(text,"\\",true);
		// 	text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
		//
		// ...but we're sidestepping its use of the (slow) RegExp constructor
		// as an optimization for Firefox.  This function gets called a LOT.

		text = text.replace(/\\(\\)/g,escapeCharacters_callback);
		text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g,escapeCharacters_callback);
		return text;
	};


	var _DoAutoLinks = function(text) {

		text = text.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi,"<a href=\"$1\">$1</a>");

		// Email addresses: <address@domain.foo>

		/*
			text = text.replace(/
				<
				(?:mailto:)?
				(
					[-.\w]+
					\@
					[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+
				)
				>
			/gi, _DoAutoLinks_callback());
		*/
		text = text.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,
			function(wholeMatch,m1) {
				return _EncodeEmailAddress( _UnescapeSpecialChars(m1) );
			}
		);

		return text;
	};


	var _EncodeEmailAddress = function(addr) {
	//
	//  Input: an email address, e.g. "foo@example.com"
	//
	//  Output: the email address as a mailto link, with each character
//		of the address encoded as either a decimal or hex entity, in
//		the hopes of foiling most address harvesting spam bots. E.g.:
	//
//		<a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
//		   x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
//		   &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
	//
	//  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
	//  mailing list: <http://tinyurl.com/yu7ue>
	//

		// attacklab: why can't javascript speak hex?
		function char2hex(ch) {
			var hexDigits = '0123456789ABCDEF';
			var dec = ch.charCodeAt(0);
			return(hexDigits.charAt(dec>>4) + hexDigits.charAt(dec&15));
		}

		var encode = [
			function(ch){return "&#"+ch.charCodeAt(0)+";";},
			function(ch){return "&#x"+char2hex(ch)+";";},
			function(ch){return ch;}
		];

		addr = "mailto:" + addr;

		addr = addr.replace(/./g, function(ch) {
			if (ch == "@") {
			   	// this *must* be encoded. I insist.
				ch = encode[Math.floor(Math.random()*2)](ch);
			} else if (ch !=":") {
				// leave ':' alone (to spot mailto: later)
				var r = Math.random();
				// roughly 10% raw, 45% hex, 45% dec
				ch =  (
						r > .9  ?	encode[2](ch)   :
						r > .45 ?	encode[1](ch)   :
									encode[0](ch)
					);
			}
			return ch;
		});

		addr = "<a href=\"" + addr + "\">" + addr + "</a>";
		addr = addr.replace(/">.+:/g,"\">"); // strip the mailto: from the visible part

		return addr;
	};


	var _UnescapeSpecialChars = function(text) {
	//
	// Swap back in all the special characters we've hidden.
	//
		text = text.replace(/~E(\d+)E/g,
			function(wholeMatch,m1) {
				var charCodeToReplace = parseInt(m1);
				return String.fromCharCode(charCodeToReplace);
			}
		);
		return text;
	};


	var _Outdent = function(text) {
	//
	// Remove one level of line-leading tabs or spaces
	//

		// attacklab: hack around Konqueror 3.5.4 bug:
		// "----------bug".replace(/^-/g,"") == "bug"

		text = text.replace(/^(\t|[ ]{1,4})/gm,"~0"); // attacklab: g_tab_width

		// attacklab: clean up hack
		text = text.replace(/~0/g,"");

		return text;
	};

	var _Detab = function(text) {
	// attacklab: Detab's completely rewritten for speed.
	// In perl we could fix it by anchoring the regexp with \G.
	// In javascript we're less fortunate.

		// expand first n-1 tabs
		text = text.replace(/\t(?=\t)/g,"    "); // attacklab: g_tab_width

		// replace the nth with two sentinels
		text = text.replace(/\t/g,"~A~B");

		// use the sentinel to anchor our regex so it doesn't explode
		text = text.replace(/~B(.+?)~A/g,
			function(wholeMatch,m1,m2) {
				var leadingText = m1;
				var numSpaces = 4 - leadingText.length % 4;  // attacklab: g_tab_width

				// there *must* be a better way to do this:
				for (var i=0; i<numSpaces; i++) leadingText+=" ";

				return leadingText;
			}
		);

		// clean up sentinels
		text = text.replace(/~A/g,"    ");  // attacklab: g_tab_width
		text = text.replace(/~B/g,"");

		return text;
	};


	//
	//  attacklab: Utility functions
	//


	var escapeCharacters = function(text, charsToEscape, afterBackslash) {
		// First we have to escape the escape characters so that
		// we can build a character class out of them
		var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g,"\\$1") + "])";

		if (afterBackslash) {
			regexString = "\\\\" + regexString;
		}

		var regex = new RegExp(regexString,"g");
		text = text.replace(regex,escapeCharacters_callback);

		return text;
	};
	var escapeCharacters_callback = function(wholeMatch,m1) {
		var charCodeToEscape = m1.charCodeAt(0);
		return "~E"+charCodeToEscape+"E";
	};
	};
	
	var hljs=new function(){function l(o){return o.replace(/&/gm,"&amp;").replace(/</gm,"&lt;").replace(/>/gm,"&gt;")}function b(p){for(var o=p.firstChild;o;o=o.nextSibling){if(o.nodeName=="CODE"){return o}if(!(o.nodeType==3&&o.nodeValue.match(/\s+/))){break}}}function h(p,o){return Array.prototype.map.call(p.childNodes,function(q){if(q.nodeType==3){return o?q.nodeValue.replace(/\n/g,""):q.nodeValue}if(q.nodeName=="BR"){return"\n"}return h(q,o)}).join("")}function a(q){var p=(q.className+" "+(q.parentNode?q.parentNode.className:"")).split(/\s+/);p=p.map(function(r){return r.replace(/^language-/,"")});for(var o=0;o<p.length;o++){if(e[p[o]]||p[o]=="no-highlight"){return p[o]}}}function c(q){var o=[];(function p(r,s){for(var t=r.firstChild;t;t=t.nextSibling){if(t.nodeType==3){s+=t.nodeValue.length}else{if(t.nodeName=="BR"){s+=1}else{if(t.nodeType==1){o.push({event:"start",offset:s,node:t});s=p(t,s);o.push({event:"stop",offset:s,node:t})}}}}return s})(q,0);return o}function j(x,v,w){var p=0;var y="";var r=[];function t(){if(x.length&&v.length){if(x[0].offset!=v[0].offset){return(x[0].offset<v[0].offset)?x:v}else{return v[0].event=="start"?x:v}}else{return x.length?x:v}}function s(A){function z(B){return" "+B.nodeName+'="'+l(B.value)+'"'}return"<"+A.nodeName+Array.prototype.map.call(A.attributes,z).join("")+">"}while(x.length||v.length){var u=t().splice(0,1)[0];y+=l(w.substr(p,u.offset-p));p=u.offset;if(u.event=="start"){y+=s(u.node);r.push(u.node)}else{if(u.event=="stop"){var o,q=r.length;do{q--;o=r[q];y+=("</"+o.nodeName.toLowerCase()+">")}while(o!=u.node);r.splice(q,1);while(q<r.length){y+=s(r[q]);q++}}}}return y+l(w.substr(p))}function f(r){function o(s){return(s&&s.source)||s}function p(t,s){return RegExp(o(t),"m"+(r.cI?"i":"")+(s?"g":""))}function q(z,x){if(z.compiled){return}z.compiled=true;var u=[];if(z.k){var s={};function A(B,t){t.split(" ").forEach(function(C){var D=C.split("|");s[D[0]]=[B,D[1]?Number(D[1]):1];u.push(D[0])})}z.lR=p(z.l||hljs.IR+"(?!\\.)",true);if(typeof z.k=="string"){A("keyword",z.k)}else{for(var y in z.k){if(!z.k.hasOwnProperty(y)){continue}A(y,z.k[y])}}z.k=s}if(x){if(z.bWK){z.b="\\b("+u.join("|")+")\\b(?!\\.)\\s*"}z.bR=p(z.b?z.b:"\\B|\\b");if(!z.e&&!z.eW){z.e="\\B|\\b"}if(z.e){z.eR=p(z.e)}z.tE=o(z.e)||"";if(z.eW&&x.tE){z.tE+=(z.e?"|":"")+x.tE}}if(z.i){z.iR=p(z.i)}if(z.r===undefined){z.r=1}if(!z.c){z.c=[]}for(var w=0;w<z.c.length;w++){if(z.c[w]=="self"){z.c[w]=z}q(z.c[w],z)}if(z.starts){q(z.starts,x)}var v=[];for(var w=0;w<z.c.length;w++){v.push(o(z.c[w].b))}if(z.tE){v.push(o(z.tE))}if(z.i){v.push(o(z.i))}z.t=v.length?p(v.join("|"),true):{exec:function(t){return null}}}q(r)}function d(E,F,C){function o(r,N){for(var M=0;M<N.c.length;M++){var L=N.c[M].bR.exec(r);if(L&&L.index==0){return N.c[M]}}}function s(L,r){if(L.e&&L.eR.test(r)){return L}if(L.eW){return s(L.parent,r)}}function t(r,L){return !C&&L.i&&L.iR.test(r)}function y(M,r){var L=G.cI?r[0].toLowerCase():r[0];return M.k.hasOwnProperty(L)&&M.k[L]}function H(){var L=l(w);if(!A.k){return L}var r="";var O=0;A.lR.lastIndex=0;var M=A.lR.exec(L);while(M){r+=L.substr(O,M.index-O);var N=y(A,M);if(N){v+=N[1];r+='<span class="'+N[0]+'">'+M[0]+"</span>"}else{r+=M[0]}O=A.lR.lastIndex;M=A.lR.exec(L)}return r+L.substr(O)}function z(){if(A.sL&&!e[A.sL]){return l(w)}var r=A.sL?d(A.sL,w):g(w);if(A.r>0){v+=r.keyword_count;B+=r.r}return'<span class="'+r.language+'">'+r.value+"</span>"}function K(){return A.sL!==undefined?z():H()}function J(M,r){var L=M.cN?'<span class="'+M.cN+'">':"";if(M.rB){x+=L;w=""}else{if(M.eB){x+=l(r)+L;w=""}else{x+=L;w=r}}A=Object.create(M,{parent:{value:A}})}function D(L,r){w+=L;if(r===undefined){x+=K();return 0}var N=o(r,A);if(N){x+=K();J(N,r);return N.rB?0:r.length}var O=s(A,r);if(O){var M=A;if(!(M.rE||M.eE)){w+=r}x+=K();do{if(A.cN){x+="</span>"}B+=A.r;A=A.parent}while(A!=O.parent);if(M.eE){x+=l(r)}w="";if(O.starts){J(O.starts,"")}return M.rE?0:r.length}if(t(r,A)){throw new Error('Illegal lexem "'+r+'" for mode "'+(A.cN||"<unnamed>")+'"')}w+=r;return r.length||1}var G=e[E];f(G);var A=G;var w="";var B=0;var v=0;var x="";try{var u,q,p=0;while(true){A.t.lastIndex=p;u=A.t.exec(F);if(!u){break}q=D(F.substr(p,u.index-p),u[0]);p=u.index+q}D(F.substr(p));return{r:B,keyword_count:v,value:x,language:E}}catch(I){if(I.message.indexOf("Illegal")!=-1){return{r:0,keyword_count:0,value:l(F)}}else{throw I}}}function g(s){var o={keyword_count:0,r:0,value:l(s)};var q=o;for(var p in e){if(!e.hasOwnProperty(p)){continue}var r=d(p,s,false);r.language=p;if(r.keyword_count+r.r>q.keyword_count+q.r){q=r}if(r.keyword_count+r.r>o.keyword_count+o.r){q=o;o=r}}if(q.language){o.second_best=q}return o}function i(q,p,o){if(p){q=q.replace(/^((<[^>]+>|\t)+)/gm,function(r,v,u,t){return v.replace(/\t/g,p)})}if(o){q=q.replace(/\n/g,"<br>")}return q}function m(r,u,p){var v=h(r,p);var t=a(r);if(t=="no-highlight"){return}var w=t?d(t,v,true):g(v);t=w.language;var o=c(r);if(o.length){var q=document.createElement("pre");q.innerHTML=w.value;w.value=j(o,c(q),v)}w.value=i(w.value,u,p);var s=r.className;if(!s.match("(\\s|^)(language-)?"+t+"(\\s|$)")){s=s?(s+" "+t):t}r.innerHTML=w.value;r.className=s;r.result={language:t,kw:w.keyword_count,re:w.r};if(w.second_best){r.second_best={language:w.second_best.language,kw:w.second_best.keyword_count,re:w.second_best.r}}}function n(){if(n.called){return}n.called=true;Array.prototype.map.call(document.getElementsByTagName("pre"),b).filter(Boolean).forEach(function(o){m(o,hljs.tabReplace)})}function k(){window.addEventListener("DOMContentLoaded",n,false);window.addEventListener("load",n,false)}var e={};this.LANGUAGES=e;this.highlight=d;this.highlightAuto=g;this.fixMarkup=i;this.highlightBlock=m;this.initHighlighting=n;this.initHighlightingOnLoad=k;this.IR="[a-zA-Z][a-zA-Z0-9_]*";this.UIR="[a-zA-Z_][a-zA-Z0-9_]*";this.NR="\\b\\d+(\\.\\d+)?";this.CNR="(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";this.BNR="\\b(0b[01]+)";this.RSR="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|\\.|-|-=|/|/=|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";this.BE={b:"\\\\[\\s\\S]",r:0};this.ASM={cN:"string",b:"'",e:"'",i:"\\n",c:[this.BE],r:0};this.QSM={cN:"string",b:'"',e:'"',i:"\\n",c:[this.BE],r:0};this.CLCM={cN:"comment",b:"//",e:"$"};this.CBLCLM={cN:"comment",b:"/\\*",e:"\\*/"};this.HCM={cN:"comment",b:"#",e:"$"};this.NM={cN:"number",b:this.NR,r:0};this.CNM={cN:"number",b:this.CNR,r:0};this.BNM={cN:"number",b:this.BNR,r:0};this.REGEXP_MODE={cN:"regexp",b:/\//,e:/\/[gim]*/,i:/\n/,c:[this.BE,{b:/\[/,e:/\]/,r:0,c:[this.BE]}]};this.inherit=function(q,r){var o={};for(var p in q){o[p]=q[p]}if(r){for(var p in r){o[p]=r[p]}}return o}}();hljs.LANGUAGES.bash=function(a){var c={cN:"variable",b:/\$[\w\d#@][\w\d_]*/};var b={cN:"variable",b:/\$\{(.*?)\}/};var e={cN:"string",b:/"/,e:/"/,c:[a.BE,c,b,{cN:"variable",b:/\$\(/,e:/\)/,c:a.BE}],r:0};var d={cN:"string",b:/'/,e:/'/,r:0};return{l:/-?[a-z]+/,k:{keyword:"if then else elif fi for break continue while in do done exit return set declare case esac export exec",literal:"true false",built_in:"printf echo read cd pwd pushd popd dirs let eval unset typeset readonly getopts source shopt caller type hash bind help sudo",operator:"-ne -eq -lt -gt -f -d -e -s -l -a"},c:[{cN:"shebang",b:/^#![^\n]+sh\s*$/,r:10},{cN:"function",b:/\w[\w\d_]*\s*\(\s*\)\s*\{/,rB:true,c:[{cN:"title",b:/\w[\w\d_]*/}],r:0},a.HCM,a.NM,e,d,c,b]}}(hljs);hljs.LANGUAGES.cs=function(a){return{k:"abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual volatile void while async await ascending descending from get group into join let orderby partial select set value var where yield",c:[{cN:"comment",b:"///",e:"$",rB:true,c:[{cN:"xmlDocTag",b:"///|<!--|-->"},{cN:"xmlDocTag",b:"</?",e:">"}]},a.CLCM,a.CBLCLM,{cN:"preprocessor",b:"#",e:"$",k:"if else elif endif define undef warning error line region endregion pragma checksum"},{cN:"string",b:'@"',e:'"',c:[{b:'""'}]},a.ASM,a.QSM,a.CNM]}}(hljs);hljs.LANGUAGES.ruby=function(e){var a="[a-zA-Z_][a-zA-Z0-9_]*(\\!|\\?)?";var j="[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?";var g={keyword:"and false then defined module in return redo if BEGIN retry end for true self when next until do begin unless END rescue nil else break undef not super class case require yield alias while ensure elsif or include"};var c={cN:"yardoctag",b:"@[A-Za-z]+"};var k=[{cN:"comment",b:"#",e:"$",c:[c]},{cN:"comment",b:"^\\=begin",e:"^\\=end",c:[c],r:10},{cN:"comment",b:"^__END__",e:"\\n$"}];var d={cN:"subst",b:"#\\{",e:"}",l:a,k:g};var i=[e.BE,d];var b=[{cN:"string",b:"'",e:"'",c:i,r:0},{cN:"string",b:'"',e:'"',c:i,r:0},{cN:"string",b:"%[qw]?\\(",e:"\\)",c:i},{cN:"string",b:"%[qw]?\\[",e:"\\]",c:i},{cN:"string",b:"%[qw]?{",e:"}",c:i},{cN:"string",b:"%[qw]?<",e:">",c:i,r:10},{cN:"string",b:"%[qw]?/",e:"/",c:i,r:10},{cN:"string",b:"%[qw]?%",e:"%",c:i,r:10},{cN:"string",b:"%[qw]?-",e:"-",c:i,r:10},{cN:"string",b:"%[qw]?\\|",e:"\\|",c:i,r:10}];var h={cN:"function",bWK:true,e:" |$|;",k:"def",c:[{cN:"title",b:j,l:a,k:g},{cN:"params",b:"\\(",e:"\\)",l:a,k:g}].concat(k)};var f=k.concat(b.concat([{cN:"class",bWK:true,e:"$|;",k:"class module",c:[{cN:"title",b:"[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?",r:0},{cN:"inheritance",b:"<\\s*",c:[{cN:"parent",b:"("+e.IR+"::)?"+e.IR}]}].concat(k)},h,{cN:"constant",b:"(::)?(\\b[A-Z]\\w*(::)?)+",r:0},{cN:"symbol",b:":",c:b.concat([{b:j}]),r:0},{cN:"symbol",b:a+":",r:0},{cN:"number",b:"(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b",r:0},{cN:"number",b:"\\?\\w"},{cN:"variable",b:"(\\$\\W)|((\\$|\\@\\@?)(\\w+))"},{b:"("+e.RSR+")\\s*",c:k.concat([{cN:"regexp",b:"/",e:"/[a-z]*",i:"\\n",c:[e.BE,d]}]),r:0}]));d.c=f;h.c[1].c=f;return{l:a,k:g,c:f}}(hljs);hljs.LANGUAGES.diff=function(a){return{c:[{cN:"chunk",b:"^\\@\\@ +\\-\\d+,\\d+ +\\+\\d+,\\d+ +\\@\\@$",r:10},{cN:"chunk",b:"^\\*\\*\\* +\\d+,\\d+ +\\*\\*\\*\\*$",r:10},{cN:"chunk",b:"^\\-\\-\\- +\\d+,\\d+ +\\-\\-\\-\\-$",r:10},{cN:"header",b:"Index: ",e:"$"},{cN:"header",b:"=====",e:"=====$"},{cN:"header",b:"^\\-\\-\\-",e:"$"},{cN:"header",b:"^\\*{3} ",e:"$"},{cN:"header",b:"^\\+\\+\\+",e:"$"},{cN:"header",b:"\\*{5}",e:"\\*{5}$"},{cN:"addition",b:"^\\+",e:"$"},{cN:"deletion",b:"^\\-",e:"$"},{cN:"change",b:"^\\!",e:"$"}]}}(hljs);hljs.LANGUAGES.javascript=function(a){return{k:{keyword:"in if for while finally var new function do return void else break catch instanceof with throw case default try this switch continue typeof delete let yield const",literal:"true false null undefined NaN Infinity"},c:[a.ASM,a.QSM,a.CLCM,a.CBLCLM,a.CNM,{b:"("+a.RSR+"|\\b(case|return|throw)\\b)\\s*",k:"return throw case",c:[a.CLCM,a.CBLCLM,a.REGEXP_MODE,{b:/</,e:/>;/,sL:"xml"}],r:0},{cN:"function",bWK:true,e:/{/,k:"function",c:[{cN:"title",b:/[A-Za-z$_][0-9A-Za-z$_]*/},{cN:"params",b:/\(/,e:/\)/,c:[a.CLCM,a.CBLCLM],i:/["'\(]/}],i:/\[|%/}]}}(hljs);hljs.LANGUAGES.css=function(a){var b="[a-zA-Z-][a-zA-Z0-9_-]*";var c={cN:"function",b:b+"\\(",e:"\\)",c:["self",a.NM,a.ASM,a.QSM]};return{cI:true,i:"[=/|']",c:[a.CBLCLM,{cN:"id",b:"\\#[A-Za-z0-9_-]+"},{cN:"class",b:"\\.[A-Za-z0-9_-]+",r:0},{cN:"attr_selector",b:"\\[",e:"\\]",i:"$"},{cN:"pseudo",b:":(:)?[a-zA-Z0-9\\_\\-\\+\\(\\)\\\"\\']+"},{cN:"at_rule",b:"@(font-face|page)",l:"[a-z-]+",k:"font-face page"},{cN:"at_rule",b:"@",e:"[{;]",c:[{cN:"keyword",b:/\S+/},{b:/\s/,eW:true,eE:true,r:0,c:[c,a.ASM,a.QSM,a.NM]}]},{cN:"tag",b:b,r:0},{cN:"rules",b:"{",e:"}",i:"[^\\s]",r:0,c:[a.CBLCLM,{cN:"rule",b:"[^\\s]",rB:true,e:";",eW:true,c:[{cN:"attribute",b:"[A-Z\\_\\.\\-]+",e:":",eE:true,i:"[^\\s]",starts:{cN:"value",eW:true,eE:true,c:[c,a.NM,a.QSM,a.ASM,a.CBLCLM,{cN:"hexcolor",b:"#[0-9A-Fa-f]+"},{cN:"important",b:"!important"}]}}]}]}]}}(hljs);hljs.LANGUAGES.xml=function(a){var c="[A-Za-z0-9\\._:-]+";var b={eW:true,r:0,c:[{cN:"attribute",b:c,r:0},{b:'="',rB:true,e:'"',c:[{cN:"value",b:'"',eW:true}]},{b:"='",rB:true,e:"'",c:[{cN:"value",b:"'",eW:true}]},{b:"=",c:[{cN:"value",b:"[^\\s/>]+"}]}]};return{cI:true,c:[{cN:"pi",b:"<\\?",e:"\\?>",r:10},{cN:"doctype",b:"<!DOCTYPE",e:">",r:10,c:[{b:"\\[",e:"\\]"}]},{cN:"comment",b:"<!--",e:"-->",r:10},{cN:"cdata",b:"<\\!\\[CDATA\\[",e:"\\]\\]>",r:10},{cN:"tag",b:"<style(?=\\s|>|$)",e:">",k:{title:"style"},c:[b],starts:{e:"</style>",rE:true,sL:"css"}},{cN:"tag",b:"<script(?=\\s|>|$)",e:">",k:{title:"script"},c:[b],starts:{e:"<\/script>",rE:true,sL:"javascript"}},{b:"<%",e:"%>",sL:"vbscript"},{cN:"tag",b:"</?",e:"/?>",r:0,c:[{cN:"title",b:"[^ /><]+"},b]}]}}(hljs);hljs.LANGUAGES.http=function(a){return{i:"\\S",c:[{cN:"status",b:"^HTTP/[0-9\\.]+",e:"$",c:[{cN:"number",b:"\\b\\d{3}\\b"}]},{cN:"request",b:"^[A-Z]+ (.*?) HTTP/[0-9\\.]+$",rB:true,e:"$",c:[{cN:"string",b:" ",e:" ",eB:true,eE:true}]},{cN:"attribute",b:"^\\w",e:": ",eE:true,i:"\\n|\\s|=",starts:{cN:"string",e:"$"}},{b:"\\n\\n",starts:{sL:"",eW:true}}]}}(hljs);hljs.LANGUAGES.java=function(a){return{k:"false synchronized int abstract float private char boolean static null if const for true while long throw strictfp finally protected import native final return void enum else break transient new catch instanceof byte super volatile case assert short package default double public try this switch continue throws",c:[{cN:"javadoc",b:"/\\*\\*",e:"\\*/",c:[{cN:"javadoctag",b:"(^|\\s)@[A-Za-z]+"}],r:10},a.CLCM,a.CBLCLM,a.ASM,a.QSM,{cN:"class",bWK:true,e:"{",k:"class interface",eE:true,i:":",c:[{bWK:true,k:"extends implements",r:10},{cN:"title",b:a.UIR}]},a.CNM,{cN:"annotation",b:"@[A-Za-z]+"}]}}(hljs);hljs.LANGUAGES.php=function(a){var e={cN:"variable",b:"\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*"};var b=[a.inherit(a.ASM,{i:null}),a.inherit(a.QSM,{i:null}),{cN:"string",b:'b"',e:'"',c:[a.BE]},{cN:"string",b:"b'",e:"'",c:[a.BE]}];var c=[a.BNM,a.CNM];var d={cN:"title",b:a.UIR};return{cI:true,k:"and include_once list abstract global private echo interface as static endswitch array null if endwhile or const for endforeach self var while isset public protected exit foreach throw elseif include __FILE__ empty require_once do xor return implements parent clone use __CLASS__ __LINE__ else break print eval new catch __METHOD__ case exception php_user_filter default die require __FUNCTION__ enddeclare final try this switch continue endfor endif declare unset true false namespace trait goto instanceof insteadof __DIR__ __NAMESPACE__ __halt_compiler",c:[a.CLCM,a.HCM,{cN:"comment",b:"/\\*",e:"\\*/",c:[{cN:"phpdoc",b:"\\s@[A-Za-z]+"}]},{cN:"comment",eB:true,b:"__halt_compiler.+?;",eW:true},{cN:"string",b:"<<<['\"]?\\w+['\"]?$",e:"^\\w+;",c:[a.BE]},{cN:"preprocessor",b:"<\\?php",r:10},{cN:"preprocessor",b:"\\?>"},e,{cN:"function",bWK:true,e:"{",k:"function",i:"\\$|\\[|%",c:[d,{cN:"params",b:"\\(",e:"\\)",c:["self",e,a.CBLCLM].concat(b).concat(c)}]},{cN:"class",bWK:true,e:"{",k:"class",i:"[:\\(\\$]",c:[{bWK:true,eW:true,k:"extends",c:[d]},d]},{b:"=>"}].concat(b).concat(c)}}(hljs);hljs.LANGUAGES.python=function(a){var f={cN:"prompt",b:/^(>>>|\.\.\.) /};var c=[{cN:"string",b:/(u|b)?r?'''/,e:/'''/,c:[f],r:10},{cN:"string",b:/(u|b)?r?"""/,e:/"""/,c:[f],r:10},{cN:"string",b:/(u|r|ur)'/,e:/'/,c:[a.BE],r:10},{cN:"string",b:/(u|r|ur)"/,e:/"/,c:[a.BE],r:10},{cN:"string",b:/(b|br)'/,e:/'/,c:[a.BE]},{cN:"string",b:/(b|br)"/,e:/"/,c:[a.BE]}].concat([a.ASM,a.QSM]);var e={cN:"title",b:a.UIR};var d={cN:"params",b:/\(/,e:/\)/,c:["self",a.CNM,f].concat(c)};var b={bWK:true,e:/:/,i:/[${=;\n]/,c:[e,d],r:10};return{k:{keyword:"and elif is global as in if from raise for except finally print import pass return exec else break not with class assert yield try while continue del or def lambda nonlocal|10",built_in:"None True False Ellipsis NotImplemented"},i:/(<\/|->|\?)/,c:c.concat([f,a.HCM,a.inherit(b,{cN:"function",k:"def"}),a.inherit(b,{cN:"class",k:"class"}),a.CNM,{cN:"decorator",b:/@/,e:/$/},{b:/\b(print|exec)\(/}])}}(hljs);hljs.LANGUAGES.sql=function(a){return{cI:true,c:[{cN:"operator",b:"(begin|end|start|commit|rollback|savepoint|lock|alter|create|drop|rename|call|delete|do|handler|insert|load|replace|select|truncate|update|set|show|pragma|grant)\\b(?!:)",e:";",eW:true,k:{keyword:"all partial global month current_timestamp using go revoke smallint indicator end-exec disconnect zone with character assertion to add current_user usage input local alter match collate real then rollback get read timestamp session_user not integer bit unique day minute desc insert execute like ilike|2 level decimal drop continue isolation found where constraints domain right national some module transaction relative second connect escape close system_user for deferred section cast current sqlstate allocate intersect deallocate numeric public preserve full goto initially asc no key output collation group by union session both last language constraint column of space foreign deferrable prior connection unknown action commit view or first into float year primary cascaded except restrict set references names table outer open select size are rows from prepare distinct leading create only next inner authorization schema corresponding option declare precision immediate else timezone_minute external varying translation true case exception join hour default double scroll value cursor descriptor values dec fetch procedure delete and false int is describe char as at in varchar null trailing any absolute current_time end grant privileges when cross check write current_date pad begin temporary exec time update catalog user sql date on identity timezone_hour natural whenever interval work order cascade diagnostics nchar having left call do handler load replace truncate start lock show pragma exists number trigger if before after each row",aggregate:"count sum min max avg"},c:[{cN:"string",b:"'",e:"'",c:[a.BE,{b:"''"}],r:0},{cN:"string",b:'"',e:'"',c:[a.BE,{b:'""'}],r:0},{cN:"string",b:"`",e:"`",c:[a.BE]},a.CNM]},a.CBLCLM,{cN:"comment",b:"--",e:"$"}]}}(hljs);hljs.LANGUAGES.ini=function(a){return{cI:true,i:"[^\\s]",c:[{cN:"comment",b:";",e:"$"},{cN:"title",b:"^\\[",e:"\\]"},{cN:"setting",b:"^[a-z0-9\\[\\]_-]+[ \\t]*=[ \\t]*",e:"$",c:[{cN:"value",eW:true,k:"on off true false yes no",c:[a.QSM,a.NM],r:0}]}]}}(hljs);hljs.LANGUAGES.perl=function(e){var a="getpwent getservent quotemeta msgrcv scalar kill dbmclose undef lc ma syswrite tr send umask sysopen shmwrite vec qx utime local oct semctl localtime readpipe do return format read sprintf dbmopen pop getpgrp not getpwnam rewinddir qqfileno qw endprotoent wait sethostent bless s|0 opendir continue each sleep endgrent shutdown dump chomp connect getsockname die socketpair close flock exists index shmgetsub for endpwent redo lstat msgctl setpgrp abs exit select print ref gethostbyaddr unshift fcntl syscall goto getnetbyaddr join gmtime symlink semget splice x|0 getpeername recv log setsockopt cos last reverse gethostbyname getgrnam study formline endhostent times chop length gethostent getnetent pack getprotoent getservbyname rand mkdir pos chmod y|0 substr endnetent printf next open msgsnd readdir use unlink getsockopt getpriority rindex wantarray hex system getservbyport endservent int chr untie rmdir prototype tell listen fork shmread ucfirst setprotoent else sysseek link getgrgid shmctl waitpid unpack getnetbyname reset chdir grep split require caller lcfirst until warn while values shift telldir getpwuid my getprotobynumber delete and sort uc defined srand accept package seekdir getprotobyname semop our rename seek if q|0 chroot sysread setpwent no crypt getc chown sqrt write setnetent setpriority foreach tie sin msgget map stat getlogin unless elsif truncate exec keys glob tied closedirioctl socket readlink eval xor readline binmode setservent eof ord bind alarm pipe atan2 getgrent exp time push setgrent gt lt or ne m|0 break given say state when";var d={cN:"subst",b:"[$@]\\{",e:"\\}",k:a,r:10};var b={cN:"variable",b:"\\$\\d"};var i={cN:"variable",b:"[\\$\\%\\@\\*](\\^\\w\\b|#\\w+(\\:\\:\\w+)*|[^\\s\\w{]|{\\w+}|\\w+(\\:\\:\\w*)*)"};var f=[e.BE,d,b,i];var h={b:"->",c:[{b:e.IR},{b:"{",e:"}"}]};var g={cN:"comment",b:"^(__END__|__DATA__)",e:"\\n$",r:5};var c=[b,i,e.HCM,g,{cN:"comment",b:"^\\=\\w",e:"\\=cut",eW:true},h,{cN:"string",b:"q[qwxr]?\\s*\\(",e:"\\)",c:f,r:5},{cN:"string",b:"q[qwxr]?\\s*\\[",e:"\\]",c:f,r:5},{cN:"string",b:"q[qwxr]?\\s*\\{",e:"\\}",c:f,r:5},{cN:"string",b:"q[qwxr]?\\s*\\|",e:"\\|",c:f,r:5},{cN:"string",b:"q[qwxr]?\\s*\\<",e:"\\>",c:f,r:5},{cN:"string",b:"qw\\s+q",e:"q",c:f,r:5},{cN:"string",b:"'",e:"'",c:[e.BE],r:0},{cN:"string",b:'"',e:'"',c:f,r:0},{cN:"string",b:"`",e:"`",c:[e.BE]},{cN:"string",b:"{\\w+}",r:0},{cN:"string",b:"-?\\w+\\s*\\=\\>",r:0},{cN:"number",b:"(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b",r:0},{b:"("+e.RSR+"|\\b(split|return|print|reverse|grep)\\b)\\s*",k:"split return print reverse grep",r:0,c:[e.HCM,g,{cN:"regexp",b:"(s|tr|y)/(\\\\.|[^/])*/(\\\\.|[^/])*/[a-z]*",r:10},{cN:"regexp",b:"(m|qr)?/",e:"/[a-z]*",c:[e.BE],r:0}]},{cN:"sub",bWK:true,e:"(\\s*\\(.*?\\))?[;{]",k:"sub",r:5},{cN:"operator",b:"-\\w\\b",r:0}];d.c=c;h.c[1].c=c;return{k:a,c:c}}(hljs);hljs.LANGUAGES.json=function(a){var e={literal:"true false null"};var d=[a.QSM,a.CNM];var c={cN:"value",e:",",eW:true,eE:true,c:d,k:e};var b={b:"{",e:"}",c:[{cN:"attribute",b:'\\s*"',e:'"\\s*:\\s*',eB:true,eE:true,c:[a.BE],i:"\\n",starts:c}],i:"\\S"};var f={b:"\\[",e:"\\]",c:[a.inherit(c,{cN:null})],i:"\\S"};d.splice(d.length,0,b,f);return{c:d,k:e,i:"\\S"}}(hljs);hljs.LANGUAGES.cpp=function(a){var b={keyword:"false int float while private char catch export virtual operator sizeof dynamic_cast|10 typedef const_cast|10 const struct for static_cast|10 union namespace unsigned long throw volatile static protected bool template mutable if public friend do return goto auto void enum else break new extern using true class asm case typeid short reinterpret_cast|10 default double register explicit signed typename try this switch continue wchar_t inline delete alignof char16_t char32_t constexpr decltype noexcept nullptr static_assert thread_local restrict _Bool complex",built_in:"std string cin cout cerr clog stringstream istringstream ostringstream auto_ptr deque list queue stack vector map set bitset multiset multimap unordered_set unordered_map unordered_multiset unordered_multimap array shared_ptr"};return{k:b,i:"</",c:[a.CLCM,a.CBLCLM,a.QSM,{cN:"string",b:"'\\\\?.",e:"'",i:"."},{cN:"number",b:"\\b(\\d+(\\.\\d*)?|\\.\\d+)(u|U|l|L|ul|UL|f|F)"},a.CNM,{cN:"preprocessor",b:"#",e:"$",c:[{b:"<",e:">",i:"\\n"},a.CLCM]},{cN:"stl_container",b:"\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<",e:">",k:b,r:10,c:["self"]}]}}(hljs);
	
})(jQuery);