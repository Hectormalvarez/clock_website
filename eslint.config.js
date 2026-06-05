import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports' },
			],
			'no-console': ['warn', { allow: ['error', 'warn'] }],
		},
	},
	{
		ignores: ['dist/', 'node_modules/', 'eslint.config.js', 'vite.config.ts'],
	},
);
