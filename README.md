Running tests:

```
yarn test
```

Testing a specific browser:

```
yarn test --browsers FirefoxNightly
```

In test watch mode:

```
npx karma start --browsers FirefoxNightly
```

The version of `karma-firefox-launcher` used here should work under WSL but for
Chrome you'll want to use something like:

```
CHROME_BIN=/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe npx karma start --browsers Chrome
```

That will complain about not being able to write to the temp directory but
otherwise should be fine.
