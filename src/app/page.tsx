import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow">
          <Sparkles className="text-signal" />
          <span className="text-sm font-semibold">AI-enabled Champion Enablement</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">Laying the foundation for champions to win.</h1>
        <p className="text-lg text-slate">Because clarity wins deals.</p>
        <div className="flex justify-center gap-4">
          <Link href="/pitch/new" className="btn">Generate a Pitch</Link>
          <Link href="/dashboard" className="btn bg-midnight hover:bg-gray-900">View Dashboard</Link>
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          'Persona-tailored messaging',
          'Secure storage with Supabase',
          'One-click exports to PDF & Slides'
        ].map((item) => (
          <div key={item} className="card p-6">
            <h3 className="font-semibold text-lg mb-2">{item}</h3>
            <p className="text-slate text-sm">PitchLayer guides champions with clear, actionable narratives for each stakeholder.</p>
          </div>
        ))}
      </section>
    </div>
  );
}
