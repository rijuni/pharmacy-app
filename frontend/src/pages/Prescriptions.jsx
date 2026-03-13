import React, { useState } from 'react';
import { UploadCloud, CheckCircle, FileText } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Prescriptions = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
       <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Please log in to upload prescriptions</h2>
          <button onClick={() => navigate('/login')} className="bg-brand-500 text-white px-6 py-2 rounded-lg font-bold mt-4 shadow-sm">Go to Login</button>
       </div>
    );
 }

  const handleFileChange = (e) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
           setPreview(reader.result);
        };
        reader.readAsDataURL(file);
     }
  };

  const handleUpload = async () => {
     if (!selectedFile) return;
     
     setLoading(true);
     const formData = new FormData();
     formData.append('image', selectedFile);

     try {
        await api.post('orders/prescriptions/', formData, {
           headers: {
              'Content-Type': 'multipart/form-data',
           }
        });
        setSuccess(true);
        setTimeout(() => {
           navigate('/cart');
        }, 2000);
     } catch (err) {
        console.error("Upload failed", err);
     } finally {
        setLoading(false);
     }
  };

  return (
    <div className="max-w-2xl mx-auto">
       <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Prescription</h2>
          <p className="text-sm text-gray-500 mb-8">Please upload a valid prescription from your doctor. A pharmacist will verify it before your order is processed.</p>

          {!success ? (
            <>
               <label className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors mb-6 relative overflow-hidden group">
                  <input type="file" className="hidden" accept="image/*, .pdf" onChange={handleFileChange} />
                  
                  {preview ? (
                     <div className="absolute inset-0 w-full h-full bg-black/5 flex items-center justify-center p-2">
                        <img src={preview} alt="Prescription preview" className="max-w-full max-h-full object-contain rounded drop-shadow-md" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <span className="text-white font-bold inline-flex items-center gap-2"><UploadCloud size={20}/> Change File</span>
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className="bg-brand-50 p-4 rounded-full text-brand-500 mb-4">
                           <UploadCloud size={32} />
                        </div>
                        <span className="font-bold text-gray-800 mb-1">Click or drag file here to upload</span>
                        <span className="text-xs text-gray-400">Supported formats: JPEG, PNG, PDF</span>
                     </>
                  )}
               </label>
               
               <button 
                 disabled={!selectedFile || loading}
                 onClick={handleUpload}
                 className={`w-full py-3 rounded-lg font-bold shadow-sm transition-colors text-white ${!selectedFile || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600'}`}
               >
                 {loading ? 'Uploading...' : 'Submit Prescription'}
               </button>
            </>
          ) : (
             <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                <CheckCircle className="text-green-500 h-20 w-20 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Prescription Uploaded!</h3>
                <p className="text-gray-500">Redirecting you back to your cart...</p>
             </div>
          )}

          {/* Guide section */}
          <div className="mt-10 bg-blue-50 border border-blue-100 rounded-lg p-5">
             <h4 className="font-bold text-blue-900 text-sm mb-3">Guidelines for a valid prescription</h4>
             <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                <li>Must clearly show Patient Name and Doctor's Registration Number</li>
                <li>Date of prescription should not be older than 6 months (for most medicines)</li>
                <li>Do not crop any essential details</li>
             </ul>
          </div>
       </div>
    </div>
  );
};

export default Prescriptions;
