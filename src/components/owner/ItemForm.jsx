import { useState, useRef } from 'react';
import { supabase } from '../../supabase.js';

const CATEGORIES = ['Furniture', 'Art', 'Jewellery', 'Collectibles', 'Tools', 'Other'];

export default function ItemForm({ estateId, initialValues = {}, onSave, saving }) {
  const [name,           setName]           = useState(initialValues.name           || '');
  const [category,       setCategory]       = useState(initialValues.category       || 'Other');
  const [room,           setRoom]           = useState(initialValues.room           || '');
  const [description,    setDescription]    = useState(initialValues.description    || '');
  const [dimensions,     setDimensions]     = useState(initialValues.dimensions     || '');
  const [estimatedValue, setEstimatedValue] = useState(initialValues.estimated_value || '');
  const [photoUrl,       setPhotoUrl]       = useState(initialValues.photo_url      || '');
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState('');
  const [preview,        setPreview]        = useState(initialValues.photo_url      || '');
  const fileRef = useRef(null);

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 10MB)
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024)   { setUploadError('Image must be under 10MB.'); return; }

    setUploadError('');
    setUploading(true);

    const ext      = file.name.split('.').pop();
    const fileName = `${estateId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('item-photos')
      .upload(fileName, file, { upsert: true });

    if (error) {
      setUploadError('Upload failed. Please try again.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('item-photos')
      .getPublicUrl(data.path);

    setPhotoUrl(publicUrl);
    setPreview(publicUrl);
    setUploading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      name:            name.trim(),
      category,
      room:            room.trim(),
      description:     description.trim(),
      dimensions:      dimensions.trim(),
      estimated_value: estimatedValue.trim(),
      photo_url:       photoUrl,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo upload */}
      <div>
        <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-2">Photo</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-cream-dark hover:border-navy/30 transition-colors cursor-pointer overflow-hidden bg-cream"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-navy/30">
              <CameraIcon />
              <p className="text-base font-medium mt-2">Click to upload photo</p>
              <p className="text-sm mt-1">JPG, PNG up to 10MB</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        {preview && (
          <button type="button" onClick={() => { setPreview(''); setPhotoUrl(''); }} className="text-sm text-red-400 hover:text-red-500 mt-1.5">
            Remove photo
          </button>
        )}
        {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
      </div>

      {/* Name */}
      <Field label="Item name *" required>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oak Dining Table" required className={inputClass} />
      </Field>

      {/* Category + Room */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Room">
          <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Dining Room" className={inputClass} />
        </Field>
      </div>

      {/* Description */}
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provenance, condition, history…" rows={3} className={`${inputClass} resize-none`} />
      </Field>

      {/* Dimensions + Value */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Dimensions">
          <input type="text" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder='e.g. 72"H × 36"W × 18"D' className={inputClass} />
        </Field>
        <Field label="Estimated value">
          <input type="text" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="e.g. $800 or Unknown" className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-base hover:bg-navy-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save item'}
      </button>
    </form>
  );
}

const inputClass = 'w-full px-4 py-3 border border-cream-dark rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-navy/30 bg-white';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy/60 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
