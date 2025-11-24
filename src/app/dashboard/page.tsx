import SavedPitchesList from '../components/SavedPitchesList';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Pitches</h1>
        <p className="text-slate">Track, edit, and export persona-tailored pitches.</p>
      </div>
      <SavedPitchesList />
    </div>
  );
}
