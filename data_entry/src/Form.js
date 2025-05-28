import React, { useState } from 'react';
import './Form.css';

function Form() {
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    image: null,
    bodyPart: '',
    scanType: '',
    reason: '',
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('patientId', formData.patientId);
    data.append('name', formData.name);
    data.append('image', formData.image);
    data.append('bodyPart', formData.bodyPart);
    data.append('scanType', formData.scanType);
    data.append('reason', formData.reason);

    fetch('http://localhost:5050/api/submit', {
      method: 'POST',
      body: data,
    })
      .then(response => response.json())
      .then(result => {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        setFormData({
          patientId: '',
          name: '',
          image: null,
          bodyPart: '',
          scanType: '',
          reason: '',
        });
        document.querySelector('input[type="file"]').value = '';
        console.log(result);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  return (
    <div style={{ fontFamily: 'Trebuchet MS, sans-serif', backgroundColor: '#f9f9f9', color: '#242423', minHeight: '100vh', padding: '2rem', fontSize: '1.25rem' }}>
      {showPopup && (
        <div className='notification'>
          Submitted successfully!
        </div>
      )}
      <h2>Patient Data Entry</h2>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '400px' }}>
          <form onSubmit={handleSubmit}>
          <div>
            <label className='label'>Patient ID:</label><br />
            <input className='field' type="text" name="patientId" value={formData.patientId} onChange={handleChange} required />
          </div>
          <div>
            <label className='label'>Name:</label><br />
            <input className='field' type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <label className='label'>Upload Image:</label><br />
            <input className='field' type="file" name="image" accept="image/*" onChange={handleFileChange} required />
          </div>
          <div>
            <label className='label'>Body Part:</label><br />
            <select className='field' name="bodyPart" value={formData.bodyPart} onChange={handleChange} required>
              <option value="">Select a body part</option>
              <option value="chest">Chest</option>
              <option value="head">Head</option>
              <option value="abdomen">Abdomen</option>
              <option value="neck">Neck</option>
            </select>
          </div>
          <div>
            <label className='label'>Scan Type:</label><br />
            <select className='field' name="scanType" value={formData.scanType} onChange={handleChange} required>
              <option value="">Select a scan type</option>
              <option value="X-RAY">X-RAY</option>
              <option value="CT">CT</option>
            </select>
          </div>
          <div>
            <label className='label'>Reason:</label><br />
            <textarea className='field' name="reason" value={formData.reason} onChange={handleChange} required rows={3}/>
          </div>
          <button className='button' type="submit">Submit</button>
        </form>
      </div>
        <div>
          <label className='label'>Preview:</label><br />
          {formData.image ? (
            <img
              src={URL.createObjectURL(formData.image)}
              alt="Preview"
              style={{ width: '300px', height: '300px', objectFit: 'cover', border: '1px solid #ccc', marginLeft: '1.5rem', marginTop: '0.4rem' }}
            />
          ) : (
            <div style={{
              width: '300px',
              height: '300px',
              border: '1px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              fontSize: '1rem',
              marginLeft: '1.5rem',
              marginTop: '0.4rem',
            }}>
              No image uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Form;
