import { Montserrat } from 'next/font/google';
import "./globals.css";
import Header from '@/components/header';
import { ClerkProvider } from '@clerk/nextjs';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: "Monies",
  description: "One step Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${montserrat.className}`}
      >
        {/*header*/}
        <Header />
        <main className='min-h-screen'>

        {children}
        </main>
        {/*footer*/}
        <footer className='bg-pink-50 py-4'>
          <div className='container mx-auto px-4 text-center text-gray-600' >
            <p>Track every penny here!</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}
