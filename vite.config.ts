import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
// import eslintPlugin from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        base: `/ccm/${process.env.VITE_KEY}/`,
        plugins: [vue()], // eslintPlugin() temporarily disabled
        resolve: {
            dedupe: ['vue'],
            alias: {
                '@': '/src',
                '@churchtools/utils': '/workspaces/churchtools/frontend-packages/utils/dist/churchtools-utils.js',
            },
            conditions: ['ct-mono-repo', 'import', 'module', 'browser', 'default'],
        },
        build: {
            rollupOptions: {
                external: [
                    /^@churchtools\//,
                    /^@tanstack\//,
                    'pinia',
                    'vue',
                ],
            },
        },
        server: {
            host: '0.0.0.0',
            port: 5173,
            allowedHosts: true,
        },
    });
};
