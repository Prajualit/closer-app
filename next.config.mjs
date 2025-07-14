/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Handle socket.io client side issues
        config.resolve.fallback = {
            ...config.resolve.fallback,
            net: false,
            tls: false,
            dns: false,
            fs: false,
            ws: false,
        };

        // Ignore specific modules that cause issues
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(bufferutil|utf-8-validate|ws)$/,
            })
        );

        // Externalize ws for server-side
        if (isServer) {
            config.externals.push('ws');
        }

        return config;
    },
};

export default nextConfig;
