import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import OwnerHeader from '../components/shared/OwnerHeader.jsx';
import ItemForm from '../components/owner/ItemForm.jsx';

export default function AddItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave(values) {
    setSaving(true);
    const { error } = await supabase.from('items').insert({ ...values, estate_id: id });
    if (error) { setError(error.message); setSaving(false); return; }
    navigate(`/estate/${id}`);
  }

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader title="Add item" back={`/estate/${id}`} />
      <main className="max-w-screen-sm mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-navy mb-6">Add a new item</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <ItemForm estateId={id} onSave={handleSave} saving={saving} />
      </main>
    </div>
  );
}
