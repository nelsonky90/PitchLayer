import PitchForm from '@/app/components/PitchForm';

export default function NewPitchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">New Pitch</h1>
      <p className="text-slate">Craft persona-specific internal pitch content for your champions.</p>
      <PitchForm />
    </div>
  );
}
