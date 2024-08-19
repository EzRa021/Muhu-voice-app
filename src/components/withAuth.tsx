// /components/withAuth.tsx
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const withAuth = (WrappedComponent: React.FC) => {
  return (props: any) => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        // If user is not authenticated, redirect to login page
        router.push('/auth/signin');
      }
    }, [user, router]);

    // If user is authenticated, render the wrapped component
    if (user) {
      return <WrappedComponent {...props} />;
    }

    // Optionally, render a loading state while redirecting
    return <p>Loading...</p>;
  };
};

export default withAuth;
