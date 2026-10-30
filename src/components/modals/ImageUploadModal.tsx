import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  Sparkles,
  Shield,
  RefreshCw,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export type ImageTargetType = 'school_crest' | 'student' | 'staff' | 'admin';

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ImageTargetType;
  currentImage: string;
  title?: string;
  subtitle?: string;
  entityName?: string;
  entityRoleOrCode?: string;
  onSave: (newImageUrl: string) => void;
}

// Curated presets for each specific category
const PRESET_COLLECTIONS: Record<
  ImageTargetType,
  { label: string; url: string; category?: string }[]
> = {
  school_crest: [
    {
      label: 'Kingdom Royal Gold & Emerald Shield',
      url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=400&q=80',
      category: 'Institutional',
    },
    {
      label: 'Academic Crown & Open Book',
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80',
      category: 'Academic',
    },
    {
      label: 'Distinguished University Crest',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80',
      category: 'Heritage',
    },
    {
      label: 'Golden Lion & Torch of Truth',
      url: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?auto=format&fit=crop&w=400&q=80',
      category: 'Honor',
    },
    {
      label: 'Royal Blue & Platinum Emblem',
      url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80',
      category: 'Modern',
    },
    {
      label: 'Classic Ivy Academic Seal',
      url: 'https://images.unsplash.com/photo-1532649538685-0c096784b062?auto=format&fit=crop&w=400&q=80',
      category: 'Traditional',
    },
  ],
  student: [
    {
      label: 'Kwame (Male Senior Scholar)',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      category: 'Senior SHS',
    },
    {
      label: 'Abena (Female Science Scholar)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Senior SHS',
    },
    {
      label: 'Kofi (School Prefect - Male)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Prefect',
    },
    {
      label: 'Akosua (Girls Prefect - Female)',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      category: 'Prefect',
    },
    {
      label: 'Yaw (General Arts Scholar)',
      url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
      category: 'Arts & Business',
    },
    {
      label: 'Esi (Junior High Student)',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      category: 'Basic & JHS',
    },
    {
      label: 'Kwabena (Stem & Robotics Scholar)',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      category: 'Science',
    },
    {
      label: 'Naa (Business & Accounting Scholar)',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      category: 'Business',
    },
  ],
  staff: [
    {
      label: 'Mrs. Mensah-Bonsu (Headmistress)',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      category: 'Leadership',
    },
    {
      label: 'Dr. Addo-Preko (Senior Science Master)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      category: 'Faculty',
    },
    {
      label: 'Mrs. Harriet Agyapong (Bursar / Accounts)',
      url: 'https://images.unsplash.com/photo-1580894732488-c709e9db63ea?auto=format&fit=crop&w=400&q=80',
      category: 'Finance',
    },
    {
      label: 'Mr. Francis Quartey (HOD Languages)',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      category: 'Faculty',
    },
    {
      label: 'Rev. Kwabena Darko (Senior Housemaster)',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      category: 'Boarding & Welfare',
    },
    {
      label: 'Ms. Rebecca Mensah (Housemistress & Biology)',
      url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      category: 'Faculty',
    },
  ],
  admin: [
    {
      label: 'Chancellor & Executive Proprietor',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      category: 'Governance',
    },
    {
      label: 'Distinguished Academic Director',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      category: 'Administration',
    },
    {
      label: 'Senior Executive Trustee',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      category: 'Governance',
    },
    {
      label: 'Managing Director & Principal',
      url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      category: 'Executive',
    },
  ],
};

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  targetType,
  currentImage,
  title,
  subtitle,
  entityName,
  entityRoleOrCode,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync current image when opened or changed
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImage);
      setUrlInput('');
      setErrorMessage(null);
      setSavedSuccess(false);
    }
  }, [isOpen, currentImage]);

  if (!isOpen) return null;

  // Contextual labels based on targetType
  const defaultTitle =
    targetType === 'school_crest'
      ? 'Update School Crest & Brand Icon'
      : targetType === 'student'
      ? 'Update Student Passport Photograph'
      : targetType === 'staff'
      ? 'Update Staff Member Photo'
      : 'Update Administrator Profile Photo';

  const defaultSubtitle =
    targetType === 'school_crest'
      ? 'This crest appears across student report cards, ID badges, official receipts, and transcripts.'
      : targetType === 'student'
      ? 'Official passport photo used on student ID cards, terminal report cards, and GES registers.'
      : targetType === 'staff'
      ? 'Official faculty portrait used on staff ID badges, statutory SSNIT filings, and payslips.'
      : 'Profile picture for login credentials, system logs, and administrative authorizations.';

  const modalTitle = title || defaultTitle;
  const modalSubtitle = subtitle || defaultSubtitle;
  const presets = PRESET_COLLECTIONS[targetType] || PRESET_COLLECTIONS.admin;

  // Automated Canvas Compression (resizes camera/large photos to max 360x360 at 0.88 quality)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = targetType === 'school_crest' ? 400 : 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setPreviewUrl(compressedDataUrl);
          setIsProcessing(false);
        } else {
          setPreviewUrl(event.target?.result as string);
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to decode image. Please try another image file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMessage('Could not open file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    setErrorMessage(null);
    setPreviewUrl(urlInput.trim());
  };

  const handleSave = () => {
    if (!previewUrl) return;
    onSave(previewUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{modalTitle}</h3>
              <p className="text-xs text-slate-400">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Target Entity Badge & Live Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="relative group flex-shrink-0">
              <div
                className={`overflow-hidden border-2 border-emerald-500 shadow-lg bg-slate-900 flex items-center justify-center ${
                  targetType === 'school_crest'
                    ? 'w-24 h-24 rounded-2xl p-1'
                    : 'w-24 h-24 rounded-2xl'
                }`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <span className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full text-[10px] shadow border border-slate-950">
                <Check className="w-3 h-3" />
              </span>
            </div>

            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                  {targetType.replace('_', ' ').toUpperCase()}
                </span>
                {entityRoleOrCode && (
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {entityRoleOrCode}
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-white mt-1 truncate">
                {entityName || (targetType === 'school_crest' ? 'Kingdom Royal Institute' : 'Selected Record')}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {targetType === 'school_crest'
                  ? 'High-resolution school heraldic crest / logo'
                  : 'Official identification portrait'}
              </p>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Device Upload / Camera</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curated Presets ({presets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {/* TAB 1: DEVICE UPLOAD / CAMERA */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/40 hover:bg-emerald-950/10 group"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-600/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-white">Click or tap to upload an image</p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Camera capture, JPG, PNG, WEBP, or SVG files.
                </p>
                <span className="inline-block mt-3 text-[10px] text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                  ⚡ Auto-compressed with canvas optimization for fast database storage
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CURATED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Choose from verified high-resolution academic photographs & heraldic emblems:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                {presets.map((p, idx) => {
                  const isSelected = previewUrl === p.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewUrl(p.url);
                        setErrorMessage(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col items-center gap-2 group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/50 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="text-center w-full">
                        <span className="text-[11px] font-bold text-white block line-clamp-1">
                          {p.label}
                        </span>
                        {p.category && (
                          <span className="text-[9px] text-emerald-400 font-semibold block">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <label className="block text-xs text-slate-400">
                Direct Web Image URL (HTTPS link from Unsplash, Google Drive, or school server):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/crest.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Optimizing image dimensions & encoding...</span>
            </div>
          )}

          {/* Success Banner */}
          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Photograph updated and saved into school database!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !previewUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save & Apply Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};
