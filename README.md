# Awqat Salah Client

[![npm package](https://img.shields.io/badge/npm%20i-@xsor/awqat-salah-client-brightgreen)](https://www.npmjs.com/package/@xsor/awqat-salah-client)
[![downloads](https://img.shields.io/npm/dt/@xsor/awqat-salah-client)](https://www.npmjs.com/package/@xsor/awqat-salah-client)
[![version](https://img.shields.io/npm/v/@xsor/awqat-salah-client)](https://github.com/xsorifc28/awqat-salah-client/releases)
[![coverage](https://img.shields.io/codecov/c/github/xsorifc28/awqat-salah-client)](https://app.codecov.io/gh/xsorifc28/awqat-salah-client)
[![test](https://img.shields.io/github/actions/workflow/status/xsorifc28/awqat-salah-client/test.yml?branch=main&label=tests)](https://github.com/xsorifc28/awqat-salah-client/actions/workflows/test.yml)
[![build](https://img.shields.io/github/actions/workflow/status/xsorifc28/awqat-salah-client/publish.yml)](https://github.com/xsorifc28/awqat-salah-client/actions/workflows/publish.yml)
[![License](https://img.shields.io/github/license/xsorifc28/awqat-salah-client)](https://github.com/xsorifc28/awqat-salah-client/blob/main/LICENSE)

## Description

A client library for [Diyanet's Awqat Salah Rest API Service](https://awqatsalah.diyanet.gov.tr/index.html) for fetching Islamic prayer times across different geographical locations. Instructions for obtaining a username and password required to authenticate with the API can be found

Contains the following modules:
- a CommonJS (in **dist/cjs** folder)
- ES Modules (in **dist/esm** folder)
- bundled and minified UMD (in **dist/umd** folder)
- TypeScript declaration files (in **dist/types** folder)

## Usage

### Node/Browser
1. Install the package
```bash
npm install @xsor/awqat-salah-client
```
2. Import and use the `AwqatSalahApi` function
```typescript
import { AwqatSalahApi } from '@xsor/awqat-salah-client';

(async () => {
    const api = new AwqatSalahApi();

    await api.login('email', 'password');

    const dailyContent = await api.dailyContent();
    console.info(`Got daily content, day of year: ${dailyContent?.dayOfYear}`);

})();
```

## Contributing

Feel free to make a pull request and file issues on the repository page!

### Test

Test your code with Jest framework:

```bash
npm run test
```

**Note:** Uses [husky](https://typicode.github.io/husky/) and [commitlint](https://commitlint.js.org/) to automatically execute test and [lint commit message](https://www.conventionalcommits.org/) before every commit.

### Build

Build production (distribution) files in your **dist** folder:

```bash
npm run build
```
