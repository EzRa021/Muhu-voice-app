/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      domains: ['randomuser.me', 'firebasestorage.googleapis.com', 'images.unsplash.com'], // Add Firebase Storage domain
  },
};

export default nextConfig;
