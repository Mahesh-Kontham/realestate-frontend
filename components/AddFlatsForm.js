import { useState } from 'react';
import { supabase } from "../lib/supabaseClient";
import styles from './AddFlatsForm.module.css';



export default function AddFlatForm({ onClose, onFlatAdded }) {
  const [formData, setFormData] = useState({
    apartment_name: '',
    block: '',
    floor: '',
    owner_email: '',
    rent_amount: '',
    due_day: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.apartment_name || !formData.owner_email) {
      alert('Please fill apartment name and owner email');
      return;
    }

    const { error } = await supabase.from('flats').insert([
      {
        flat_id: crypto.randomUUID(),
        apartment_name: formData.apartment_name,
        block: formData.block,
        floor: formData.floor,
        owner_email: formData.owner_email,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
        due_day: formData.due_day ? parseInt(formData.due_day) : null,
      },
    ]);

    if (error) {
      console.error('Error inserting flat:', error);
      alert('Failed to add flat');
    } else {
      alert('Flat added successfully!');
      onFlatAdded(); // Refresh the list
      onClose(); // Close modal
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Add New Flat</h3>
        <form onSubmit={handleSubmit}>
          <input name="apartment_name" placeholder="Apartment Name" onChange={handleChange} />
          <input name="block" placeholder="Block" onChange={handleChange} />
          <input name="floor" placeholder="Floor" onChange={handleChange} />
          <input name="owner_email" type="email" placeholder="Owner Email" onChange={handleChange} />
          <input name="rent_amount" type="number" placeholder="Rent Amount" onChange={handleChange} />
          <input name="due_day" type="number" placeholder="Due Day" onChange={handleChange} />
          <div className={styles.modalButtons}>
            <button type="submit">Save</button>
            <button type="button" className="{style.cancel}" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
