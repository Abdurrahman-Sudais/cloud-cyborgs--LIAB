// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, getUserProfile } from '../firebase/firestore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.displayName || '');
      setUniversity(profile.university || '');
      setCourse(profile.course || '');
      setYear(profile.year || '1');
    }
  }, [profile, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    const toastId = toast.loading('Saving profile...');

    try {
      const updatedData = {
        name,
        university,
        course,
        year,
        updatedAt: new Date().toISOString(),
      };

      await updateUserProfile(user.uid, updatedData);
      setProfile(prev => ({ ...prev, ...updatedData }));
      toast.success('Profile updated successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Could not save profile', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h2>Account Profile</h2>
        <p>Manage your academic details and personal information</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} className="card">
          <div className="input-group">
            <label>Full Name</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>University / Institution</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Imperial College London"
              value={university}
              onChange={e => setUniversity(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Course / Major</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Computer Science"
                value={course}
                onChange={e => setCourse(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Year of Study</label>
              <select
                className="input"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="1">Year 1 (Freshman)</option>
                <option value="2">Year 2 (Sophomore)</option>
                <option value="3">Year 3 (Junior)</option>
                <option value="4">Year 4 (Senior)</option>
                <option value="Postgrad">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="submit"
              className="btn btn-cyan"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
