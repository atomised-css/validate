import victorica from 'victorica';

import cssToDom from '../css-to-dom';

const test = async (css, html) => {
    const htmlFromCSS = await cssToDom(css);
    expect(victorica(htmlFromCSS)).toBe(victorica(html));
};

it('expands tags correctly', async () => {
    await test('p {}', '<p></p>');
    await test('* {}', '<div></div>');
    await test('p > * {}', '<p><div></div></p>');
});

it('expands classes correctly', async () => {
    await test('.red {}', '<div class="red"></div>');
    await test('.red.blue {}', '<div class="red blue"></div>');
});

it('expands IDs correctly', async () => {
    await test('#red {}', '<div id="red"></div>');
});

it('expands attributes correctly', async () => {
    await test('[colour] {}', '<div colour=""></div>');
    await test('p[colour] {}', '<p colour=""></p>');

    await test('[colour=red] {}', '<div colour="red"></div>');
    await test('p[colour=red] {}', '<p colour="red"></p>');
    await test('[colour~=red] {}', '<div colour="red test"></div>');
    await test('[colour|=red] {}', '<div colour="red-test"></div>');
    await test('[colour^=red] {}', '<div colour="redtest test"></div>');
    await test('[colour$=red] {}', '<div colour="test testred"></div>');
    await test('[colour*=red] {}', '<div colour="testredtest"></div>');

    await test('[colour="red"] {}', '<div colour="red"></div>');
    await test('p[colour="red"] {}', '<p colour="red"></p>');
    await test('[colour~="red"] {}', '<div colour="red test"></div>');
    await test('[colour|="red"] {}', '<div colour="red-test"></div>');
    await test('[colour^="red"] {}', '<div colour="redtest test"></div>');
    await test('[colour$="red"] {}', '<div colour="test testred"></div>');
    await test('[colour*="red"] {}', '<div colour="testredtest"></div>');
});

it('nests descendents correctly', async () => {
    await test('.red > .blue {}', '<div class="red"><div class="blue"></div></div>');

    // since we don't know if there will be an equivalent child selector,
    // we have to be able check that it would override decendent sibling
    await test('.red .blue {}', `
        <div class="red">
            <div class="blue">
                <div class="blue"></div>
            </div>
        </div>
    `);
});

it('nests siblings correctly', async () => {
    await test('.red + .blue {}', '<div class="red"></div><div class="blue"></div>');

    // since we don't know if there will be an equivalent adjacent sibling selector,
    // we have to be able check that it would override the general sibling
    await test('.red ~ .blue {}', `
        <div class="red"></div>
        <div class="blue"></div>
        <div class="blue"></div>
    `);
});

fit('expands pseudos correctly', async () => {
    await test('p:first-child {}', '<div><p></p><p></p></div>');
});

it('expands complex selectors correctly', async () => {
    await test('.red > p ~ i {}', `
        <div class="red">
            <p></p>
            <i></i>
            <i></i>
        </div>
    `);
});

it('expands chained selectors correctly', async () => {
    await test('p, i {}', '<p></p><i></i>');
    await test('.red > q ~ q, i {}', '<div class="red"><q></q><q></q><q></q></div><i></i>');
});
