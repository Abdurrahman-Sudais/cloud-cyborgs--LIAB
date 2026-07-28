// src/pages/Onboard.jsx
// Shown after first sign-in if profile is incomplete
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../firebase/firestore';
import toast from 'react-hot-toast';

export default function Onboard() {
  const { user, setProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', university: '', course: '', year: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile(user.uid, form);
      setProfile(form);
      toast.success("You're all set! 🎉");
      navigate('/dashboard');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card-glass fade-in">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
          <h2>Let's set up your profile</h2>
          <p style={{ marginTop: 8, fontSize: '0.875rem' }}>
            LIAB uses this to personalise your AI companion
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input className="input" placeholder="e.g. Abdurrahman Sudais" value={form.name} onChange={set('name')} required />
          </div>
          <div className="input-group">
            <label>University</label>
            <input className="input" placeholder="e.g. University of Lagos" value={form.university} onChange={set('university')} required />
          </div>
          <div className="input-group">
            <label>Course / Major</label>
            <input className="input" placeholder="e.g. Industrial Chemistry" value={form.course} onChange={set('course')} required />
          </div>
          <div className="input-group">
            <label>Year of Study</label>
            <select className="input" value={form.year} onChange={set('year')} required>
              <option value="">Select year</option>
              {['1st Year','2nd Year','3rd Year','4th Year','5th Year','Postgraduate'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Setting up...' : 'Enter LIAB →'}
          </button>
        </form>
      </div>
    </div>
  );
}
