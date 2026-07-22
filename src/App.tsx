import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Download } from '@/components/Download';
import { Changelog } from '@/components/Changelog';
import { Footer } from '@/components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />
      <main>
        <Hero />
        <Features />
        <Download />
        <Changelog />
      </main>
      <Footer />
    </div>
  );
}