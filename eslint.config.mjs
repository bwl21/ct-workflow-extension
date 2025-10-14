import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginVue from 'eslint-plugin-vue';

import typescriptEslint from 'typescript-eslint';
import globals from 'globals';

export default typescriptEslint.config(
    { ignores: ['*.d.ts', '**/coverage', '**/dist'] },
    {
        extends: [
            eslint.configs.recommended,
            ...typescriptEslint.configs.recommended,
            ...eslintPluginVue.configs['flat/recommended'],
        ],
        files: ['**/*.vue', '**/*.ts'],
        languageOptions: {
            parserOptions: {
                parser: typescriptEslint.parser,
                extraFileExtensions: ['.vue'],
                sourceType: 'module',
            },
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },

        rules: {
            // Vue rules
            'vue/multi-word-component-names': 'off',
            'vue/no-reserved-component-names': 'off',
            'vue/no-v-html': 'off',
            'vue/no-parsing-error': 'off', // Disable for template expressions
            'vue/attributes-order': 'warn', // Warning instead of error
            'vue/require-default-prop': 'off', // Not needed with TypeScript
            
            // TypeScript rules - relaxed for flexibility
            '@typescript-eslint/no-explicit-any': 'off', // Allow any for plugin system
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/ban-ts-comment': 'warn', // Allow @ts-ignore with warning
            
            // General rules
            'no-undef': 'off',
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            'prefer-const': 'warn',
        },
    },
    eslintConfigPrettier
);
