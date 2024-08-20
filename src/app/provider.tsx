// src/app/Providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import { AuthProvider } from "@/context/AuthContext";
// import { UserProvider } from "@/context/UserContext";
// import { WebSocketProvider } from "@/context/WebSocketContext";
// import { FriendsProvider } from "@/context/FriendsContext";
// import { MessageProvider } from "@/context/MessageContext";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <UserProvider> */}
        {/* <WebSocketProvider> */}
          {/* <FriendsProvider> */}
            {/* <MessageProvider> */}
              {/* <AuthProvider> */}
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                </ThemeProvider>
              {/* </AuthProvider> */}
            {/* </MessageProvider> */}
          {/* </FriendsProvider> */}
        {/* </WebSocketProvider> */}
      {/* </UserProvider> */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
