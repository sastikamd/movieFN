import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminScheduleShow = () => {
  const [movies, setMovies] = useState([]);
    const [form, setForm] = useState({
        movieId: '',       // store the selected movie's ID
        theater: '',
        showDate: '',
        startTime: '',
        seatsAvailable: 100,
    });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get('/movies?status=now-showing');
        if (res.data.success) {
          setMovies(res.data.data.movies);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMovies();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const payload = {
      movie: form.movieId,
      theater: form.theater,
      showDate: form.showDate,
      startTime: form.startTime,
      seatsAvailable: form.seatsAvailable
    };

    const res = await axios.post('/shows', payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (res.data.success) {
      setSuccess('Show scheduled successfully!');
      // reset form
      setForm({ movieId: '', theater: '', showDate: '', startTime: '', seatsAvailable: 100 });
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Schedule New Movie Show</h2>
      {success && <div className="mb-4 text-green-600">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
              <select name="movieId" value={form.movieId} onChange={handleChange} required>
                  <option value="">Select Movie</option>
                  {movies.map(movie => (
                      <option key={movie._id} value={movie._id}>{movie.title}</option>
                  ))}
              </select>

        <input type="text" name="theater" placeholder="Theater Name" value={form.theater} onChange={handleChange} required className="form-input w-full" />
        <input type="date" name="showDate" value={form.showDate} onChange={handleChange} required className="form-input w-full" />
        <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required className="form-input w-full" />
        <input type="number" name="seatsAvailable" value={form.seatsAvailable} onChange={handleChange} min={1} className="form-input w-full" />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Scheduling...' : 'Schedule Show'}</button>
      </form>
    </div>
  );
};

export default AdminScheduleShow;
