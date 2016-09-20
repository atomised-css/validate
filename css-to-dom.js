/* eslint-disable no-param-reassign */


import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import uniq from 'lodash.uniq';
import emmet from 'emmet';

export default async (originalCSS) => {
    // converts a selector into something that emmet can use
    function normaliseForEmmet(selector) {
        selector.walkPseudos(pseudo => {
            switch (pseudo.value) {
                case ':first-child': {
                    const parent = pseudo.parent;
                    parent.removeChild(pseudo);
                    parent.last.value += '*2';
                    break;
                }
            }
        });

        selector.walkUniversals(universal => {
            console.log('hi universal');
            universal.value = 'div';
        });

        selector.walkCombinators(combinator => {
            if (combinator.value === ' ') {
                combinator.value = '>';
                combinator.parent.insertBefore(combinator, combinator.clone());
                combinator.parent.insertBefore(combinator, combinator.next().clone());
            }
            if (combinator.value === '~') {
                combinator.value = '+';
                combinator.next().value += '*2';
            }
        });

        selector.walkAttributes(attribute => {
            // eslint-disable-next-line default-case
            switch (attribute.operator) {
                case '~=':
                    attribute.value = `'${attribute.raws.unquoted} test'`;
                    break;
                case '|=':
                    attribute.value = `'${attribute.raws.unquoted}-test'`;
                    break;
                case '^=':
                    attribute.value = `'${attribute.raws.unquoted}test test'`;
                    break;
                case '$=':
                    attribute.value = `'test test${attribute.raws.unquoted}'`;
                    break;
                case '*=':
                    attribute.value = `'test${attribute.raws.unquoted}test'`;
                    break;
            }
            attribute.operator = '=';
        });
    }

    return postcss().process(originalCSS).then(processedCSS => {
        const selectorPromises = [];

        processedCSS.root.walkRules((rule) => {
            selectorPromises.push(...rule.selector.split(',').map(selector =>
                selectorParser(normaliseForEmmet).process(selector, { lossless: false })
            ));
        });

        return Promise.all(selectorPromises)
            .then(selectors => selectors.map(selector => selector.result))
            // .then(selectors => {
            //     console.log(selectors);
            //     return selectors;
            // })
            .then(selectors => uniq(selectors))
            .then(selectors => selectors.reduce((src, selector) =>
                `${src} ${emmet.expandAbbreviation(selector).replace(/\$\{0\}/g, '')}`
            , ''))
            .then(html => html.trim());
    });
};
