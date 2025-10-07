import React, { useState } from 'react';
import axios from 'axios';

const AdminAddMovie = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    director: '',
    cast: '',
    duration: '',
    language: '',
    ratingImdb: '',
    certification: 'U',
    poster: '',
    releaseDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        genre: form.genre.split(',').map(g => g.trim()),
        language: form.language.split(',').map(l => l.trim()),
        cast: form.cast ? form.cast.split(',').map(name => ({ name })) : [],
        rating: { imdb: Number(form.ratingImdb), certification: form.certification },
      };

      const res = await axios.post('/admin/movies', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (res.data.success) {
        setSuccess('Movie added successfully!');
        setForm({
          title: '', description: '', genre: '', director: '', cast: '', duration: '',
          language: '', ratingImdb: '', certification: 'U', poster: '', releaseDate: ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Movie</h2>
      {success && <div className="mb-4 text-green-600">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required className="form-input w-full" />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="form-input w-full" />
        <input type="text" name="genre" placeholder="Genre (comma separated)" value={form.genre} onChange={handleChange} required className="form-input w-full" />
        <input type="text" name="director" placeholder="Director" value={form.director} onChange={handleChange} required className="form-input w-full" />
        <input type="text" name="cast" placeholder="Cast (comma separated)" value={form.cast} onChange={handleChange} className="form-input w-full" />
        <input type="number" name="duration" placeholder="Duration (min)" value={form.duration} onChange={handleChange} required className="form-input w-full" />
        <input type="text" name="language" placeholder="Languages (comma separated)" value={form.language} onChange={handleChange} required className="form-input w-full" />
        <input type="number" name="ratingImdb" placeholder="IMDB Rating" value={form.ratingImdb} onChange={handleChange} min={0} max={10} className="form-input w-full" />
        <select name="certification" value={form.certification} onChange={handleChange} className="form-input w-full">
          <option value="U">U</option>
          <option value="UA">UA</option>
          <option value="A">A</option>
        </select>
        <input type="text" name="poster" placeholder="Poster URL" value={form.poster} onChange={handleChange} required className="form-input w-full" />
        <input type="date" name="releaseDate" value={form.releaseDate} onChange={handleChange} required className="form-input w-full" />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Adding...' : 'Add Movie'}
        </button>
      </form>
    </div>
  );
};

export default AdminAddMovie;
