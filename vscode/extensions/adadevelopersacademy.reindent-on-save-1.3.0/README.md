# Reindent on Save #

A simple VSCode formatter extension that wraps `editor.action.reindentlines`.

This allows things like formatting on save and "Format Document".

Based on example code here: https://github.com/jrieken/vscode-formatter-sample.

This extension is language agnostic.  So long as your language extension has indentation rules this should work for you.

Tested against VS Code 1.35.1

## Supported Languages ##

While theoretically this will work with any programming language the built-in indentation logic in VS Code leaves much to be desired.

The following languages have been tested and will indent by default:
* Ruby
* JSON

## Reindent for all file types ##

If you would like to reindent for all file types you will need to add `"editor.formatOnSave": true` to your settings.json.

To go from this:
```
{
    "a setting": 42,
    "another example setting": "Hello, world!",
}
```

to:
```
{
    "a setting": 42,
    "another example setting": "Hello, world!",
    "editor.formatOnSave": true
}
```
