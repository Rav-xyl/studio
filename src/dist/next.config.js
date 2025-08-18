"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
    experimental: {
        // This is required to allow requests from the Firebase Studio environment.
        allowedDevOrigins: ["*.cloudworkstations.dev"],
    },
};
exports.default = nextConfig;
