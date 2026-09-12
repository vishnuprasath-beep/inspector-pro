import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  User,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Building,
  Award,
  Palette,
  Shield,
  Phone,
  Mail,
  FileText,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  { label: 'Officer Male 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { label: 'Officer Male 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { label: 'Officer Female 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { label: 'Officer Female 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
];

const PRESET_THEME_COLORS = [
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Royal Indigo', hex: '#6366f1' },
  { name: 'Crimson Red', hex: '#ef4444' }
];

export default function ProfileSettingsModal({ isOpen, onClose, onProfileUpdated, onBrandingUpdated, currentUser }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'branding'

  // User Profile Form State
  const [profileForm, setProfileForm] = useState({
    id: 'usr-admin-01',
    name: 'K. Selvakumar, IAS',
    email: 'selvakumar.ias@inspection.gov.in',
    phone: '+91 94440 12345',
    role: 'ADMIN',
    department: 'Directorate of Municipal Administration & Infrastructure',
    badge_id: 'IAS-TN-2018-09',
    bio: 'Senior Administrative Officer overseeing state-wide smart infrastructure inspections and compliance enforcement.',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  });

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    app_name: 'INSPECTRA PRO',
    tagline: 'GOVERNMENT INFRASTRUCTURE SURVEILLANCE & FIELD AUDIT SUITE',
    agency_name: 'State Infrastructure Inspection Directorate',
    logo_url: '',
    primary_color: '#38bdf8'
  });

  const { updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  // Load existing profile & branding on open
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const targetId = currentUser?.id || 'usr-admin-01';
        const pRes = await api.getUserProfile(targetId);
        if (pRes.success && pRes.data) {
          setProfileForm(prev => ({ ...prev, ...currentUser, ...pRes.data }));
        } else if (currentUser) {
          setProfileForm(prev => ({ ...prev, ...currentUser }));
        }
        const bRes = await api.getBranding();
        if (bRes.success && bRes.data) {
          setBrandingForm(bRes.data);
        }
      } catch (e) {
        console.error('Error loading profile settings:', e);
      }
    }
    loadData();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Profile Avatar file upload
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file format. Please choose an image (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size exceeds 3MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm(prev => ({ ...prev, avatar_url: reader.result }));
      toast.info('Photo preview ready. Click "Save Profile Changes" to persist.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo file upload
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file format. Please upload a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo image size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBrandingForm(prev => ({ ...prev, logo_url: reader.result }));
      toast.info('Logo preview ready. Click "Save Branding" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const targetId = profileForm.id || currentUser?.id || 'usr-admin-01';
      const res = await api.updateUserProfile(targetId, profileForm);
      if (res.success) {
        toast.success('Officer profile and photo updated successfully!');
        if (onProfileUpdated) onProfileUpdated(res.data);
        if (updateUser) updateUser(res.data);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateBranding(brandingForm);
      if (res.success) {
        toast.success('System branding and logo updated successfully!');
        if (onBrandingUpdated) onBrandingUpdated(res.data);
      } else {
        toast.error('Failed to update branding');
      }
    } catch (err) {
      toast.error('Error saving branding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} color="var(--accent-cyan)" />
              Profile & Portal Customization
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Update officer credentials, department badge, profile photo, and institutional branding.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <User size={14} />
            <span>Officer Profile & Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`btn btn-sm ${activeTab === 'branding' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Palette size={14} />
            <span>Institutional Branding & Logo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              {/* Profile Photo Section */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={profileForm.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={profileForm.name}
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: 12,
                      objectFit: 'cover',
                      border: '2px solid var(--accent-cyan)',
                      boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)'
                    }}
                  />
                  <label
                    htmlFor="avatar-upload-input"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: 'var(--accent-cyan)',
                      color: '#090d16',
                      borderRadius: '50%',
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                    }}
                    title="Upload Custom Photo"
                  >
                    <Camera size={14} />
                  </label>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Officer Profile Photo</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    Upload a high-resolution portrait or select an official preset. Max size 3MB (PNG, JPG, WEBP).
                  </div>

                  {/* Preset Avatars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Presets:</span>
                    {PRESET_AVATARS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileForm(prev => ({ ...prev, avatar_url: p.url }))}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', fontSize: 10 }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Fields Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Officer Full Name & Designation
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Official Government Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Registered Contact Mobile
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Officer Badge / Service ID
                  </label>
                  <input
                    type="text"
                    value={profileForm.badge_id}
                    onChange={e => setProfileForm(p => ({ ...p, badge_id: e.target.value }))}
                    className="input-control"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Government Ministry / Department
                </label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                  className="input-control"
                  required
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Executive Bio & Responsibilities
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                  className="input-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PORTAL BRANDING & LOGO */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBranding}>
              {/* Custom Logo Upload */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 16,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: 74,
                  height: 74,
                  borderRadius: 12,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px dashed var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={brandingForm.logo_url || "/logo.png"} 
                    alt="Logo Preview" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 14 }}>Portal Brand Icon / Organization Logo</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
                    Appears on login screens, desktop header, mobile inspection title, and exported PDF reports.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label
                      htmlFor="logo-upload-input"
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Upload size={14} />
                      <span>Upload Custom Logo</span>
                    </label>
                    <input
                      id="logo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      style={{ display: 'none' }}
                    />
                    {brandingForm.logo_url && (
                      <button
                        type="button"
                        onClick={() => setBrandingForm(p => ({ ...p, logo_url: '' }))}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f87171' }}
                      >
                        Reset to Shield Icon
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Branding Fields */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Application / Suite Name
                </label>
                <input
                  type="text"
                  value={brandingForm.app_name}
                  onChange={e => setBrandingForm(p => ({ ...p, app_name: e.target.value }))}
                  className="input-control"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  Official Department / Agency Title
                </label>
                <input
                  type="text"
                  value={brandingForm.agency_name}
                  onChange={e => setBrandingForm(p => ({ ...p, agency_name: e.target.value }))}
                  className="input-control"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                  System Tagline / Operational Subtitle
                </label>
                <input
                  type="text"
                  value={brandingForm.tagline}
                  onChange={e => setBrandingForm(p => ({ ...p, tagline: e.target.value }))}
                  className="input-control"
                  required
                />
              </div>

              {/* Theme Primary Color Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>
                  Primary System Accent Theme
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {PRESET_THEME_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBrandingForm(p => ({ ...p, primary_color: c.hex }))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: c.hex,
                        border: brandingForm.primary_color === c.hex ? '3px solid #ffffff' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: brandingForm.primary_color === c.hex ? `0 0 10px ${c.hex}` : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      title={c.name}
                    />
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 6 }}>
                    Current: <strong style={{ color: brandingForm.primary_color }}>{brandingForm.primary_color}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>{saving ? 'Applying...' : 'Save Institutional Branding'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
