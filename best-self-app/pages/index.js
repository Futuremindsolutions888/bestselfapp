
import dynamic from 'next/dynamic';

const BestSelfApp = dynamic(() => import('../src/BestSelfApp'), { ssr: false });

export default function Home() {
  return <BestSelfApp />;
}
