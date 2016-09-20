/* eslint-disable no-console */

import { readFileSync } from 'fs';

import postcss from 'postcss';
import uniq from 'lodash.uniq';
import selectorParser from 'postcss-selector-parser';

import emmet from 'emmet';

async () => {
        const originalCSS = readFileSync('./test/original.css', 'utf8');

        const selectors = [];
        const processedCSS = await postcss().process(originalCSS);

        // converts a selector into something that emmet can use
        function normaliseForEmmet(container) {
            container.walkCombinators(combinator => {
                if (combinator.value === ' ') {
                    // eslint-disable-next-line no-param-reassign
                    combinator.value = '>';
                }
                if (combinator.value === '~') {
                    /* eslint-disable no-param-reassign */
                    // this is just how postcss works
                    combinator.value = '+';
                    combinator.next().value += '*2';
                    /* eslint-enable no-param-reassign */
                }
            });
        }

        await processedCSS.root.walkRules(async (rule) => {
            const parsedSelector = await selectorParser(normaliseForEmmet).process(rule.selector, { lossless: false });
            selectors.push(parsedSelector.result);
        });

        const html = uniq(selectors).reduce((src, selector) =>
            `${src} ${emmet.expandAbbreviation(selector)}`
        , '');

        console.log(html);
    })();
