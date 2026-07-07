import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase.js';
import OwnerHeader from '../components/shared/OwnerHeader.jsx';
import ItemForm from '../components/owner/ItemForm.jsx';

export default function EditItemPage() {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    supabase.from('items').select('*').eq('id', itemId).single()
      .then(({ data }) => { setItem(data); setLoading(false); });
  }, [itemId]);

  async function handleSave(values) {
    setSaving(true);
    const { error } = await supabase.from('items').update(values).eq('id', itemId);
    if (error) { setError(error.message); setSaving(false); return; }
    navigate(`/estate/${id}`);
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <OwnerHeader title="Edit item" back={`/estate/${id}`} />
      <main className="max-w-screen-sm mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-navy mb-6">Edit item</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {item && <ItemForm estateId={id} initialValues={item} onSave={handleSave} saving={saving} />}
      </main>
    </div>
  );
}
