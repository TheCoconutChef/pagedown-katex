angular.module('pagedownKatex')
    .factory('katexHtmlRenderer', [function () {
        var findEndOfMath = function (delimiter, text, startIndex) {
            // Adapted from
            // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
            var index = startIndex;
            var braceLevel = 0;

            var delimLength = delimiter.length;

            while (index < text.length) {
                var character = text[index];

                if (braceLevel <= 0 &&
                    text.slice(index, index + delimLength) === delimiter) {
                    return index;
                } else if (character === "\\") {
                    index++;
                } else if (character === "{") {
                    braceLevel++;
                } else if (character === "}") {
                    braceLevel--;
                }

                index++;
            }

            return -1;
        };

        function splitAtDelimiters(startData, leftDelim, rightDelim, display) {
            var finalData = [];

            for (var i = 0; i < startData.length; i++) {
                if (startData[i].type === "text") {
                    var text = startData[i].data;

                    var lookingForLeft = true;
                    var currIndex = 0;
                    var nextIndex;

                    nextIndex = text.indexOf(leftDelim);
                    if (nextIndex !== -1) {
                        currIndex = nextIndex;
                        finalData.push({
                            type: "text",
                            data: text.slice(0, currIndex)
                        });
                        lookingForLeft = false;
                    }

                    while (true) {
                        if (lookingForLeft) {
                            nextIndex = text.indexOf(leftDelim, currIndex);
                            if (nextIndex === -1) {
                                break;
                            }

                            finalData.push({
                                type: "text",
                                data: text.slice(currIndex, nextIndex)
                            });

                            currIndex = nextIndex;
                        } else {
                            nextIndex = findEndOfMath(
                                rightDelim,
                                text,
                                currIndex + leftDelim.length);
                            if (nextIndex === -1) {
                                break;
                            }

                            finalData.push({
                                type: "math",
                                data: text.slice(
                                    currIndex + leftDelim.length,
                                    nextIndex),
                                rawData: text.slice(
                                    currIndex,
                                    nextIndex + rightDelim.length),
                                display: display
                            });

                            currIndex = nextIndex + rightDelim.length;
                        }

                        lookingForLeft = !lookingForLeft;
                    }

                    finalData.push({
                        type: "text",
                        data: text.slice(currIndex)
                    });
                } else {
                    finalData.push(startData[i]);
                }
            }

            return finalData;
        };

        function splitWithDelimiters(text, delimiters) {
            var data = [{
                type: "text",
                data: text
            }];
            for (var i = 0; i < delimiters.length; i++) {
                var delimiter = delimiters[i];
                data = splitAtDelimiters(
                    data, delimiter.left, delimiter.right,
                    delimiter.display || false);
            }
            return data;
        };

        function renderMathInText(text, delimiters) {
            var data = splitWithDelimiters(text, delimiters);

            var fragment = document.createDocumentFragment();

            for (var i = 0; i < data.length; i++) {
                if (data[i].type === "text") {
                    fragment.appendChild(document.createTextNode(data[i].data));
                } else {
                    var span = document.createElement("span");
                    var math = data[i].data;
                    try {
                        katex.render(math, span, {
                            displayMode: data[i].display
                        });
                    } catch (e) {
                        if (!(e instanceof katex.ParseError)) {
                            throw e;
                        }
                        console.error(
                            "KaTeX auto-render: Failed to parse `" + data[i].data +
                            "` with ",
                            e
                        );
                        fragment.appendChild(document.createTextNode(data[i].rawData));
                        continue;
                    }
                    fragment.appendChild(span);
                }
            }

            return fragment;
        };

        function renderElem(elem, delimiters, ignoredTags) {
            for (var i = 0; i < elem.childNodes.length; i++) {
                var childNode = elem.childNodes[i];
                if (childNode.nodeType === 3) {
                    // Text node
                    var frag = renderMathInText(childNode.textContent, delimiters);
                    i += frag.childNodes.length - 1;
                    elem.replaceChild(frag, childNode);
                } else if (childNode.nodeType === 1) {
                    // Element node
                    var shouldRender = ignoredTags.indexOf(
                        childNode.nodeName.toLowerCase()) === -1;

                    if (shouldRender) {
                        renderElem(childNode, delimiters, ignoredTags);
                    }
                }
                // Otherwise, it's something else, and ignore it.
            }
        };

        /**
         *
         */
        function getRenderedHtml(htmlString, options) {
            if (htmlString === '') {
                return '';
            }
            var delimiters = options.delimiters;
            
            var ignoredTags = options.ignoredTags;

            var domElems = $(htmlString).get();

            var elem = $('<div></div>');

            for (i = 0; i < domElems.length; i++) {
                renderElem(domElems[i], delimiters, ignoredTags);
                elem.append(domElems[i]);
            }

            return elem.html();
        };

        // LaTeX uses this, but it ruins the display of normal `$` in text:
        // {left: "$", right: "$", display: false}
        var defaultOptions = {
            delimiters: [
                {
                    left: "$$",
                    right: "$$",
                    display: true
                },
                {
                    left: "\\[",
                    right: "\\]",
                    display: true
                },
                {
                    left: "\\(",
                    right: "\\)",
                    display: false
                }
            ],
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
        };

        return {
            getRenderedHtml: getRenderedHtml
        };
    }]);