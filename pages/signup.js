import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Signup successful! You can now log in.");
      router.push("/"); // redirect to login page
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create an Account</h2>
      <form onSubmit={handleSignup} style={styles.form}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p style={styles.footer}>
        Already have an account?{" "}
        <a href="/" style={{ color: "#007bff" }}>
          Login
        </a>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "80px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  title: { marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ddd" },
  button: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  footer: { marginTop: "10px" },
};
