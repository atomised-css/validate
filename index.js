import {readFileSync} from 'fs';

import postcss from 'postcss';
import uniq from 'lodash.uniq';
// import satisfy from 'satisfy.js';
// import { create } from 'phantom';
// import jsdom from 'jsdom';
import selectorParser from 'postcss-selector-parser';
import posthtml from 'posthtml';
import _ from 'lodash';

// postcss().process(originalCSS)
// 	.then(result => {
// 		result.root.walkRules(rule => {
// 			[].push.apply(selectors, rule.selector.replace(/\s/g, '').split(','));
// 		});
// 		const uniqSelectors = uniq(selectors);
// 		const html = uniqSelectors.map(selector => satisfy(selector)).join('\n');
// 		console.log(html);
// 	})
// 	.catch(console.log);

try {
	(async () => {
		const originalCSS = readFileSync('./test/original.css', 'utf8');

		const selectors = [];
		//
		// // const instance = await create();
	    // // const page = await instance.createPage();
		const processedCSS = await postcss().process(originalCSS);

		await processedCSS.root.walkRules(rule => {
			[].push.apply(selectors, rule.selector.split(','));
		});
		//
		const uniqSelectors = uniq(selectors);

		const transformer = function (selectors) {
		    selectors.each(function (selector) {
		        // do something with the selector
				selector.nodes.map(node => {
					const {value, type} = node;
			        console.log(`${value} (${type})`)
					// if (type === 'class') {
					// 	const x = posthtml().process('<div/>', { sync: true });
					// 	const y = posthtml().process('<p/>', { sync: true }).tree;
					// 	x.tree.content = y;
					// 	console.log(JSON.stringify(posthtml().process('<p/>', { sync: true }).tree, null, 2));
					// 	// console.log(x);
					// 	// console.log(JSON.stringify(posthtml().process('<div><p/></div>', { sync: true }), null, 2));
					// }
				})
		    });
		};

		uniqSelectors.forEach(selector => {
			selectorParser(transformer).process(selector).result;
		})

		// function dick (a) {
		// 	console.log(a);
		// }
		//
		//
		// jsdom.env('', [
		// 	'https://raw.githubusercontent.com/dmnevius/Placebo/master/dist/placebo-full.js'
		// ], function (err, window) {
		// 	if(err){console.log(err)}
		// 	console.log(window.document.documentElement.innerHTML);
		// 	dick(uniqSelectors.map(selector => {
		// 		console.log(selector);
		// 		console.log(window.placebo(selector).html());
		// 		return ''
		// 	}).join('\n'))
		// 	window.close();
		// })





		// console.log(satisfy);

		// const html = await page.evaluate(
	    // 	function () {
	    //     	return uniqSelectors.map(selector => satisfy(selector)).join('\n');
	    //     }
	    // , uniqSelectors);
		// await page.close();
	    // await instance.exit();
		// console.log(html);
	})()
} catch (e) {
	console.log(e);
}
