/* eslint-disable no-param-reassign */


import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import uniq from 'lodash.uniq';
import emmet from 'emmet';

const emmetProfile = emmet.profile.create('test', {
    place_cursor: false,
    self_closing_tag: false,
    compact_bool: false,
    tag_nl: false,
});

const testString = '£337_H4X0R';
const testTag = '£337_H4X0R';

function getPseudoRoot(pseudo) {
    const prev = pseudo.prev();
    if (prev.type === 'pseudo') {
        return getPseudoRoot(prev);
    }
    return prev;
}

function bumpInstance(node) {
    let count = 2;
    node.value = `${node.value.replace(/\*(\d+)$/, (match, currentCount) => {
        // if this node is already bumped, set count to 1 more of that
        count = parseInt(currentCount, 10) + 1;
    })}*${count}`;
}

function unquote(string) {
    return string.replace(/"|'/g, '');
}

// converts a selector into something that emmet can use
function normaliseForEmmet(selector) {
    console.log(selector, 'pre-normalised');
    const normalised = selectorParser(parsedSelector => {
        // some things are easier with the selector parser, other things not...
        parsedSelector.walkUniversals(universal => {
            universal.value = 'div';
        });

        if (parsedSelector.first.first.type === 'pseudo') {
            parsedSelector.first.prepend(selectorParser.tag({ value: 'div' }));
        }

        parsedSelector.walkCombinators(combinator => {
            switch (combinator.value) {
                case ' ':
                    // .red .blue .green => .red>.blue>.blue>.green>.green
                    // this is in case there is also a `.red > .blue`
                    // equivalent; means we can distinguish their effects
                    combinator.value = '>div>'; // silly hack, because adding nodes confuses walk* methods
                    break;
                case '~':
                    // .red ~ .blue => .red+.blue*2
                    combinator.value = '+';
                    combinator.next().value += '*2';
                    break;
                default: // do nothing
            }
        });

        // some pseudos are more easily handled with regexes below
        parsedSelector.walkPseudos(pseudo => {
            const pseudoRoot = getPseudoRoot(pseudo);
            switch (pseudo.value) {
                case ':first-child':
                case ':last-child': {
                    // p:first-child => div>p*2
                    bumpInstance(pseudoRoot);
                    pseudoRoot.value = `div>${pseudoRoot.value}`;
                    pseudo.parent.removeChild(pseudo);
                    break;
                }
                case ':first-of-type': {
                    // p:first-of-type => p+p
                    bumpInstance(pseudoRoot);
                    pseudo.parent.removeChild(pseudo);
                    break;
                }
                case ':empty': {
                    // p:empty => p+p{£337_H4X0R}
                    pseudoRoot.value = `${pseudoRoot.value}{${testString}}+${pseudoRoot.value}`;
                    pseudo.parent.removeChild(pseudo);
                    break;
                }
                default: // do nothing
            }
        });

        parsedSelector.walkAttributes(attribute => {
            switch (attribute.operator) {
                case '~=':
                    // [colour~=red] => [colour~='red £337_H4X0R']
                    attribute.value = `'${attribute.raws.unquoted} ${testString}'`;
                    break;
                case '|=':
                    // [colour|=red] => [colour|='red-£337_H4X0R']
                    attribute.value = `'${attribute.raws.unquoted}-${testString}'`;
                    break;
                case '^=':
                    // [colour^=red] => [colour^='red£337_H4X0R £337_H4X0R']
                    attribute.value = `'${attribute.raws.unquoted}${testString} ${testString}'`;
                    break;
                case '$=':
                    // [colour$=red] => [colour$='£337_H4X0R £337_H4X0Rred']
                    attribute.value = `'${testString} ${testString}${attribute.raws.unquoted}'`;
                    break;
                case '*=':
                    // [colour*=red] => [colour*='£337_H4X0Rred£337_H4X0R']
                    attribute.value = `'${testString}${attribute.raws.unquoted}${testString}'`;
                    break;
                default: // do nothing
            }
            // all operators should be `=` for emmet
            attribute.operator = '=';
        });
    }).process(selector, { lossless: false }).result
        .replace(/:(first-child|last-child)/g, (match, pseudo, offset, string) =>
            `[${pseudo}]${string.slice(offset + match.length)}+${string.slice(0, offset)}`
        )
        .replace(/:(checked|disabled)/g, (match, pseudo, offset, string) =>
            `[${pseudo}]${string.slice(offset + match.length)}+${string.slice(0, offset)}`
        )
        .replace(/:(enabled)/g, (match, pseudo, offset, string) =>
            `[disabled]${string.slice(offset + match.length)}+${string.slice(0, offset)}`
        )
;
    console.log(normalised, 'normalised');
    return normalised;
}

export default async (originalCSS) => {
    return postcss().process(originalCSS).then(processedCSS => {
        const selectorPromises = [];

        processedCSS.root.walkRules((rule) => {
            selectorPromises.push(...rule.selector.split(',').map(selector =>
                normaliseForEmmet(selector)
            ));
        });

        return Promise.all(selectorPromises)
            // .then(selectors => selectors.map(selector => selector.result))
            .then(selectors => {
                // console.log(selectors);
                return selectors;
            })
            .then(selectors => uniq(selectors))
            .then(selectors => selectors.reduce((src, selector) =>
                `${src} ${emmet.expandAbbreviation(selector, emmetProfile).replace(/\$\{0\}/g, '')}`
            , ''))
            .then(html => html.trim());
    });
};
