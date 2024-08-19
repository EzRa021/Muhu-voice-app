/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      domains: ['randomuser.me', 'firebasestorage.googleapis.com'], // Add Firebase Storage domain
  },
};

export default nextConfig;
