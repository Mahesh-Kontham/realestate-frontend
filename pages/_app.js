import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/Layout";

export default function MyApp({ Component, pageProps, router }) {
  // All AUTH pages that should NOT show sidebar/navbar
  const authPages = ["/", "/login", "/signup"];

  const isAuthPage = authPages.includes(router.pathname);

  return (
    <ThemeProvider attribute="class">
      {isAuthPage ? (
        // ⚠ No dashboard layout for login/signup
        <Component {...pageProps} />
      ) : (
        // ✅ Dashboard layout for all protected pages
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </ThemeProvider>
  );
}
