/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'], // Allow images from Cloudinary
    },
    experimental: {
        esmExternals: 'loose',
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Handle socket.io client side issues
        config.resolve.fallback = {
            ...config.resolve.fallback,
            net: false,
            tls: false,
            dns: false,
            fs: false,
        };

        // Ignore specific modules that cause issues
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(bufferutil|utf-8-validate)$/,
            })
        );

        return config;
    },
};

export default nextConfig;
