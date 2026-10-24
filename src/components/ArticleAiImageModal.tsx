import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Wand2,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  Layers,
  KeyRound,
} from 'lucide-react';
import type { AIGeneratedImageItem } from './AdminArticleImageStudio';

interface ArticleAiImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (imageUrl: string, prompt: string) => void;
}

const PRESETS = [
  { id: 'splashlearn_vector', label: '🎒 SplashLearn 2D Vector (4:3)', aspect: '4:3' },
  { id: 'vibrant_banner', label: '🌟 Vibrant Banner (16:9)', aspect: '16:9' },
  { id: 'clean_infographic', label: '📐 Infographic (4:3)', aspect: '4:3' },
  { id: 'classical_sketch', label: '🏛️ Renaissance Sketch (4:3)', aspect: '4:3' },
  { id: 'abstract_math', label: '🌌 Cosmic / Abstract (16:9)', aspect: '16:9' },
  { id: 'chalkboard_blueprint', label: '✏️ Chalkboard (16:9)', aspect: '16:9' },
  { id: 'none', label: '🎯 Custom Prompt', aspect: '16:9' },
];

export function ArticleAiImageModal({ isOpen, onClose, onInsert }: ArticleAiImageModalProps) {
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('maths_mentor_admin_ai_key') || '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'gemini_vector' | 'openai'>('gemini_vector');
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('splashlearn_vector');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('4:3');
  const [targetGrade, setTargetGrade] = useState('Grades 1–10');
  const [subject, setSubject] = useState('Mathematics');
  const [importantLabels, setImportantLabels] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedResult, setGeneratedResult] = useState<AIGeneratedImageItem | null>(null);

  // Quick gallery picker tab
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [gallery, setGallery] = useState<AIGeneratedImageItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setStatusMessage('');
      // Fetch recent gallery for quick picking
      setLoadingGallery(true);
      fetch('/api/superadmin/ai-images', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((d) => {
          if (d.images) setGallery(d.images);
        })
        .catch(() => {})
        .finally(() => setLoadingGallery(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handlePresetChange(presetId: string) {
    setSelectedPreset(presetId);
    const found = PRESETS.find((p) => p.id === presetId);
    if (found?.aspect) setAspectRatio(found.aspect as any);
  }

  function buildEffectivePrompt() {
    if (selectedPreset === 'splashlearn_vector') {
      const parts = [`Topic: ${prompt.trim()}`];
      if (targetGrade) parts.push(`Target Grade: ${targetGrade}`);
      if (subject) parts.push(`Subject: ${subject}`);
      if (importantLabels.trim()) parts.push(`Important Labels or Elements: ${importantLabels.trim()}`);
      return parts.join('\n');
    }
    return prompt.trim();
  }

  async function handleEnhance() {
    if (!prompt.trim()) return;
    setEnhancing(true);
    setErrorMessage('');
    try {
      const customKey = customApiKey.trim() || localStorage.getItem('maths_mentor_admin_ai_key') || undefined;
      const effective = buildEffectivePrompt();
      const res = await fetch('/api/superadmin/enhance-image-prompt', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: effective,
          stylePreset: selectedPreset,
          aspectRatio,
          provider,
          customApiKey: customKey,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setStatusMessage('✨ Prompt enhanced!');
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch {
      setErrorMessage('Failed to enhance prompt.');
    } finally {
      setEnhancing(false);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setErrorMessage('Please enter an image prompt or topic.');
      return;
    }

    setGenerating(true);
    setErrorMessage('');
    setStatusMessage(
      provider === 'gemini_vector'
        ? 'Generating with Google Gemini Vector Art (Free)...'
        : provider === 'openai'
        ? 'Generating with ChatGPT DALL·E 3...'
        : 'Generating with Google Imagen 3...'
    );

    try {
      const customKey = customApiKey.trim() || localStorage.getItem('maths_mentor_admin_ai_key') || undefined;
      const effective = buildEffectivePrompt();
      const res = await fetch('/api/superadmin/generate-article-image', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: effective,
          provider,
          aspectRatio,
          stylePreset: selectedPreset,
          customApiKey: customKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Generation failed.');
      }

      if (data.image) {
        setGeneratedResult(data.image);
        setGallery((prev) => [data.image, ...prev]);
        setStatusMessage('Artwork ready! Click "Insert into Article" below.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Image generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !generating) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              AI Article Visual Generator
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'create' ? '#ffffff' : 'transparent',
                  color: activeTab === 'create' ? '#312e81' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Generate New
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'gallery' ? '#ffffff' : 'transparent',
                  color: activeTab === 'gallery' ? '#312e81' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={12} /> Media Library ({gallery.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'create' ? (
            <div>
              {/* Provider & Aspect Ratio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Model Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="gemini_vector">Google Gemini Vector Art (100% Free - Any Gemini Key)</option>
                    <option value="gemini">Google Imagen 3 (Photorealistic - Requires Cloud Billing)</option>
                    <option value="openai">ChatGPT DALL·E 3 (Requires OpenAI Key / Credits)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: '#ffffff',
                    }}
                  >
                    <option value="16:9">16:9 (Hero Article Banner)</option>
                    <option value="4:3">4:3 (Editorial Figure / Diagram)</option>
                    <option value="1:1">1:1 (Square Graphic)</option>
                  </select>
                </div>
              </div>

              {/* API Key Configuration Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <KeyRound size={12} />
                    {showKeyConfig ? 'Hide Custom API Key' : (customApiKey ? 'Custom API Key Active (Click to edit)' : 'Enter Custom API Key (Optional)')}
                  </button>
                  {customApiKey && !showKeyConfig && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✓ Key set</span>
                  )}
                </div>

                {showKeyConfig && (
                  <div style={{ marginTop: '6px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        placeholder={provider === 'openai' ? 'Paste OpenAI key (sk-...)' : 'Paste Gemini key (AIza...)'}
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          localStorage.setItem('maths_mentor_admin_ai_key', val.trim());
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#ffffff',
                        }}
                      />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      Key is stored securely in your browser's localStorage. Leave empty to use server default.
                    </p>
                  </div>
                )}
              </div>

              {/* Style Presets */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Style Preset
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetChange(p.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: selectedPreset === p.id ? '#6366f1' : '#e2e8f0',
                        background: selectedPreset === p.id ? '#ede9fe' : '#f8fafc',
                        color: selectedPreset === p.id ? '#4f46e5' : '#475569',
                        fontSize: '12px',
                        fontWeight: selectedPreset === p.id ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SplashLearn Educational Context Parameters */}
              {selectedPreset === 'splashlearn_vector' && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '2px' }}>
                        Target Grade
                      </label>
                      <select
                        value={targetGrade}
                        onChange={(e) => setTargetGrade(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', background: '#ffffff', color: '#0f172a' }}
                      >
                        <option value="Grades 1–5 (Primary)">Grades 1–5 (Primary)</option>
                        <option value="Grades 6–8 (Middle)">Grades 6–8 (Middle)</option>
                        <option value="Grades 9–10 (Secondary)">Grades 9–10 (Secondary)</option>
                        <option value="Grades 1–10 (All School)">Grades 1–10 (All School)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '2px' }}>
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', background: '#ffffff', color: '#0f172a' }}
                      >
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                        <option value="Social Science">Social Science</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Environmental Studies">Environmental Studies</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#14532d', marginBottom: '2px' }}>
                      Important Labels or Elements (Optional)
                    </label>
                    <input
                      type="text"
                      value={importantLabels}
                      onChange={(e) => setImportantLabels(e.target.value)}
                      placeholder="e.g. Numerator, Denominator, Fraction Bar"
                      style={{ width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '11.5px', background: '#ffffff', color: '#0f172a' }}
                    />
                  </div>
                </div>
              )}

              {/* Prompt Input & Magic Enhance */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>
                    Image Description or Topic
                  </label>
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={enhancing || generating || !prompt.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7c3aed',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Wand2 size={12} className={enhancing ? 'spin' : ''} />
                    {enhancing ? 'Refining...' : 'Magic Enhance ✨'}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. Class 10 Circles: Golden compass constructing tangent theorem with clean geometric lines..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    lineHeight: '1.4',
                  }}
                />
              </div>

              {/* Status / Errors */}
              {errorMessage && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', color: '#b91c1c', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <AlertCircle size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1, lineHeight: '1.45' }}>{errorMessage}</div>
                  </div>
                  {errorMessage.includes('ChatGPT') && provider !== 'openai' && (
                    <button
                      type="button"
                      onClick={() => {
                        setProvider('openai');
                        setErrorMessage('');
                      }}
                      style={{
                        marginTop: '8px',
                        marginLeft: '21px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #10b981',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      👉 Switch to ChatGPT DALL·E 3
                    </button>
                  )}
                </div>
              )}

              {statusMessage && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', color: '#047857', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Action Button: Generate */}
              {!generatedResult && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: generating ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: generating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {generating ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Generating Image...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Artwork
                    </>
                  )}
                </button>
              )}

              {/* Preview of newly generated result */}
              {generatedResult && (
                <div style={{ background: '#0f172a', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '11.5px' }}>
                    <span>Generated: {generatedResult.provider} ({generatedResult.aspectRatio})</span>
                    <button
                      type="button"
                      onClick={() => setGeneratedResult(null)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                    >
                      Generate Another
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', padding: '14px', background: '#ffffff', margin: '12px', borderRadius: '10px' }}>
                    <img
                      src={generatedResult.fileUrl}
                      alt={generatedResult.prompt}
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.img-load-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'img-load-fallback';
                          fallback.style.cssText = 'padding: 24px; text-align: center; color: #dc2626; font-size: 13px; font-weight: 600;';
                          fallback.innerHTML = '⚠️ Image preview could not load. Please generate again.';
                          parent.appendChild(fallback);
                        }
                      }}
                      style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '6px', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ padding: '12px 14px', background: '#1e293b', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onInsert(generatedResult.fileUrl, generatedResult.prompt)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ArrowRight size={15} /> Insert into Article
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Media Library Tab */
            <div>
              {loadingGallery ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={22} className="spin" style={{ margin: '0 auto 8px' }} />
                  <p>Loading library...</p>
                </div>
              ) : gallery.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={36} style={{ margin: '0 auto 8px' }} />
                  <p>No images in repository yet. Switch to "Generate New" to create one.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onInsert(item.fileUrl, item.prompt)}
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #e2e8f0',
                        background: '#0f172a',
                        position: 'relative',
                        aspectRatio: item.aspectRatio === '16:9' ? '16/9' : '4/3',
                        transition: 'transform 0.15s',
                      }}
                      title="Click to insert into article"
                    >
                      <img src={item.fileUrl} alt={item.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: '6px',
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          + Insert Image
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
