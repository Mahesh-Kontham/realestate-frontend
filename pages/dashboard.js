import { supabase } from "../lib/supabaseClient";
import { useState } from "react";
import {useRouter} from "next/router";
import { useEffect } from "react";
import AddFlatsForm from '../components/AddFlatsForm';



export default function Dashboard() {
  const[flats,setFlats]=useState([]);
  const[loading,setloading]= useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchFlats = async () => {
  setloading(true);
  const { data, error } = await supabase.from('flats').select('*');
  if (error) {
    console.error('Error fetching flats:', error);
  } else {
    setFlats(data);
  }
  setLoading(false);
};


  useEffect(() => {
  const fetchFlats = async () => {
    const { data, error } = await supabase.from("flats").select("*");
    if (error) console.error(error);
    else setFlats(data);
    setloading(false);
  };
  fetchFlats();
}, []);

    
const router= useRouter();
    const handleLogout=()=>{
       localStorage.removeItem("userEmail");
         alert("you have loggedout");
         router.push("/");
    }
    useEffect(()=>{
      const user= localStorage.getItem("userEmail");
      if(!user){
        router.push("/");
      }
    },[])
    

  return (
     
     <div className="dashboard">
      <div className="navbar">
        

    <h1>🏡 Real Estate Dashboard</h1>
    <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </div>

    {/* Add Flat Button + Form */}
  <button className="add-btn" onClick={() => setShowForm(true)}>
    ➕ Add New Flat
  </button>

  {showForm && <AddFlatsForm onClose={() => setShowForm(false)} onFlatAdded={fetchFlats} />}
  <h2 style={{ 
  fontFamily: "'Poppins', sans-serif", 
  fontSize: '28px', 
  fontWeight: '600', 
  color: '#2c3e50', 
  marginBottom: '20px' 
}}>🏠 Available Flats</h2>
  {loading ? (
    <p>Loading flats...</p>
  ) : flats.length === 0 ? (
    <p>No flats found.</p>
  ) : (
    <div className="flats-grid">
      {flats.map((flat) => (
        <div key={flat.flat_id} className="flat-card">
          <h3>{flat.apartment_name}</h3>
          <p>🏢 Block: {flat.block || '—'}</p>
          <p>🏬 Floor: {flat.floor || '—'}</p>
          <p>📩 Owner: {flat.owner_email}</p>
          <p>💰 Rent: ₹{flat.rent_amount || 0}</p>
          <p>📅 Due Day: {flat.due_day || '-'}</p>
        </div>
      ))}
    </div>
  )}
</div>

);

}
