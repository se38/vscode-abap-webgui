import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWebguiUrl, icmPortFor, parseEndpoint } from './urlBuilder.ts';

const endpoint = { protocol: 'https', host: 'sap.example.com', port: 44300 } as const;

test('base url', () => {
  assert.equal(buildWebguiUrl(endpoint), 'https://sap.example.com:44300/sap/bc/gui/sap/its/webgui');
});

test('default port is omitted', () => {
  assert.equal(
    buildWebguiUrl({ protocol: 'https', host: 'h', port: 443 }),
    'https://h/sap/bc/gui/sap/its/webgui',
  );
  assert.equal(
    buildWebguiUrl({ protocol: 'http', host: 'h' }),
    'http://h/sap/bc/gui/sap/its/webgui',
  );
});

test('transaction is upper-cased and encoded', () => {
  assert.equal(
    buildWebguiUrl(endpoint, { kind: 'transaction', name: 'se38' }),
    'https://sap.example.com:44300/sap/bc/gui/sap/its/webgui?~transaction=SE38',
  );
  assert.match(buildWebguiUrl(endpoint, { kind: 'transaction', name: '/n/foo' }), /~transaction=%2FN%2FFOO$/);
});

test('program runs SA38 with the report pre-filled', () => {
  const url = buildWebguiUrl(endpoint, { kind: 'program', name: 'zdemo' });
  assert.equal(
    url,
    'https://sap.example.com:44300/sap/bc/gui/sap/its/webgui?~transaction=*SA38%20RS38M-PROGRAMM%3DZDEMO%3BDYNP_OKCODE%3DSTRT',
  );
  assert.equal(
    decodeURIComponent(new URL(url).searchParams.get('~transaction')!),
    '*SA38 RS38M-PROGRAMM=ZDEMO;DYNP_OKCODE=STRT',
  );
});

test('namespaced program names survive encoding', () => {
  const url = buildWebguiUrl(endpoint, { kind: 'program', name: '/ns/report' });
  assert.equal(new URL(url).searchParams.get('~transaction'), '*SA38 RS38M-PROGRAMM=/NS/REPORT;DYNP_OKCODE=STRT');
});

test('client and language are appended', () => {
  assert.equal(
    buildWebguiUrl(endpoint, { kind: 'transaction', name: 'SE80' }, { client: '100', language: 'EN' }),
    'https://sap.example.com:44300/sap/bc/gui/sap/its/webgui?~transaction=SE80&sap-client=100&sap-language=EN',
  );
  assert.equal(
    buildWebguiUrl(endpoint, { kind: 'base' }, { client: '001' }),
    'https://sap.example.com:44300/sap/bc/gui/sap/its/webgui?sap-client=001',
  );
});

test('parseEndpoint', () => {
  assert.deepEqual(parseEndpoint('https://h:44300/ignored'), { protocol: 'https', host: 'h', port: 44300 });
  assert.deepEqual(parseEndpoint('h:8000', 'http'), { protocol: 'http', host: 'h', port: 8000 });
  assert.equal(parseEndpoint(''), undefined);
  assert.equal(parseEndpoint('ftp://h'), undefined);
});

test('icmPortFor', () => {
  assert.equal(icmPortFor('https', '00'), 44300);
  assert.equal(icmPortFor('http', '01'), 8001);
  assert.equal(icmPortFor('http', 'x'), undefined);
});

test('saml2 is appended, alone or with other parameters', () => {
  const host = { protocol: 'https', host: 's4ides.neptune-software.com' } as const;
  assert.equal(
    buildWebguiUrl(host, { kind: 'base' }, { client: '100', language: 'EN', saml2: 'disabled' }),
    'https://s4ides.neptune-software.com/sap/bc/gui/sap/its/webgui?sap-client=100&sap-language=EN&SAML2=disabled',
  );
  assert.equal(
    buildWebguiUrl(host, { kind: 'base' }, { saml2: 'disabled' }),
    'https://s4ides.neptune-software.com/sap/bc/gui/sap/its/webgui?SAML2=disabled',
  );
});
