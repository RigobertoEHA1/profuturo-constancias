"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

interface Certificate {
  id: string;
  first_name: string;
  middle_name?: string; // Optional
  paternal_last_name: string;
  maternal_last_name?: string; // Optional
  certificate: string;
  date_issued: string; // For date only
  time_issued: string; // For time only
  expiry_date: string; // Can be "Never"
  status: 'Valid' | 'Invalid';
  hours_quantity: number;
  pdf_url?: string; // Add this field for the PDF URL
}

const NewCertificatePage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [newCertificate, setNewCertificate] = useState<Omit<Certificate, 'id' | 'status' | 'pdf_url'>>({
    first_name: '',
    middle_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    certificate: '',
    date_issued: '',
    time_issued: '',
    expiry_date: '',
    hours_quantity: 0,
  });
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [deleteExistingPdf, setDeleteExistingPdf] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('certificados')
      .select('*');

    if (error) {
      setError(error.message);
      console.error('Error fetching certificates:', error);
    } else {
      setCertificates(data || []);
    }
    setLoading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage('');
    } else {
      setSelectedFile(null);
    }
  };

  const generateCertificateId = (firstName: string, paternalLastName: string) => {
    const randomNumbers = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 random digits
    const firstInitial = firstName ? firstName[0].toUpperCase() : '';
    const paternalInitial = paternalLastName ? paternalLastName[0].toUpperCase() : '';
    return `${randomNumbers}${firstInitial}${paternalInitial}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCertificate((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingCertificate) {
      setEditingCertificate((prev) => ({ ...prev!, [name]: value }));
    }
  };

  const addCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploading(true);
    setUploadMessage('Starting PDF upload...');

    const newId = generateCertificateId(newCertificate.first_name, newCertificate.paternal_last_name);
    const finalExpiryDate = newCertificate.expiry_date === '' ? 'Never' : newCertificate.expiry_date;
    const finalDateIssued = newCertificate.date_issued;
    const finalTimeIssued = newCertificate.time_issued;

    let pdfUrl = null;
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${newId}.${fileExtension}`;
      const filePath = fileName; // Upload directly to the bucket root

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          pdfUrl = publicUrlData.publicUrl;
          console.log('Generated PDF Public URL:', pdfUrl); // Log the URL
          setUploadMessage('PDF uploaded successfully. Attempting to save link to database...');
        } else {
          throw new Error('Failed to get public URL for the uploaded PDF.');
        }
      } catch (uploadError: any) {
        const errorMessage = `Error uploading PDF: ${uploadError.message || 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, uploadError);
        setUploading(false);
        setLoading(false);
        return; // Stop execution if PDF upload fails
      }
    } else {
      setUploadMessage('No PDF selected, proceeding without upload.');
    }

    console.log('Attempting to insert certificate with PDF URL:', pdfUrl);
    const { data, error } = await supabase
      .from('certificados')
      .insert([{
        id: newId,
        first_name: newCertificate.first_name,
        middle_name: newCertificate.middle_name || null,
        paternal_last_name: newCertificate.paternal_last_name,
        maternal_last_name: newCertificate.maternal_last_name || null,
        certificate: newCertificate.certificate,
        date_issued: finalDateIssued,
        time_issued: finalTimeIssued,
        expiry_date: finalExpiryDate,
        status: 'Valid', // Manually set to Valid on creation
        hours_quantity: newCertificate.hours_quantity,
        pdf_url: pdfUrl, // Store the PDF URL
      }])
      .select();

    if (error) {
      setError(`Error adding certificate: ${JSON.stringify(error)}`);
      console.error('Error adding certificate:', error);
    } else {
      console.log('Certificate added successfully:', data[0]);
      setCertificates((prev) => [...prev, data[0]]);
      setNewCertificate({
        first_name: '',
        middle_name: '',
        paternal_last_name: '',
        maternal_last_name: '',
        certificate: '',
        date_issued: '',
        time_issued: '',
        expiry_date: '',
        hours_quantity: 0,
      });
      setSelectedFile(null); // Clear selected file
      setUploadMessage('Certificate added and PDF link saved successfully!');
    }
    setUploading(false);
    setLoading(false);
  };

  const updateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertificate) return;

    setLoading(true);
    setError(null);
    setUploading(true);
    setUploadMessage('Starting PDF update...');

    const finalExpiryDate = editingCertificate.expiry_date === '' ? 'Never' : editingCertificate.expiry_date;
    const updatedDateIssued = editingCertificate.date_issued;
    const updatedTimeIssued = editingCertificate.time_issued;

    let pdfUrl = editingCertificate.pdf_url; // Keep existing URL by default

    // Handle deletion of existing PDF
    if (deleteExistingPdf && editingCertificate.pdf_url) {
      try {
        const url = new URL(editingCertificate.pdf_url);
        // Extract the path within the bucket. Assumes 'certificates' is the bucket name.
        // The path will be everything after '/storage/v1/object/public/certificates/'
        const pathSegments = url.pathname.split('/');
        const bucketIndex = pathSegments.indexOf('certificates');
        if (bucketIndex !== -1 && pathSegments.length > bucketIndex + 1) {
          const filePathToDelete = pathSegments.slice(bucketIndex + 1).join('/');
          console.log('Attempting to delete existing PDF:', filePathToDelete);
          const { error: deleteError } = await supabase.storage
            .from('certificates')
            .remove([filePathToDelete]);

          if (deleteError) {
            throw deleteError;
          }
          console.log('Existing PDF deleted successfully.');
          pdfUrl = null; // Clear the PDF URL if deleted
          setUploadMessage('Existing PDF deleted.');
        } else {
          console.warn('Could not parse file path from PDF URL for deletion:', editingCertificate.pdf_url);
        }
      } catch (deleteError: any) {
        const errorMessage = `Error deleting existing PDF: ${deleteError.message || 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, deleteError);
        setUploading(false);
        setLoading(false);
        return; // Stop execution if PDF deletion fails
      }
    }

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${editingCertificate.id}.${fileExtension}`;
      const filePath = fileName; // Upload directly to the bucket root

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          pdfUrl = publicUrlData.publicUrl;
          console.log('Generated PDF Public URL (Update):', pdfUrl); // Log the URL
          setUploadMessage('PDF updated successfully. Attempting to save link to database...');
        } else {
          throw new Error('Failed to get public URL for the updated PDF.');
        }
      } catch (uploadError: any) {
        const errorMessage = `Error uploading PDF during update: ${uploadError.message || 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, uploadError);
        setUploading(false);
        setLoading(false);
        return; // Stop execution if PDF upload fails
      }
    } else {
      setUploadMessage('No new PDF selected for update.');
    }

    const updatePayload = {
      ...editingCertificate,
      date_issued: updatedDateIssued,
      time_issued: updatedTimeIssued,
      expiry_date: finalExpiryDate,
      hours_quantity: editingCertificate.hours_quantity,
      pdf_url: pdfUrl, // Update the PDF URL
    };
    console.log('Attempting to update certificate with payload:', updatePayload);
    try {
      const { data, error: dbUpdateError } = await supabase
        .from('certificados')
        .update(updatePayload)
        .eq('id', editingCertificate.id); // Removed .select() for debugging

      if (dbUpdateError) {
        setError(`Error updating certificate: ${dbUpdateError.message || JSON.stringify(dbUpdateError)}`);
        console.error('Full database update error object:', dbUpdateError); // Log the full error object
        setUploadMessage(`Failed to save PDF link to database: ${dbUpdateError.message || 'Unknown error'}`);
      } else {
        console.log('Certificate updated successfully (no data returned from update without .select()):', data);
        // Re-fetch certificates to get the updated data, including pdf_url
        await fetchCertificates();
        setEditingCertificate(null);
        setSelectedFile(null); // Clear selected file
        setDeleteExistingPdf(false); // Reset delete checkbox
        setUploadMessage('Certificate updated and PDF link saved successfully!');
      }
    } catch (e: any) {
      setError(`An unexpected error occurred during certificate update: ${e.message || JSON.stringify(e)}`);
      console.error('Unexpected error during certificate update:', e);
      setUploadMessage(`An unexpected error occurred: ${e.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const deleteCertificate = async (id: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('certificados')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      console.error('Error deleting certificate:', error);
    } else {
      setCertificates((prev) => prev.filter((cert) => cert.id !== id));
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('QR Code link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const downloadQRCode = (id: string) => {
    const canvas = document.getElementById(`qrcode-${id}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333' }}>Certificate Management</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {loading && <p>Loading...</p>}

      <h2>{editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}</h2>
      <form onSubmit={editingCertificate ? updateCertificate : addCertificate} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
          <input
            type="text"
            name="first_name"
            value={editingCertificate ? editingCertificate.first_name : newCertificate.first_name}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Middle Name (Optional):</label>
          <input
            type="text"
            name="middle_name"
            value={editingCertificate?.middle_name || newCertificate.middle_name || ''}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Paternal Last Name:</label>
          <input
            type="text"
            name="paternal_last_name"
            value={editingCertificate ? editingCertificate.paternal_last_name : newCertificate.paternal_last_name}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Maternal Last Name (Optional):</label>
          <input
            type="text"
            name="maternal_last_name"
            value={editingCertificate?.maternal_last_name || newCertificate.maternal_last_name || ''}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Certificate:</label>
          <input
            type="text"
            name="certificate"
            value={editingCertificate ? editingCertificate.certificate : newCertificate.certificate}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Date Issued:</label>
          <input
            type="date"
            name="date_issued"
            value={editingCertificate ? editingCertificate.date_issued : newCertificate.date_issued}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Time Issued:</label>
          <input
            type="time"
            name="time_issued"
            value={editingCertificate ? editingCertificate.time_issued : newCertificate.time_issued}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Expiry Date:</label>
          <input
            type="date"
            name="expiry_date"
            value={editingCertificate?.expiry_date === 'Never' ? '' : (editingCertificate?.expiry_date || newCertificate.expiry_date || '')}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Hours Quantity:</label>
          <input
            type="number"
            name="hours_quantity"
            value={editingCertificate ? editingCertificate.hours_quantity : newCertificate.hours_quantity}
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
          <select
            name="status"
            value={editingCertificate ? editingCertificate.status : 'Valid'} // Default to Valid for new
            onChange={editingCertificate ? handleEditInputChange : handleInputChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          >
            <option value="Valid">Valid</option>
            <option value="Invalid">Invalid</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Upload PDF (Optional):</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            key={selectedFile ? selectedFile.name : 'no-file'} // Add key to reset input
          />
          {uploadMessage && <p style={{ marginTop: '5px', color: uploading ? 'blue' : (error ? 'red' : 'green') }}>{uploadMessage}</p>}
        </div>
        {editingCertificate && editingCertificate.pdf_url && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={deleteExistingPdf}
                onChange={(e) => setDeleteExistingPdf(e.target.checked)}
                style={{ marginRight: '5px' }}
              />
              Delete existing PDF
            </label>
          </div>
        )}
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }} disabled={uploading}>
          {editingCertificate ? (uploading ? 'Updating...' : 'Update Certificate') : (uploading ? 'Adding...' : 'Add Certificate')}
        </button>
        {editingCertificate && (
          <button type="button" onClick={() => { setEditingCertificate(null); setSelectedFile(null); setUploadMessage(''); setDeleteExistingPdf(false); }} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}>
            Cancel Edit
          </button>
        )}
      </form>

      <h2>Existing Certificates</h2>
      <div>
        {certificates.length === 0 ? (
          <p>No certificates found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Full Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Certificate</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date Issued</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Expiry Date</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>PDF Link</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>QR Code</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cert.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {cert.first_name} {cert.middle_name} {cert.paternal_last_name} {cert.maternal_last_name}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cert.certificate}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(`${cert.date_issued}T${cert.time_issued}`).toLocaleString(navigator.language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cert.expiry_date}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cert.status}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {cert.pdf_url ? (
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>View PDF</a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <QRCodeSVG
                      id={`qrcode-${cert.id}`}
                      value={`http://localhost:3000/admin/tool/certificate/index?code=${cert.id}`}
                      size={100}
                      level="H"
                      includeMargin={true}
                    />
                    <div style={{ marginTop: '5px' }}>
                      <button onClick={() => downloadQRCode(cert.id)} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Download</button>
                      <button onClick={() => copyToClipboard(`http://localhost:3000/admin/tool/certificate/index?code=${cert.id}`)} style={{ padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Copy Link</button>
                    </div>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={() => setEditingCertificate(cert)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Edit</button>
                    <button onClick={() => deleteCertificate(cert.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NewCertificatePage;
