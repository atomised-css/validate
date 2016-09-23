import victorica from 'victorica';

import cssToDom from './css-to-dom';

const testString = '£337_H4X0R';

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
    await test('[colour="red"] {}', '<div colour="red"></div>');

    await test('p[colour=red] {}', '<p colour="red"></p>');
    await test('p[colour="red"] {}', '<p colour="red"></p>');

    await test('[colour~=red] {}', `<div colour="red ${testString}"></div>`);
    await test('[colour~="red"] {}', `<div colour="red ${testString}"></div>`);

    await test('[colour|=red] {}', `<div colour="red-${testString}"></div>`);
    await test('[colour|="red"] {}', `<div colour="red-${testString}"></div>`);

    await test('[colour^=red] {}', `<div colour="red${testString} ${testString}"></div>`);
    await test('[colour^="red"] {}', `<div colour="red${testString} ${testString}"></div>`);

    await test('[colour$=red] {}', `<div colour="${testString} ${testString}red"></div>`);
    await test('[colour$="red"] {}', `<div colour="${testString} ${testString}red"></div>`);

    await test('[colour*=red] {}', `<div colour="${testString}red${testString}"></div>`);
    await test('[colour*="red"] {}', `<div colour="${testString}red${testString}"></div>`);
});

it('nests descendents correctly', async () => {
    await test('.red > .blue > .green {}', `
        <div class="red">
            <div class="blue">
                <div class="green"></div>
            </div>
        </div>
    `);

    // create multiple depths of child/decendent selectors.
    // this is so we can distinguish between possible occurences
    // of otherwise identical child and decendent selectors
    await test('.red .blue .green {}', `
        <div class="red">
            <div>
                <div class="blue">
                    <div>
                        <div class="green"></div>
                    </div>
                </div>
            </div>
        </div>
    `);
});

it('nests siblings correctly', async () => {
    await test('.red + .blue + .green {}', '<div class="red"></div><div class="blue"></div><div class="green"></div>');

    // since we don't know if there will be an equivalent adjacent sibling selector,
    // we have to be able check that it would override the general sibling
    await test('.red ~ .blue ~ .green {}', `
        <div class="red"></div>
        <div class="blue"></div>
        <div class="blue"></div>
        <div class="green"></div>
        <div class="green"></div>
    `);
});

fit('expands pseudos correctly', async () => {
    await test('input[type=radio]:checked {}', '<input type="radio" checked="checked"></input><input type="radio"></input>');
    await test('input:disabled {}', '<input disabled="disabled"></input><input></input>');
    await test('input:enabled {}', '<input disabled="disabled"></input><input></input>');
    await test('input:invalid {}', '<input type="email" value="asdfgh"></input>');
    await test('input[type=href]:invalid {}', '<input type="href" value="asdfgh"></input>');

    await test('p:empty {}', `<p>${testString}</p><p></p>`);
    await test('p:link {}', '<p><a href="."></a></p>');
    await test('p:not(.p) {}', '<p></p>');
    await test(':lang(fr) > q {}', '<div lang="fr"><q></q></div>');

    await test('p:first-child {}', '<div><p></p><p></p></div>');
    await test('p:last-child {}', '<div><p></p><p></p></div>');
    await test('p:first-of-type {}', '<p></p><p></p>');
    await test('p:last-of-type {}', '<p></p><p></p>');

    await test('p:nth-child(even) {}', '<div><p></p><p></p><p></p></div>');
    await test('p:nth-child(odd) {}', '<div><p></p><p></p><p></p></div>');
    await test('p:nth-child(4) {}', '<div><p></p><p></p><p></p><p></p></div>');
    await test('p:nth-child(4n) {}', '<div><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p></div>');
    await test('p:nth-child(n+5) {}', '<div><p></p><p></p><p></p><p></p><p></p></div>');
    await test('p:nth-child(-n+5) {}', '<div><p></p><p></p><p></p><p></p><p></p><p></p></div>');
    await test('p:nth-child(4n+5) {}', '<div><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p></div>');
    await test('p:nth-child(4n-5) {}', '<div><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p></div>');
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
