const { defineConfig } = require('eslint/config');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
		},
		rules: {
			semi: "error",
			"prefer-const": "error",
		},
		extends: [eslintConfigPrettier],
	},
]);
