import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
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
