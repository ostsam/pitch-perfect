# Original request / feature

Make on-save formatting match lint defaults; replace tabs with two spaces via consistent config.

# Challenges

- No existing Prettier or editor config; unsure which formatter runs on save.
- Need alignment without changing lint/prettier plugin setup.

# Successes

- Added explicit Prettier config and EditorConfig for spacing/line endings.
- Set workspace VS Code settings to use Prettier on save; ESLint remains for quality.

# Methods that did/didn’t work

- Worked: Define Prettier defaults (2-space, LF), add .editorconfig, set VS Code formatter to Prettier, leave eslint-plugin-prettier in place.
- Not needed: Changing ESLint rules or removing prettier plugin.

# Changes made to the codebase (≤50 lines per snippet)

```
prettier.config.js
/** @type {import("prettier").Config} */
const config = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
};
export default config;
```

```
.editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

```
.vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[javascriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "eslint.format.enable": false,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```
